// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des voeux enseignants (L3-33)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContrainteInstanceService } from '../contraintes/contrainte-instance.service.js';
import {
  CreateVoeuDto,
  UpdateVoeuDto,
  VoeuResponseDto,
  VoeuQueryDto,
  VOEU_POIDS_VALUES,
  VOEU_CODES,
  type VOEU_POIDS,
  type VOEU_CODE,
} from './dto/voeux.dto.js';
import type { ContrainteInstanceCreateDto, ContrainteInstanceResponseDto } from '../contraintes/dto/contrainte-instance.dto.js';

const CREEPAR = 'system';

function toResponse(
  instance: ContrainteInstanceResponseDto & {
    avertissement?: string;
  },
): VoeuResponseDto {
  return {
    id: instance.id,
    semestreId: instance.semestreId,
    enseignantId: instance.enseignantId!,
    code: instance.params.code as VOEU_CODE,
    params: instance.params,
    poids: instance.poids!,
    avertissement: instance.avertissement,
    commentaire: instance.commentaire ?? undefined,
    actif: instance.actif,
    creePar: instance.creePar,
    creeLe: instance.creeLe,
  };
}

@Injectable()
export class VoeuxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contrainteInstanceService: ContrainteInstanceService,
  ) {}

  async create(dto: CreateVoeuDto): Promise<VoeuResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: dto.enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException(`Enseignant "${dto.enseignantId}" introuvable`);
    }

    if (!VOEU_POIDS_VALUES.includes(dto.poids as VOEU_POIDS)) {
      throw new BadRequestException(
        `Le poids d'un vœu doit etre l'un des niveaux : ${VOEU_POIDS_VALUES.join(', ')}`,
      );
    }

    const definition = await this.prisma.contrainteDefinition.findUnique({
      where: { code: dto.code },
    });
    if (!definition) {
      throw new NotFoundException(
        `Définition de contrainte "${dto.code}" introuvable`,
      );
    }

    const existing = await this.prisma.contrainteInstance.findFirst({
      where: {
        semestreId: dto.semestreId,
        enseignantId: dto.enseignantId,
        definitionId: definition.id,
        nature: 'VOEU',
        actif: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un vœu de type "${dto.code}" existe deja pour cet enseignant sur ce semestre`,
      );
    }

    let avertissement: string | undefined;
    const jour = (dto.params as Record<string, unknown>).jour as
      | string
      | undefined;
    if (jour) {
      const indisponibilites = await this.prisma.indisponibilite.findMany({
        where: {
          semestreId: dto.semestreId,
          enseignantId: dto.enseignantId,
          jour: jour as any,
          estActive: true,
        },
      });
      if (indisponibilites.length > 0) {
        if (dto.code === 'TEACHER_DAY_OFF_WISH') {
          avertissement =
            'Ce vœu de jour libre contredit une indisponibilité déjà saisie pour cet enseignant.';
        } else if (dto.code === 'TEACHER_AVOID_SLOT') {
          avertissement =
            'Ce vœu de créneau à éviter contredit une indisponibilité déjà saisie pour cet enseignant.';
        } else {
          avertissement =
            'Ce vœu contredit une indisponibilité déjà saisie pour cet enseignant.';
        }
      }
    }

    const createDto: ContrainteInstanceCreateDto = {
      semestreId: dto.semestreId,
      definitionId: definition.id,
      enseignantId: dto.enseignantId,
      nature: 'VOEU',
      params: dto.params,
      poids: dto.poids,
      commentaire: dto.commentaire,
      actif: dto.actif ?? true,
    };

    const instance = await this.contrainteInstanceService.createContrainteInstance(
      createDto,
      CREEPAR,
    );

    return toResponse({ ...instance, avertissement });
  }

  async findAll(
    query: VoeuQueryDto,
  ): Promise<{
    data: VoeuResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      nature: 'VOEU',
      actif: true,
    };

    if (query.semestreId) where.semestreId = query.semestreId;
    if (query.enseignantId) where.enseignantId = query.enseignantId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrainteInstance.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        skip,
        take: limit,
        include: { definition: true },
      }),
      this.prisma.contrainteInstance.count({ where }),
    ]);

    return {
      data: items.map((i) => toResponse(i as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<VoeuResponseDto> {
    const instance = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!instance) {
      throw new NotFoundException(`Vœu "${id}" introuvable`);
    }
    if (instance.nature !== 'VOEU') {
      throw new NotFoundException(`L'instance "${id}" n'est pas un vœu`);
    }
    return toResponse(instance as any);
  }

  async update(
    id: string,
    dto: UpdateVoeuDto,
  ): Promise<VoeuResponseDto> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!existing) {
      throw new NotFoundException(`Vœu "${id}" introuvable`);
    }
    if (existing.nature !== 'VOEU') {
      throw new NotFoundException(`L'instance "${id}" n'est pas un vœu`);
    }

    if (dto.poids !== undefined) {
      if (!VOEU_POIDS_VALUES.includes(dto.poids as VOEU_POIDS)) {
        throw new BadRequestException(
          `Le poids d'un vœu doit etre l'un des niveaux : ${VOEU_POIDS_VALUES.join(', ')}`,
        );
      }
    }

    const updateDto: {
      params?: Record<string, unknown>;
      poids?: number;
      commentaire?: string;
      actif?: boolean;
    } = {};
    if (dto.params !== undefined) updateDto.params = dto.params;
    if (dto.poids !== undefined) updateDto.poids = dto.poids;
    if (dto.commentaire !== undefined)
      updateDto.commentaire = dto.commentaire;
    if (dto.actif !== undefined) updateDto.actif = dto.actif;

    const instance = await this.contrainteInstanceService.updateContrainteInstance(
      id,
      updateDto as any,
      CREEPAR,
    );

    return toResponse(instance as any);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Vœu "${id}" introuvable`);
    }
    if (existing.nature !== 'VOEU') {
      throw new NotFoundException(`L'instance "${id}" n'est pas un vœu`);
    }
    await this.contrainteInstanceService['removeContrainteInstance'](id);
  }
}