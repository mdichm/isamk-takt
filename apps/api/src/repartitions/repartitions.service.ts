import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateRepartitionDto,
  UpdateRepartitionDto,
  RepartitionResponseDto,
  PaginatedRepartitionsDto,
  RepartitionQueryDto,
} from './dto/repartition.dto.js';
import { RepartitionStatut } from '@takt/db';

const toRepartitionDto = (entity: any): RepartitionResponseDto => ({
  id: entity.id,
  semestreId: entity.semestreId,
  departementId: entity.departementId,
  statut: entity.statut,
  libelle: entity.libelle ?? undefined,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

@Injectable()
export class RepartitionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createRepartition(
    dto: CreateRepartitionDto,
    userId: string,
  ): Promise<RepartitionResponseDto> {
    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre ${dto.semestreId} introuvable`);
    }

    // Vérifier que le département existe
    const departement = await this.prisma.departement.findUnique({
      where: { id: dto.departementId },
    });
    if (!departement) {
      throw new NotFoundException(`Département ${dto.departementId} introuvable`);
    }

    // Vérifier l'unicité de (semestreId, departementId)
    const existing = await this.prisma.repartition.findFirst({
      where: {
        semestreId: dto.semestreId,
        departementId: dto.departementId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Une répartition existe déjà pour ce semestre et ce département`,
      );
    }

    const statut = dto.statut ?? RepartitionStatut.BROUILLON;

    const repartition = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.create({
          data: {
            semestreId: dto.semestreId,
            departementId: dto.departementId,
            statut,
            libelle: dto.libelle ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Repartition',
        motif: `Création répartition semestre=${dto.semestreId} departement=${dto.departementId}`,
      },
    );

    return toRepartitionDto(repartition);
  }

  async findAllRepartitions(
    query: RepartitionQueryDto,
  ): Promise<PaginatedRepartitionsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    if (query.statut) {
      where.statut = query.statut;
    }

    if (query.semestreId) {
      where.semestreId = query.semestreId;
    }

    if (query.departementId) {
      where.departementId = query.departementId;
    }

    const [repartitions, total] = await Promise.all([
      this.prisma.repartition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          semestre: { select: { id: true, numero: true } },
          departement: { select: { id: true, code: true, libelle: true } },
        },
      }),
      this.prisma.repartition.count({ where }),
    ]);

    return {
      data: repartitions.map((r) => ({
        id: r.id,
        semestreId: r.semestreId,
        departementId: r.departementId,
        statut: r.statut,
        libelle: r.libelle ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRepartitionById(id: string): Promise<RepartitionResponseDto> {
    const repartition = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!repartition) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }
    return toRepartitionDto(repartition);
  }

  async updateRepartition(
    id: string,
    dto: UpdateRepartitionDto,
    userId: string,
  ): Promise<RepartitionResponseDto> {
    const existing = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }

    const updated = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.update({
          where: { id },
          data: {
            ...(dto.statut !== undefined && { statut: dto.statut }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Repartition',
        objetId: id,
        motif: `Mise à jour répartition ${id}`,
      },
    );

    return toRepartitionDto(updated);
  }

  async removeRepartition(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }

    await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Repartition',
        objetId: id,
        motif: `Suppression répartition ${id}`,
      },
    );
  }
}
