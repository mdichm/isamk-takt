import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, no-restricted-imports
import type {
  ContrainteCategorie,
  ContrainteNature,
  ContraintePortee,
  ContrainteInstance,
  Indisponibilite,
  Creneau,
  JourSemaine,
} from '@takt/db';
import type { Prisma } from '@takt/db';
import type {
  ContrainteInstanceCreateDto,
  ContrainteInstanceUpdateDto,
  ContrainteInstanceListQueryDto,
  PaginatedContrainteInstancesDto,
  ContrainteInstanceResponseDto,
  ContrainteDuplicateDto,
  ContrainteDuplicateResponseDto,
  ContrainteNonCopieeDto,
  IndisponibiliteNonCopieeDto,
} from './dto/contrainte-instance.dto.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { WriteAuditDto } from '../audit/dto/audit.dto.js';

@Injectable()
export class ContrainteInstanceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

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

  // ============================================
  // Duplication de contraintes (L3-07)
  // ============================================

  async duplicate(
    sourceSemestreId: string,
    cibleSemestreId: string,
    natures: ContrainteNature[] | undefined,
    userId: string,
  ): Promise<ContrainteDuplicateResponseDto> {
    if (sourceSemestreId === cibleSemestreId) {
      throw new BadRequestException(
        'Le semestre source et le semestre cible doivent être différents',
      );
    }

    const [source, cible] = await Promise.all([
      this.prisma.semestre.findUnique({ where: { id: sourceSemestreId } }),
      this.prisma.semestre.findUnique({ where: { id: cibleSemestreId } }),
    ]);
    if (!source) {
      throw new NotFoundException(
        `Semestre source "${sourceSemestreId}" introuvable`,
      );
    }
    if (!cible) {
      throw new NotFoundException(
        `Semestre cible "${cibleSemestreId}" introuvable`,
      );
    }

    const whereSource: Record<string, unknown> = {
      semestreId: sourceSemestreId,
      actif: true,
    };
    if (natures && natures.length > 0) {
      whereSource.nature = { in: natures };
    }

    const sourceInstances = await this.prisma.contrainteInstance.findMany({
      where: whereSource,
      include: { definition: true },
    });

    const contraintesCrees: string[] = [];
    const contraintesNonCopiees: ContrainteNonCopieeDto[] = [];
    const indisponibilitesCrees: string[] = [];
    const indisponibilitesNonCopiees: IndisponibiliteNonCopieeDto[] = [];

    await this.audit.auditTransaction(
      async (tx) => {
        for (const inst of sourceInstances) {
          const existant = await tx.contrainteInstance.findFirst({
            where: { semestreId: cibleSemestreId, originId: inst.id },
          });
          if (existant) {
            continue;
          }

          const definition = inst.definition;

          if (definition.portee === 'ENSEIGNANT' && inst.enseignantId) {
            const enseignant = await tx.enseignant.findUnique({
              where: { id: inst.enseignantId },
            });
            if (!enseignant) {
              contraintesNonCopiees.push({
                definitionId: inst.definitionId,
                sujetType: 'enseignant',
                sujetId: inst.enseignantId,
                raison: 'Enseignant cible introuvable',
              });
              continue;
            }
          } else if (definition.portee === 'GROUPE' && inst.groupeId) {
            const groupe = await tx.groupe.findUnique({
              where: { id: inst.groupeId },
            });
            if (!groupe) {
              contraintesNonCopiees.push({
                definitionId: inst.definitionId,
                sujetType: 'groupe',
                sujetId: inst.groupeId,
                raison: 'Groupe cible introuvable',
              });
              continue;
            }
          } else if (definition.portee === 'SALLE' && inst.salleId) {
            const salle = await tx.salle.findUnique({
              where: { id: inst.salleId },
            });
            if (!salle) {
              contraintesNonCopiees.push({
                definitionId: inst.definitionId,
                sujetType: 'salle',
                sujetId: inst.salleId,
                raison: 'Salle cible introuvable',
              });
              continue;
            }
          } else if (definition.portee === 'MODULE' && inst.moduleId) {
            const module = await tx.module.findUnique({
              where: { id: inst.moduleId },
            });
            if (!module) {
              contraintesNonCopiees.push({
                definitionId: inst.definitionId,
                sujetType: 'module',
                sujetId: inst.moduleId,
                raison: 'Module cible introuvable',
              });
              continue;
            }
          } else if (
            definition.portee !== 'GLOBALE' &&
            definition.portee !== 'ENSEIGNANT' &&
            definition.portee !== 'GROUPE' &&
            definition.portee !== 'SALLE' &&
            definition.portee !== 'MODULE'
          ) {
            contraintesNonCopiees.push({
              definitionId: inst.definitionId,
              sujetType: 'inconnu',
              sujetId: '',
              raison: `Portée non gérée: ${definition.portee}`,
            });
            continue;
          }

          const created = await tx.contrainteInstance.create({
            data: {
              semestreId: cibleSemestreId,
              definitionId: inst.definitionId,
              enseignantId: inst.enseignantId ?? null,
              groupeId: inst.groupeId ?? null,
              salleId: inst.salleId ?? null,
              moduleId: inst.moduleId ?? null,
              originId: inst.id,
              params: inst.params as Prisma.InputJsonValue,
              poids: inst.poids ?? null,
              nature: inst.nature,
              commentaire: inst.commentaire ?? null,
              actif: inst.actif,
              creePar: userId,
            },
          });
          contraintesCrees.push(created.id);
        }

        // --- Copie des indisponibilités ---
        const sourceIndis = await tx.indisponibilite.findMany({
          where: { semestreId: sourceSemestreId, estActive: true },
        });

        for (const indi of sourceIndis) {
          const creneauCible = await tx.creneau.findFirst({
            where: {
              semestreId: cibleSemestreId,
              jour: indi.jour as JourSemaine,
              ordre: indi.ordre,
            },
          });
          if (!creneauCible) {
            indisponibilitesNonCopiees.push({
              jour: indi.jour as string,
              ordre: indi.ordre,
              raison: `Aucun créneau cible trouvé pour jour=${indi.jour} ordre=${indi.ordre}`,
            });
            continue;
          }

          const createdIndi = await tx.indisponibilite.create({
            data: {
              semestreId: cibleSemestreId,
              jour: indi.jour,
              ordre: indi.ordre,
              enseignantId: indi.enseignantId ?? null,
              salleId: indi.salleId ?? null,
              estActive: indi.estActive,
            },
          });
          indisponibilitesCrees.push(createdIndi.id);
        }

      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ContrainteInstance',
        motif: `Duplication contraintes et indisponibilités de ${sourceSemestreId} vers ${cibleSemestreId}`,
      },
    );

    return {
      contraintesCrees: contraintesCrees.length,
      contraintesIds: contraintesCrees,
      contraintesNonCopiees,
      indisponibilitesCrees: indisponibilitesCrees.length,
      indisponibilitesIds: indisponibilitesCrees,
      indisponibilitesNonCopiees,
    };
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