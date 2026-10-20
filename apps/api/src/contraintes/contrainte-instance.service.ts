import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, no-restricted-imports
import type { ContrainteCategorie, ContraintePortee, ContrainteInstance } from '@takt/db';
import type { Prisma } from '@takt/db';
import type {
  ContrainteInstanceCreateDto,
  ContrainteInstanceUpdateDto,
  ContrainteInstanceListQueryDto,
  PaginatedContrainteInstancesDto,
  ContrainteInstanceResponseDto,
} from './dto/contrainte-instance.dto.js';

@Injectable()
export class ContrainteInstanceService {
  constructor(private prisma: PrismaService) {}

  async createContrainteInstance(
    dto: ContrainteInstanceCreateDto,
    userId: string,
  ): Promise<ContrainteInstanceResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: dto.semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    const definition = await this.prisma.contrainteDefinition.findUnique({
      where: { id: dto.definitionId },
    });
    if (!definition) {
      throw new NotFoundException(`Définition de contrainte "${dto.definitionId}" introuvable`);
    }

    this.validerCibleCoherente(definition, dto);
    this.validerPoids(definition.categorie, dto.poids);

    const instance = await this.prisma.contrainteInstance.create({
      data: {
        semestreId: dto.semestreId,
        definitionId: dto.definitionId,
        enseignantId: dto.enseignantId ?? null,
        groupeId: dto.groupeId ?? null,
        salleId: dto.salleId ?? null,
        moduleId: dto.moduleId ?? null,
        params: dto.params as Prisma.InputJsonValue,
        poids: dto.poids ?? null,
        nature: dto.nature,
        commentaire: dto.commentaire ?? null,
        actif: dto.actif ?? true,
        creePar: userId,
      },
    });

    return this.toDto(instance);
  }

  async findAll(
    query: ContrainteInstanceListQueryDto,
  ): Promise<PaginatedContrainteInstancesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.semestreId) where.semestreId = query.semestreId;
    if (query.definitionId) where.definitionId = query.definitionId;
    if (query.enseignantId) where.enseignantId = query.enseignantId;
    if (query.groupeId) where.groupeId = query.groupeId;
    if (query.salleId) where.salleId = query.salleId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.nature) where.nature = query.nature;
    if (query.actif !== undefined) where.actif = query.actif;

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
      data: items.map((i) => this.toDto(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string): Promise<ContrainteInstanceResponseDto> {
    const instance = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!instance) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }
    return this.toDto(instance);
  }

  async updateContrainteInstance(
    id: string,
    dto: ContrainteInstanceUpdateDto,
    userId: string,
  ): Promise<ContrainteInstanceResponseDto> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!existing) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }

    const definition = existing.definition;
    const cibleMixte = {
      enseignantId: dto.enseignantId ?? existing.enseignantId,
      groupeId: dto.groupeId ?? existing.groupeId,
      salleId: dto.salleId ?? existing.salleId,
      moduleId: dto.moduleId ?? existing.moduleId,
    };

    if (dto.definitionId && dto.definitionId !== existing.definitionId) {
      const def = await this.prisma.contrainteDefinition.findUnique({
        where: { id: dto.definitionId },
      });
      if (!def) {
        throw new NotFoundException(`Définition de contrainte "${dto.definitionId}" introuvable`);
      }
      this.validerCibleCoherente(def, cibleMixte as ContrainteInstanceCreateDto);
      this.validerPoids(def.categorie, dto.poids ?? existing.poids);
    } else if (
      dto.poids !== undefined ||
      dto.enseignantId !== undefined ||
      dto.groupeId !== undefined ||
      dto.salleId !== undefined ||
      dto.moduleId !== undefined
    ) {
      this.validerCibleCoherente(definition, cibleMixte as ContrainteInstanceCreateDto);
      this.validerPoids(definition.categorie, dto.poids ?? existing.poids);
    }

    const data: Prisma.ContrainteInstanceUncheckedUpdateInput = {};
    if (dto.semestreId !== undefined) data.semestreId = dto.semestreId;
    if (dto.definitionId !== undefined) data.definitionId = dto.definitionId;
    if (dto.enseignantId !== undefined) data.enseignantId = dto.enseignantId;
    if (dto.groupeId !== undefined) data.groupeId = dto.groupeId;
    if (dto.salleId !== undefined) data.salleId = dto.salleId;
    if (dto.moduleId !== undefined) data.moduleId = dto.moduleId;
    if (dto.params !== undefined) data.params = dto.params as Prisma.InputJsonValue;
    if (dto.poids !== undefined) data.poids = dto.poids;
    if (dto.nature !== undefined) data.nature = dto.nature;
    if (dto.commentaire !== undefined) data.commentaire = dto.commentaire;
    if (dto.actif !== undefined) data.actif = dto.actif;

    const instance = await this.prisma.contrainteInstance.update({
      where: { id },
      data,
      include: { definition: true },
    });

    return this.toDto(instance);
  }

  async removeContrainteInstance(id: string): Promise<void> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }

    await this.prisma.contrainteInstance.update({
      where: { id },
      data: { actif: false },
    });
  }

  private validerCibleCoherente(
    definition: { portee: ContraintePortee; categorie: ContrainteCategorie },
    cible: ContrainteInstanceCreateDto,
  ): void {
    const portee = definition.portee;
    const champsRemplis: string[] = [];
    if (cible.enseignantId) champsRemplis.push('enseignantId');
    if (cible.groupeId) champsRemplis.push('groupeId');
    if (cible.salleId) champsRemplis.push('salleId');
    if (cible.moduleId) champsRemplis.push('moduleId');

    switch (portee) {
      case 'GLOBALE':
        if (champsRemplis.length > 0) {
          throw new BadRequestException(
            'Une contrainte de portée GLOBALE ne doit pas avoir de cible.',
          );
        }
        break;
      case 'ENSEIGNANT':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('enseignantId')) {
          throw new BadRequestException(
            'Une contrainte de portée ENSEIGNANT doit cibler exactement un enseignant.',
          );
        }
        break;
      case 'GROUPE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('groupeId')) {
          throw new BadRequestException(
            'Une contrainte de portée GROUPE doit cibler exactement un groupe.',
          );
        }
        break;
      case 'SALLE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('salleId')) {
          throw new BadRequestException(
            'Une contrainte de portée SALLE doit cibler exactement une salle.',
          );
        }
        break;
      case 'MODULE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('moduleId')) {
          throw new BadRequestException(
            'Une contrainte de portée MODULE doit cibler exactement un module.',
          );
        }
        break;
    }
  }

  private validerPoids(categorie: ContrainteCategorie, poids: number | undefined | null): void {
    if (categorie === 'DURE') {
      if (poids !== undefined && poids !== null) {
        throw new BadRequestException('Une contrainte dure ne doit pas avoir de poids.');
      }
    } else {
      if (poids === undefined || poids === null) {
        throw new BadRequestException(
          'Une contrainte souple doit avoir un poids compris entre 0 et 100.',
        );
      }
      if (poids < 0 || poids > 100) {
        throw new BadRequestException(
          'Le poids d\'une contrainte souple doit être compris entre 0 et 100.',
        );
      }
    }
  }

  private toDto(instance: ContrainteInstance): ContrainteInstanceResponseDto {
    return {
      id: instance.id,
      semestreId: instance.semestreId,
      definitionId: instance.definitionId,
      enseignantId: instance.enseignantId ?? undefined,
      groupeId: instance.groupeId ?? undefined,
      salleId: instance.salleId ?? undefined,
      moduleId: instance.moduleId ?? undefined,
      params: instance.params as Record<string, unknown>,
      poids: instance.poids ?? undefined,
      nature: instance.nature,
      commentaire: instance.commentaire ?? undefined,
      actif: instance.actif,
      creePar: instance.creePar,
      creeLe: instance.creeLe,
    };
  }

}