// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de paramétrage des circuits de workflow (L5-17)
// GET et PATCH /parametres/workflow — audit transactionnel sur chaque modification

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { WorkflowParamsResponseDto } from './dto/workflow-params-response.dto.js';
import { WorkflowParamsUpdateDto } from './dto/workflow-params-update.dto.js';


const PARAMETRE_ID = 1;

/**
 * Service de lecture et mise à jour des paramètres globaux du workflow.
 * La ligne unique est identifiée par id = 1 (contrainte CHECK dans le schéma Prisma).
 */
@Injectable()
export class ParametresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lit les paramètres globaux du workflow.
   * Retourne la ligne unique (id = 1) ou lève une NotFoundException si absente.
   */
  async getParams(): Promise<WorkflowParamsResponseDto> {
    const parametre = await this.prisma.parametreWorkflow.findUnique({
      where: { id: PARAMETRE_ID },
      select: {
        id: true,
        validationPlanningRequise: true,
        publicationRequise: true,
        updatedAt: true,
        updatedBy: true,
      },
    });

    if (!parametre) {
      throw new NotFoundException(
        'Aucun paramètre de workflow trouvé (ligne id = 1 attendue).',
      );
    }

    return {
      validationPlanningRequise: parametre.validationPlanningRequise,
      publicationRequise: parametre.publicationRequise,
      updatedAt: parametre.updatedAt,
      updatedBy: parametre.updatedBy ?? null,
    };
  }

  /**
   * Met à jour les paramètres globaux du workflow.
   * Au moins un des deux interrupteurs doit être présent.
   * L'écriture métier et l'audit sont exécutés dans la même transaction Prisma.
   */
  async updateParams(
    dto: WorkflowParamsUpdateDto,
    userId: string,
  ): Promise<WorkflowParamsResponseDto> {
    if (dto.validationPlanningRequise === undefined && dto.publicationRequise === undefined) {
      throw new BadRequestException(
        'Au moins un des champs validationPlanningRequise ou publicationRequise doit être présent.',
      );
    }

    // Lecture de l'état avant modification (hors transaction, lecture cohérente)
    const avant = await this.prisma.parametreWorkflow.findUnique({
      where: { id: PARAMETRE_ID },
      select: {
        id: true,
        validationPlanningRequise: true,
        publicationRequise: true,
      },
    });

    if (!avant) {
      throw new NotFoundException(
        'Aucun paramètre de workflow trouvé (ligne id = 1 attendue).',
      );
    }

    const nouvelleValeur: Record<string, unknown> = {
      validationPlanningRequise:
        dto.validationPlanningRequise ?? avant.validationPlanningRequise,
      publicationRequise:
        dto.publicationRequise ?? avant.publicationRequise,
    };

    const updated = await this.auditService.auditTransaction(
      async (tx) => {
        const data: Record<string, unknown> = {};
        if (dto.validationPlanningRequise !== undefined) {
          data.validationPlanningRequise = dto.validationPlanningRequise;
        }
        if (dto.publicationRequise !== undefined) {
          data.publicationRequise = dto.publicationRequise;
        }

        return tx.parametreWorkflow.update({
          where: { id: PARAMETRE_ID },
          data: {
            ...data,
            updatedBy: userId,
          },
          select: {
            id: true,
            validationPlanningRequise: true,
            publicationRequise: true,
            updatedAt: true,
            updatedBy: true,
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ParametreWorkflow',
        objetId: String(PARAMETRE_ID),
        ancienneValeur: {
          validationPlanningRequise: avant.validationPlanningRequise,
          publicationRequise: avant.publicationRequise,
        },
        nouvelleValeur,
        motif: dto.motif,
      },
    ) as unknown as WorkflowParamsResponseDto;

    return {
      validationPlanningRequise: updated.validationPlanningRequise,
      publicationRequise: updated.publicationRequise,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy ?? null,
    };
  }
}
