// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des verrous de séance (L3-36)

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { VerrouSeanceResponseDto } from './dto/verrou-seance-response.dto.js';
import { RoleCode, VerrouType } from '@takt/db';

/**
 * Vérifie que l'utilisateur courant est autorisé à poser/lever un verrou
 * (uniquement Gestionnaire ou Administrateur, conformément à EX-VRR-01).
 */
function verrouAutorise(role: string): void {
  if (role !== RoleCode.ADMINISTRATEUR && role !== RoleCode.GESTIONNAIRE) {
    throw new ForbiddenException(
      'Seul un Gestionnaire ou un Administrateur peut poser ou lever un verrou de séance',
    );
  }
}

@Injectable()
export class VerrouSeanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Pose un verrou sur une séance.
   * 404 si la séance est introuvable.
   * 423 si un verrou actif existe déjà pour (séance, type).
   */
  async pose(
    seanceId: string,
    type: VerrouType,
    auteurId: string,
    justification: string | undefined,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    verrouAutorise(currentUser.role);

    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      select: { id: true, versionId: true },
    });
    if (!seance) {
      throw new NotFoundException(`Séance ${seanceId} introuvable`);
    }

    const existing = await this.prisma.verrouSeance.findFirst({
      where: { seanceId, type, leveLe: null },
    });
    if (existing) {
      throw new ConflictException({
        code: 'VERROU_ACTIF',
        message: `Un verrou de type ${type} est déjà actif sur cette séance`,
        heldBy: existing.auteurId,
        creeLe: existing.creeLe,
      } as any);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const verrou = await (tx as unknown as PrismaService).verrouSeance.create({
        data: {
          seanceId,
          versionId: seance.versionId!,
          type,
          auteurId,
          justification,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'VERROU_POSE',
        objetType: 'VerrouSeance',
        objetId: verrou.id,
        ancienneValeur: undefined,
        nouvelleValeur: {
          seanceId: verrou.seanceId,
          type: verrou.type,
          auteurId: verrou.auteurId,
          justification: verrou.justification,
          creeLe: verrou.creeLe,
        },
        versionId: seance.versionId!,
        motif: `Pose d'un verrou ${type} sur la séance ${seanceId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(
        tx as unknown as PrismaService,
        auditData,
      );

      return verrou;
    });

    return VerrouSeanceResponseDto.fromPrisma(result);
  }

  /**
   * Leve le verrou actif sur une séance pour un type donné.
   * 404 si aucun verrou actif n'existe pour (séance, type).
   * Seuls Gestionnaire et Administrateur peuvent lever.
   */
  async leve(
    seanceId: string,
    type: VerrouType,
    auteurId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    verrouAutorise(currentUser.role);

    const existing = await this.prisma.verrouSeance.findFirst({
      where: { seanceId, type, leveLe: null },
      select: { id: true, seanceId: true, versionId: true, auteurId: true, type: true, creeLe: true },
    });
    if (!existing) {
      throw new NotFoundException(
        `Aucun verrou actif de type ${type} sur la séance ${seanceId}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const verrou = await (tx as unknown as PrismaService).verrouSeance.update({
        where: { id: existing.id },
        data: {
          leveLe: new Date(),
          levePar: currentUser.id,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'VERROU_LEVE',
        objetType: 'VerrouSeance',
        objetId: verrou.id,
        ancienneValeur: {
          seanceId: existing.seanceId,
          type: existing.type,
          auteurId: existing.auteurId,
          leveLe: null,
          levePar: null,
        },
        nouvelleValeur: {
          seanceId: verrou.seanceId,
          type: verrou.type,
          auteurId: verrou.auteurId,
          leveLe: verrou.leveLe,
          levePar: verrou.levePar,
        },
        versionId: existing.versionId!,
        motif: `Levée du verrou ${type} sur la séance ${seanceId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(
        tx as unknown as PrismaService,
        auditData,
      );

      return verrou;
    });

    return VerrouSeanceResponseDto.fromPrisma(result);
  }

  /**
   * Liste tous les verrous (actifs et levés) d'une séance.
   */
  async lister(seanceId: string): Promise<VerrouSeanceResponseDto[]> {
    const verrous = await this.prisma.verrouSeance.findMany({
      where: { seanceId },
      orderBy: { creeLe: 'desc' },
    });
    return verrous.map((v) => VerrouSeanceResponseDto.fromPrisma(v));
  }
}
