// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service compatibilité (salle/tag, exigences d'équipement) — L1-11

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
import { ExigenceNiveau } from '@takt/db';
import type { SalleActivityTag, ExigenceEquipement } from '@takt/db';
import {
  CreateSalleActivityTagDto,
  SalleActivityTagResponseDto,
  PaginatedSalleActivityTagsDto,
  SalleActivityTagQueryDto,
  CreateExigenceEquipementDto,
  UpdateExigenceEquipementDto,
  ExigenceEquipementResponseDto,
  PaginatedExigencesEquipementDto,
  ExigenceEquipementQueryDto,
} from './dto/compat.dto.js';

@Injectable()
export class CompatService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ============================================
  // Salle / Activity Tag (compatibilité tag d'une salle)
  // ============================================

  async createSalleActivityTag(dto: CreateSalleActivityTagDto, userId: string): Promise<SalleActivityTagResponseDto> {
    const [salle, tag] = await Promise.all([
      this.prisma.salle.findUnique({ where: { id: dto.salleId } }),
      this.prisma.activityTag.findUnique({ where: { id: dto.activityTagId } }),
    ]);
    if (!salle) {
      throw new NotFoundException('Salle non trouvée');
    }
    if (!tag) {
      throw new NotFoundException('Activity tag non trouvé');
    }

    const existing = await this.prisma.salleActivityTag.findFirst({
      where: { salleId: dto.salleId, activityTagId: dto.activityTagId },
    });
    if (existing) {
      throw new ConflictException('Ce tag est déjà autorisé pour cette salle');
    }

    const result = await this.audit.auditTransaction<SalleActivityTag>(
      async (tx) =>
        tx.salleActivityTag.create({
          data: { salleId: dto.salleId, activityTagId: dto.activityTagId },
        }),
      {
        userId,
        action: 'CREATE',
        objetType: 'SalleActivityTag',
        motif: `Autorisation du tag ${dto.activityTagId} sur la salle ${dto.salleId}`,
      },
    );

    return this.toSalleActivityTagDto(result);
  }

  async findAllSalleActivityTags(query: SalleActivityTagQueryDto): Promise<PaginatedSalleActivityTagsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.salleId) {
      where.salleId = query.salleId;
    }
    if (query.activityTagId) {
      where.activityTagId = query.activityTagId;
    }

    const [tags, total] = await Promise.all([
      this.prisma.salleActivityTag.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ salleId: 'asc' }, { activityTagId: 'asc' }],
      }),
      this.prisma.salleActivityTag.count({ where }),
    ]);

    return {
      data: tags.map(this.toSalleActivityTagDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSalleActivityTag(salleId: string, activityTagId: string): Promise<SalleActivityTagResponseDto> {
    const tag = await this.prisma.salleActivityTag.findFirst({ where: { salleId, activityTagId } });
    if (!tag) {
      throw new NotFoundException('Compatibilité salle/tag non trouvée');
    }
    return this.toSalleActivityTagDto(tag);
  }

  async removeSalleActivityTag(salleId: string, activityTagId: string, userId: string): Promise<void> {
    const existing = await this.prisma.salleActivityTag.findFirst({ where: { salleId, activityTagId } });
    if (!existing) {
      throw new NotFoundException('Compatibilité salle/tag non trouvée');
    }

    await this.audit.auditTransaction(
      async (tx) => tx.salleActivityTag.deleteMany({ where: { salleId, activityTagId } }),
      {
        userId,
        action: 'DELETE',
        objetType: 'SalleActivityTag',
        objetId: `${salleId}:${activityTagId}`,
        motif: `Suppression du tag ${activityTagId} de la salle ${salleId}`,
      },
    );
  }

  private toSalleActivityTagDto(tag: { salleId: string; activityTagId: string }): SalleActivityTagResponseDto {
    return { salleId: tag.salleId, activityTagId: tag.activityTagId };
  }
  // ============================================
  // Exigences d'équipement par (module, type d'enseignement)
  // ============================================

  async createExigenceEquipement(dto: CreateExigenceEquipementDto, userId: string): Promise<ExigenceEquipementResponseDto> {
    const [module, type, equipement] = await Promise.all([
      this.prisma.module.findUnique({ where: { id: dto.moduleId } }),
      this.prisma.typeEnseignement.findUnique({ where: { id: dto.typeEnseignementId } }),
      this.prisma.equipement.findUnique({ where: { id: dto.equipementId } }),
    ]);
    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }
    if (!type) {
      throw new NotFoundException('Type d\'enseignement non trouvé');
    }
    if (!equipement) {
      throw new NotFoundException('Équipement non trouvé');
    }

    const existing = await this.prisma.exigenceEquipement.findFirst({
      where: { moduleId: dto.moduleId, typeEnseignementId: dto.typeEnseignementId, equipementId: dto.equipementId },
    });
    if (existing) {
      throw new ConflictException('Cette exigence d\'équipement existe déjà');
    }

    const niveau = dto.niveau ?? ExigenceNiveau.OBLIGATOIRE;

    const result = await this.audit.auditTransaction<ExigenceEquipement>(
      async (tx) =>
        tx.exigenceEquipement.create({
          data: {
            moduleId: dto.moduleId,
            typeEnseignementId: dto.typeEnseignementId,
            equipementId: dto.equipementId,
            niveau,
          },
        }),
      {
        userId,
        action: 'CREATE',
        objetType: 'ExigenceEquipement',
        motif: `Exigence équipement ${dto.equipementId} pour le module ${dto.moduleId} / type ${dto.typeEnseignementId}`,
      },
    );

    return this.toExigenceEquipementDto(result);
  }

  async findAllExigencesEquipement(query: ExigenceEquipementQueryDto): Promise<PaginatedExigencesEquipementDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.moduleId) {
      where.moduleId = query.moduleId;
    }
    if (query.typeEnseignementId) {
      where.typeEnseignementId = query.typeEnseignementId;
    }
    if (query.equipementId) {
      where.equipementId = query.equipementId;
    }
    if (query.niveau) {
      where.niveau = query.niveau;
    }

    const [exigences, total] = await Promise.all([
      this.prisma.exigenceEquipement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ moduleId: 'asc' }, { typeEnseignementId: 'asc' }, { equipementId: 'asc' }],
      }),
      this.prisma.exigenceEquipement.count({ where }),
    ]);

    return {
      data: exigences.map(this.toExigenceEquipementDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findExigenceEquipement(
    moduleId: string,
    typeEnseignementId: string,
    equipementId: string,
  ): Promise<ExigenceEquipementResponseDto> {
    const exigence = await this.prisma.exigenceEquipement.findFirst({
      where: { moduleId, typeEnseignementId, equipementId },
    });
    if (!exigence) {
      throw new NotFoundException('Exigence d\'équipement non trouvée');
    }
    return this.toExigenceEquipementDto(exigence);
  }

  async updateExigenceEquipement(
    moduleId: string,
    typeEnseignementId: string,
    equipementId: string,
    dto: UpdateExigenceEquipementDto,
    userId: string,
  ): Promise<ExigenceEquipementResponseDto> {
    const existing = await this.prisma.exigenceEquipement.findFirst({
      where: { moduleId, typeEnseignementId, equipementId },
    });
    if (!existing) {
      throw new NotFoundException('Exigence d\'équipement non trouvée');
    }

    await this.audit.auditTransaction(
      async (tx) =>
        tx.exigenceEquipement.updateMany({
          where: { moduleId, typeEnseignementId, equipementId },
          data: { ...(dto.niveau !== undefined && { niveau: dto.niveau }) },
        }),
      {
        userId,
        action: 'UPDATE',
        objetType: 'ExigenceEquipement',
        objetId: `${moduleId}:${typeEnseignementId}:${equipementId}`,
        motif: `Mise à jour exigence équipement ${equipementId}`,
      },
    );

    return this.toExigenceEquipementDto({ ...existing, ...(dto.niveau !== undefined && { niveau: dto.niveau }) });
  }

  async removeExigenceEquipement(
    moduleId: string,
    typeEnseignementId: string,
    equipementId: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.prisma.exigenceEquipement.findFirst({
      where: { moduleId, typeEnseignementId, equipementId },
    });
    if (!existing) {
      throw new NotFoundException('Exigence d\'équipement non trouvée');
    }

    await this.audit.auditTransaction(
      async (tx) => tx.exigenceEquipement.deleteMany({ where: { moduleId, typeEnseignementId, equipementId } }),
      {
        userId,
        action: 'DELETE',
        objetType: 'ExigenceEquipement',
        objetId: `${moduleId}:${typeEnseignementId}:${equipementId}`,
        motif: `Suppression exigence équipement ${equipementId}`,
      },
    );
  }

  private toExigenceEquipementDto(e: {
    moduleId: string;
    typeEnseignementId: string;
    equipementId: string;
    niveau: ExigenceNiveau;
  }): ExigenceEquipementResponseDto {
    return {
      moduleId: e.moduleId,
      typeEnseignementId: e.typeEnseignementId,
      equipementId: e.equipementId,
      niveau: e.niveau,
    };
  }
}

