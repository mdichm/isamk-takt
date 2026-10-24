// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service du rapport de traduction FET (L4-06)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ContrainteInstance,
  ContrainteDefinition,
} from '@takt/db';
import {
  FetMappingReportDto,
  FetMappingItemDto,
} from './dto/contrainte-fet-mapping.dto.js';

@Injectable()
export class ContrainteFetMappingService {
  constructor(private prisma: PrismaService) {}

  /** Génère le rapport de traduction FET pour un semestre. */
  async genererRapportFetMapping(
    semestreId: string,
  ): Promise<FetMappingReportDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const instances = await this.prisma.contrainteInstance.findMany({
      where: { semestreId, actif: true },
      include: { definition: true },
      orderBy: [{ definition: { code: 'asc' } }, { id: 'asc' }],
    });

    const items = instances.map((instance) =>
      this.determinerStatut(instance),
    );

    const stats = {
      TRADUITE: items.filter((i) => i.statut === 'TRADUITE').length,
      PARTIELLE: items.filter((i) => i.statut === 'PARTIELLE').length,
      NON_TRADUITE: items.filter((i) => i.statut === 'NON_TRADUITE').length,
    };

    return {
      semestreId,
      items,
      total: items.length,
      stats,
    };
  }

  private determinerStatut(
    instance: ContrainteInstance & { definition: ContrainteDefinition },
  ): FetMappingItemDto {
    const def = instance.definition;

    // poids = 0 → contrainte inactivée
    if (instance.poids === 0) {
      return {
        regleCode: def.code,
        statut: 'NON_TRADUITE',
        raison: 'Contrainte inactivée (poids = 0)',
        controleeParApplication: false,
        definitionId: def.id,
      };
    }

    // APPLICATION_ONLY → non traduite, contrôlée par l'application
    if (def.traductionFET === 'APPLICATION_ONLY') {
      return {
        regleCode: def.code,
        statut: 'NON_TRADUITE',
        raison: 'Évaluée par l\'application (APPLICATION_ONLY)',
        controleeParApplication: true,
        definitionId: def.id,
      };
    }

    // fetSupport = AUCUN → aucun équivalent FET
    if (def.fetSupport === 'AUCUN') {
      return {
        regleCode: def.code,
        statut: 'NON_TRADUITE',
        raison: 'Aucun équivalent FET',
        controleeParApplication: false,
        definitionId: def.id,
      };
    }

    // fetSupport = PARTIEL → traduction partielle
    if (def.fetSupport === 'PARTIEL') {
      return {
        regleCode: def.code,
        statut: 'PARTIELLE',
        raison: 'Support partiel par FET - traduction approximative',
        controleeParApplication: false,
        definitionId: def.id,
      };
    }

    // FET_SUPPORTED ou FET_TRANSFORMED → traduite
    return {
      regleCode: def.code,
      statut: 'TRADUITE',
      controleeParApplication: false,
      definitionId: def.id,
    };
  }
}