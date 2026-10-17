import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateActivityTagDto,
  UpdateActivityTagDto,
  ActivityTagResponseDto,
  PaginatedActivityTagsDto,
  ActivityTagsQueryDto,
} from './dto/activity-tag.dto.js';

@Injectable()
export class ActivityTagsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createActivityTag(
    dto: CreateActivityTagDto,
    userId: string,
  ): Promise<ActivityTagResponseDto> {
    const existing = await this.prisma.activityTag.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Le tag "${dto.code}" existe déjà`);
    }

    const tag = await this.audit.auditTransaction(
      async (tx) => {
        return tx.activityTag.create({
          data: {
            code: dto.code.toUpperCase(),
            libelle: dto.libelle,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ActivityTag',
        motif: `Création tag activité ${dto.code}`,
      },
    );

    return this.toActivityTagDto(tag);
  }

  async findAllActivityTags(
    query: ActivityTagsQueryDto,
  ): Promise<PaginatedActivityTagsDto> {
    const { page = 1, limit = 10, search, isActive = true } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { libelle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activityTag.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.activityTag.count({ where }),
    ]);

    return {
      data: data.map((t) => this.toActivityTagDto(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActivityTagById(id: string): Promise<ActivityTagResponseDto> {
    const tag = await this.prisma.activityTag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag activité non trouvé');
    }
    return this.toActivityTagDto(tag);
  }

  async updateActivityTag(
    id: string,
    dto: UpdateActivityTagDto,
    userId: string,
  ): Promise<ActivityTagResponseDto> {
    const existing = await this.prisma.activityTag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tag activité non trouvé');
    }

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      const dup = await this.prisma.activityTag.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (dup) {
        throw new ConflictException(`Le tag "${dto.code}" existe déjà`);
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code.toUpperCase();
    if (dto.libelle !== undefined) data.libelle = dto.libelle;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const tag = await this.audit.auditTransaction(
      async (tx) => {
        return tx.activityTag.update({ where: { id }, data });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ActivityTag',
        objetId: id,
        motif: `Mise à jour tag activité ${existing.code}`,
      },
    );

    return this.toActivityTagDto(tag);
  }

  async removeActivityTag(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.activityTag.findUnique({
      where: { id },
      include: { typesEnseignement: true },
    });
    if (!existing) {
      throw new NotFoundException('Tag activité non trouvé');
    }

    if (existing.typesEnseignement.length > 0) {
      throw new ConflictException(
        `Le tag "${existing.code}" est référencé par ${existing.typesEnseignement.length} type(s) d'enseignement. Désactivez-le au lieu de le supprimer.`,
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.activityTag.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'ActivityTag',
        objetId: id,
        motif: `Suppression tag activité ${existing.code}`,
      },
    );
  }

  private toActivityTagDto(tag: {
    id: string;
    code: string;
    libelle: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ActivityTagResponseDto {
    return {
      id: tag.id,
      code: tag.code,
      libelle: tag.libelle,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}