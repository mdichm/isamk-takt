// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'acceptation des avertissements (L3-39)
// Accepte un avertissement (conflit AVERTISSEMENT), trace l'action et l'audite
// dans la même transaction (EX-CTR-07, ST §4.15, §0.5).

import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { ConflitSeverite } from '@takt/db';
import { AvertissementAccepteResponseDto } from './dto/avertissement-accepte-response.dto.js';
import { AvertissementImpactDto } from './dto/avertissement-accepte-response.dto.js';

const BLOCKING_NOT_ACCEPTABLE = 'BLOCKING_NOT_ACCEPTABLE';

@Injectable()
export class AvertissementService {
  private readonly logger = new Logger(AvertissementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Accepte un avertissement pour une version donnée.
   *
   * - 404 si la version est introuvable.
   * - 404 si aucun conflit non résolu avec cette signature n'existe sur la version.
   * - 422 BLOCKING_NOT_ACCEPTABLE si le conflit est de sévérité BLOQUANT.
   * - L'acceptation est écrite dans la même transaction que l'audit (atomicité).
   * - La sévérité stockée dans Conflit n'est jamais modifiée.
   */
  async accept(
    versionId: string,
    signature: string,
    justification: string | undefined,
    currentUser: { id: string; role: string },
  ): Promise<AvertissementAccepteResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} introuvable`);
    }

    const conflit = await this.prisma.conflit.findFirst({
      where: {
        versionId,
        signature,
        resoluLe: null,
      },
    });
    if (!conflit) {
      throw new NotFoundException(
        `Aucun conflit non résolu avec la signature ${signature} sur la version ${versionId}`,
      );
    }

    // Un conflit bloquant ne peut jamais être accepté (422).
    if (conflit.severite === ConflitSeverite.BLOQUANT) {
      throw new HttpException(
        {
          code: BLOCKING_NOT_ACCEPTABLE,
          message:
            'Un conflit bloquant ne peut pas être accepté (BLOCKING_NOT_ACCEPTABLE)',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // La sévérité stockée dans Conflit n'est jamais modifiée.

    const impact: AvertissementImpactDto = {
      seanceIds: conflit.seanceIds,
      regleCode: conflit.regleCode,
      message: conflit.message,
      details: conflit.details as Record<string, unknown> | undefined,
    };

    const versionRevision = await this.prisma.avertissementAccepte.count({
      where: { versionId },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const accepte = await (tx as unknown as PrismaService).avertissementAccepte.create({
        data: {
          versionId,
          regleCode: conflit.regleCode,
          signature,
          seanceIds: conflit.seanceIds,
          auteurId: currentUser.id,
          justification,
          versionRevision,
          acceptePar: currentUser.id,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'AVERTISSEMENT_ACCEPTE',
        objetType: 'AvertissementAccepte',
        objetId: accepte.id,
        ancienneValeur: undefined,
        nouvelleValeur: {
          versionId: accepte.versionId,
          regleCode: accepte.regleCode,
          signature: accepte.signature,
          seanceIds: accepte.seanceIds,
          justification: accepte.justification,
          accepteLe: accepte.accepteLe,
        },
        versionId,
        motif: `Acceptation de l'avertissement ${conflit.regleCode} (signature ${signature})`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);

      return accepte;
    });

    return AvertissementAccepteResponseDto.fromPrisma(
      {
        id: result.id,
        versionId: result.versionId,
        regleCode: result.regleCode,
        signature: result.signature,
        seanceIds: result.seanceIds,
        auteurId: result.auteurId,
        justification: result.justification,
        versionRevision: result.versionRevision,
        acceptePar: result.acceptePar,
        accepteLe: result.accepteLe,
        caduqueLe: result.caduqueLe,
      },
      impact,
    );
  }
}
