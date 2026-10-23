// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des groupes de covoiturage (L3-41)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateCovoiturageDto,
  UpdateCovoiturageDto,
  CovoiturageResponseDto,
} from './dto/covoiturage.dto.js';

function toResponse(groupe: {
  id: string;
  semestreId: string;
  enseignantIds: string[];
  margeMinutes: number;
  joursCommunsMin: number;
  strict: boolean;
  createdAt: Date;
}): CovoiturageResponseDto {
  return {
    id: groupe.id,
    semestreId: groupe.semestreId,
    enseignantIds: groupe.enseignantIds,
    margeMinutes: groupe.margeMinutes,
    joursCommunsMin: groupe.joursCommunsMin,
    strict: groupe.strict,
    createdAt: groupe.createdAt,
  };
}

@Injectable()
export class CovoiturageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCovoiturageDto): Promise<CovoiturageResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    if (dto.enseignantIds.length < 2) {
      throw new BadRequestException(
        'Un groupe de covoiturage doit compter au moins deux enseignants.',
      );
    }

    const enseignants = await this.prisma.enseignant.findMany({
      where: { id: { in: dto.enseignantIds } },
    });
    if (enseignants.length !== dto.enseignantIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs enseignants du groupe sont introuvables.',
      );
    }

    const exists = await this.prisma.groupeCovoiturage.findFirst({
      where: { semestreId: dto.semestreId, enseignantIds: { hasSome: dto.enseignantIds } },
    });
    if (exists) {
      throw new ConflictException(
        'Un groupe de covoiturage existe deja pour ces enseignants sur ce semestre.',
      );
    }

    const groupe = await this.prisma.groupeCovoiturage.create({
      data: {
        semestreId: dto.semestreId,
        enseignantIds: dto.enseignantIds,
        margeMinutes: dto.margeMinutes ?? 60,
        joursCommunsMin: dto.joursCommunsMin ?? 1,
        strict: dto.strict ?? false,
      },
    });
    return toResponse(groupe);
  }

  async findAll(query: { semestreId?: string; page?: number; limit?: number }): Promise<{
    data: CovoiturageResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const where = query.semestreId ? { semestreId: query.semestreId } : {};

    const [groupes, total] = await this.prisma.$transaction([
      this.prisma.groupeCovoiturage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.groupeCovoiturage.count({ where }),
    ]);

    return {
      data: groupes.map(toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CovoiturageResponseDto> {
    const groupe = await this.prisma.groupeCovoiturage.findUnique({
      where: { id },
    });
    if (!groupe) {
      throw new NotFoundException(`Groupe de covoiturage "${id}" introuvable`);
    }
    return toResponse(groupe);
  }

  async update(
    id: string,
    dto: UpdateCovoiturageDto,
  ): Promise<CovoiturageResponseDto> {
    const groupe = await this.prisma.groupeCovoiturage.findUnique({
      where: { id },
    });
    if (!groupe) {
      throw new NotFoundException(`Groupe de covoiturage "${id}" introuvable`);
    }

    if (dto.enseignantIds !== undefined) {
      if (dto.enseignantIds.length < 2) {
        throw new BadRequestException(
          'Un groupe de covoiturage doit compter au moins deux enseignants.',
        );
      }
      const enseignants = await this.prisma.enseignant.findMany({
        where: { id: { in: dto.enseignantIds } },
      });
      if (enseignants.length !== dto.enseignantIds.length) {
        throw new BadRequestException(
          'Un ou plusieurs enseignants du groupe sont introuvables.',
        );
      }
    }

    const updated = await this.prisma.groupeCovoiturage.update({
      where: { id },
      data: {
        enseignantIds: dto.enseignantIds,
        margeMinutes: dto.margeMinutes,
        joursCommunsMin: dto.joursCommunsMin,
        strict: dto.strict,
      },
    });
    return toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const groupe = await this.prisma.groupeCovoiturage.findUnique({
      where: { id },
    });
    if (!groupe) {
      throw new NotFoundException(`Groupe de covoiturage "${id}" introuvable`);
    }
    await this.prisma.groupeCovoiturage.delete({ where: { id } });
  }
}
