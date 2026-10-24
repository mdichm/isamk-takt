// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des exigences de salle par activité (L3-43)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateExigenceSalleActiviteDto,
  UpdateExigenceSalleActiviteDto,
  ExigenceSalleActiviteResponseDto,
  ExigenceSalleAutoriseeDto,
} from './dto/exigences-salle.dto.js';

function toResponse(
  exigence: {
    id: string;
    semestreId: string;
    affectationKey: string;
    salleImposeeId: string | null;
    salleImposee: { code: string } | null;
    autorisees: {
      salle: { id: string; code: string | null };
    }[];
    creePar: string;
    creeLe: Date;
    updatedAt: Date;
  },
): ExigenceSalleActiviteResponseDto {
  return {
    id: exigence.id,
    semestreId: exigence.semestreId,
    affectationKey: exigence.affectationKey,
    salleImposeeId: exigence.salleImposeeId ?? undefined,
    salleImposeeCode: exigence.salleImposee?.code ?? undefined,
    autorisees: exigence.autorisees.map((a) => ({
      salleId: a.salle.id,
      code: a.salle.code ?? undefined,
    })) as ExigenceSalleAutoriseeDto[],
    creePar: exigence.creePar,
    creeLe: exigence.creeLe,
    updatedAt: exigence.updatedAt,
  };
}

@Injectable()
export class ExigencesSalleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateExigenceSalleActiviteDto,
    userId: string,
  ): Promise<ExigenceSalleActiviteResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    if (dto.salleImposeeId) {
      const salle = await this.prisma.salle.findUnique({
        where: { id: dto.salleImposeeId },
      });
      if (!salle) {
        throw new NotFoundException(
          `Salle imposée "${dto.salleImposeeId}" introuvable`,
        );
      }
    }

    if (dto.autorisees?.length) {
      const salles = await this.prisma.salle.findMany({
        where: { id: { in: dto.autorisees } },
      });
      if (salles.length !== dto.autorisees.length) {
        throw new BadRequestException(
          'Une ou plusieurs salles autorisées sont introuvables.',
        );
      }
    }

    const exists = await this.prisma.exigenceSalleActivite.findFirst({
      where: {
        semestreId: dto.semestreId,
        affectationKey: dto.affectationKey,
      },
    });
    if (exists) {
      throw new ConflictException(
        'Une exigence de salle existe déjà pour cette affectation sur ce semestre.',
      );
    }

    const exigence = await this.prisma.exigenceSalleActivite.create({
      data: {
        semestreId: dto.semestreId,
        affectationKey: dto.affectationKey,
        salleImposeeId: dto.salleImposeeId ?? null,
        creePar: userId,
        autorisees: dto.autorisees?.length
          ? {
              create: dto.autorisees.map((salleId) => ({ salleId })),
            }
          : undefined,
      },
      include: {
        salleImposee: { select: { code: true } },
        autorisees: {
          include: { salle: { select: { id: true, code: true } } },
        },
      },
    });
    return toResponse(exigence as any);
  }
  async findAll(
    query: { semestreId?: string; page?: number; limit?: number },
  ): Promise<{
    data: ExigenceSalleActiviteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const where = query.semestreId ? { semestreId: query.semestreId } : {};

    const [exigences, total] = await this.prisma.$transaction([
      this.prisma.exigenceSalleActivite.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { creeLe: 'desc' },
        include: {
          salleImposee: { select: { code: true } },
          autorisees: {
            include: { salle: { select: { id: true, code: true } } },
          },
        },
      }),
      this.prisma.exigenceSalleActivite.count({ where }),
    ]);

    return {
      data: exigences.map(toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
  ): Promise<ExigenceSalleActiviteResponseDto> {
    const exigence = await this.prisma.exigenceSalleActivite.findUnique({
      where: { id },
      include: {
        salleImposee: { select: { code: true } },
        autorisees: {
          include: { salle: { select: { id: true, code: true } } },
        },
      },
    });
    if (!exigence) {
      throw new NotFoundException(`Exigence de salle "${id}" introuvable`);
    }
    return toResponse(exigence as any);
  }

  async update(
    id: string,
    dto: UpdateExigenceSalleActiviteDto,
  ): Promise<ExigenceSalleActiviteResponseDto> {
    const exigence = await this.prisma.exigenceSalleActivite.findUnique({
      where: { id },
    });
    if (!exigence) {
      throw new NotFoundException(`Exigence de salle "${id}" introuvable`);
    }

    if (dto.salleImposeeId !== undefined) {
      if (dto.salleImposeeId) {
        const salle = await this.prisma.salle.findUnique({
          where: { id: dto.salleImposeeId },
        });
        if (!salle) {
          throw new NotFoundException(
            `Salle imposée "${dto.salleImposeeId}" introuvable`,
          );
        }
      }
    }

    if (dto.autorisees !== undefined) {
      if (dto.autorisees.length) {
        const salles = await this.prisma.salle.findMany({
          where: { id: { in: dto.autorisees } },
        });
        if (salles.length !== dto.autorisees.length) {
          throw new BadRequestException(
            'Une ou plusieurs salles autorisées sont introuvables.',
          );
        }
      }
    }

    const updated = await this.prisma.exigenceSalleActivite.update({
      where: { id },
      data: {
        salleImposeeId: dto.salleImposeeId ?? null,
        autorisees: {
          set: [],
          create: (dto.autorisees ?? []).map((salleId) => ({ salleId })),
        },
      },
      include: {
        salleImposee: { select: { code: true } },
        autorisees: {
          include: { salle: { select: { id: true, code: true } } },
        },
      },
    });
    return toResponse(updated as any);
  }

  async remove(id: string): Promise<void> {
    const exigence = await this.prisma.exigenceSalleActivite.findUnique({
      where: { id },
    });
    if (!exigence) {
      throw new NotFoundException(`Exigence de salle "${id}" introuvable`);
    }
    await this.prisma.exigenceSalleActivite.delete({ where: { id } });
  }
}

