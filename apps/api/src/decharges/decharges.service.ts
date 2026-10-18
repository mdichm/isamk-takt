import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateDechargeDto,
  UpdateDechargeDto,
  DechargeResponseDto,
  PaginatedDechargesDto,
  DechargesQueryDto,
} from './dto/decharge.dto.js';

@Injectable()
export class DechargesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createDecharge(
    dto: CreateDechargeDto,
    userId: string,
  ): Promise<DechargeResponseDto> {
    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: dto.enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException('Enseignant non trouvé');
    }

    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException('Semestre non trouvé');
    }

    // Vérifier qu'il n'existe pas déjà une décharge pour ce (enseignant, semestre)
    const existing = await this.prisma.decharge.findFirst({
      where: {
        enseignantId: dto.enseignantId,
        semestreId: dto.semestreId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Une décharge existe déjà pour cet enseignant et ce semestre`,
      );
    }

    const decharge = await this.audit.auditTransaction(
      async (tx) => {
        return tx.decharge.create({
          data: {
            heures: dto.heures,
            enseignantId: dto.enseignantId,
            semestreId: dto.semestreId,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Decharge',
        motif: `Création décharge ${dto.heures}h pour l'enseignant ${enseignant.matricule} (semestre ${semestre.numero})`,
      },
    );

    return this.toDechargeDto(decharge);
  }

  async findAllDecharges(
    query: DechargesQueryDto,
  ): Promise<PaginatedDechargesDto> {
    const {
      page = 1,
      limit = 10,
      enseignantId,
      semestreId,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (enseignantId) where.enseignantId = enseignantId;
    if (semestreId) where.semestreId = semestreId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.decharge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.decharge.count({ where }),
    ]);

    return {
      data: data.map((d) => this.toDechargeDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDechargeById(id: string): Promise<DechargeResponseDto> {
    const decharge = await this.prisma.decharge.findUnique({
      where: { id },
    });
    if (!decharge) {
      throw new NotFoundException('Décharge non trouvée');
    }
    return this.toDechargeDto(decharge);
  }

  async updateDecharge(
    id: string,
    dto: UpdateDechargeDto,
    userId: string,
  ): Promise<DechargeResponseDto> {
    const existing = await this.prisma.decharge.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Décharge non trouvée');
    }

    // Si on change l'enseignant ou le semestre, vérifier l'unicité
    if ((dto.enseignantId || existing.enseignantId) !== existing.enseignantId ||
        (dto.semestreId || existing.semestreId) !== existing.semestreId) {
      const conflit = await this.prisma.decharge.findFirst({
        where: {
          enseignantId: dto.enseignantId ?? existing.enseignantId,
          semestreId: dto.semestreId ?? existing.semestreId,
          id: { not: id },
        },
      });
      if (conflit) {
        throw new ConflictException(
          `Une décharge existe déjà pour cet enseignant et ce semestre`,
        );
      }
    }

    const decharge = await this.audit.auditTransaction(
      async (tx) => {
        return tx.decharge.update({
          where: { id },
          data: {
            ...(dto.heures !== undefined && { heures: dto.heures }),
            ...(dto.enseignantId !== undefined && { enseignantId: dto.enseignantId }),
            ...(dto.semestreId !== undefined && { semestreId: dto.semestreId }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Decharge',
        objetId: id,
        motif: `Mise à jour décharge ${id}`,
      },
    );

    return this.toDechargeDto(decharge);
  }

  async removeDecharge(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.decharge.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Décharge non trouvée');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.decharge.delete({
          where: { id },
        });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Decharge',
        objetId: id,
        motif: `Suppression décharge ${id}`,
      },
    );
  }

  private toDechargeDto(decharge: {
    id: string;
    heures: number;
    enseignantId: string;
    semestreId: string;
    createdAt: Date;
    updatedAt: Date;
  }): DechargeResponseDto {
    return {
      id: decharge.id,
      heures: decharge.heures,
      enseignantId: decharge.enseignantId,
      semestreId: decharge.semestreId,
      createdAt: decharge.createdAt,
      updatedAt: decharge.updatedAt,
    };
  }
}