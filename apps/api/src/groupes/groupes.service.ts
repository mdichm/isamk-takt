import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import type { Groupe } from '@takt/db';
import {
  CreateGroupeDto,
  UpdateGroupeDto,
  GroupeResponseDto,
  PaginatedGroupesDto,
  GroupeQueryDto,
  GroupeType,
  CodeSuggestionDto,
} from './dto/groupe.dto.js';
import { ReorderDto } from '../structure/dto/structure.dto.js';
import {
  DuplicateGroupesDto,
  DuplicateGroupesResult,
  DuplicateGroupesConflict,
} from './dto/groupe-duplicate.dto.js';

@Injectable()
export class GroupesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private conflitService: ConflitService,
  ) {}

  // ============================================
  // Groupes
  // ============================================

  async createGroupe(
    dto: CreateGroupeDto,
    userId: string,
  ): Promise<GroupeResponseDto> {
    // Vérifier que le niveau existe
    const niveau = await this.prisma.niveau.findUnique({
      where: { id: dto.niveauId },
    });
    if (!niveau) {
      throw new NotFoundException('Niveau non trouvé');
    }

    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException('Semestre non trouvé');
    }

    // Si un parent est spécifié, vérifier qu'il existe et appartient au même niveau
    if (dto.parentId) {
      const parent = await this.prisma.groupe.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Groupe parent non trouvé');
      }
      if (parent.niveauId !== dto.niveauId) {
        throw new ConflictException(
          'Le groupe parent doit appartenir au même niveau',
        );
      }
    }

    // Vérifier l'unicité (niveauId, semestreId, code)
    const existing = await this.prisma.groupe.findFirst({
      where: {
        niveauId: dto.niveauId,
        semestreId: dto.semestreId,
        code: dto.code,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Le code de groupe "${dto.code}" existe déjà pour ce niveau et ce semestre`,
      );
    }

    const groupe = await this.audit.auditTransaction<{
      id: string;
      niveauId: string;
      semestreId: string;
      parentId: string | null;
      type: GroupeType;
      code: string;
      libelle: string;
      effectif: number;
      ordre: number;
      originId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>(
      async (tx) => {
        return tx.groupe.create({
          data: {
            niveauId: dto.niveauId,
            semestreId: dto.semestreId,
            parentId: dto.parentId ?? null,
            type: dto.type,
            code: dto.code,
            libelle: dto.libelle,
            effectif: dto.effectif ?? 0,
            ordre: dto.ordre ?? 0,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Groupe',
        motif: `Création groupe ${dto.code}`,
      },
    );

    return this.toGroupeDto(groupe);
  }

  // ============================================
  // Duplication de groupes d'un semestre à l'autre (L1-08)
  // ============================================

  async duplicateGroupes(
    dto: DuplicateGroupesDto,
    userId: string,
  ): Promise<DuplicateGroupesResult> {
    // Vérifier que les deux semestres existent
    const [sourceSemestre, cibleSemestre] = await Promise.all([
      this.prisma.semestre.findUnique({ where: { id: dto.sourceSemestreId } }),
      this.prisma.semestre.findUnique({ where: { id: dto.cibleSemestreId } }),
    ]);
    if (!sourceSemestre) {
      throw new NotFoundException('Semestre source non trouvé');
    }
    if (!cibleSemestre) {
      throw new NotFoundException('Semestre cible non trouvé');
    }

    return this.audit.auditTransaction<DuplicateGroupesResult>(
      async (tx) => {
        // Tous les groupes du semestre source, triés parents avant enfants
        const sourceGroupes = await tx.groupe.findMany({
          where: { semestreId: dto.sourceSemestreId },
        });
        const byId = new Map<string, Groupe>();
        for (const g of sourceGroupes) {
          byId.set(g.id, g);
        }
        const enfantsDe = new Map<string, string[]>();
        const racines: Groupe[] = [];
        for (const groupe of sourceGroupes) {
          if (!groupe.parentId) {
            racines.push(groupe);
            continue;
          }
          if (!byId.has(groupe.parentId)) {
            // Le parent n'appartient pas au semestre source : racine orpheline
            racines.push(groupe);
            continue;
          }
          const enfants = enfantsDe.get(groupe.parentId) ?? [];
          enfants.push(groupe.id);
          enfantsDe.set(groupe.parentId, enfants);
        }
        const ordonnees: Groupe[] = [];
        const file: Groupe[] = [...racines];
        while (file.length > 0) {
          const courant = file.shift()!;
          ordonnees.push(courant);
          for (const enfantId of enfantsDe.get(courant.id) ?? []) {
            const enfant = byId.get(enfantId);
            if (enfant) {
              file.push(enfant);
            }
          }
        }

        const idMap = new Map<string, string>(); // id source -> id cible
        const crees: GroupeResponseDto[] = [];
        const ignorés: GroupeResponseDto[] = [];
        const avertissements: string[] = [];
        const conflits: DuplicateGroupesConflict[] = [];

        for (const source of ordonnees) {
          // Un groupe cible avec le même (niveau, semestre, code) existe-t-il déjà ?
          const existant = await tx.groupe.findFirst({
            where: {
              semestreId: dto.cibleSemestreId,
              niveauId: source.niveauId,
              code: source.code,
            },
          });

          if (existant) {
            if (existant.originId === source.id) {
              // Idempotent : déjà dupliqué lors d'un appel précédent
              ignorés.push(this.toGroupeDto(existant));
              idMap.set(source.id, existant.id);
              continue;
            }
            // Conflit : le code est déjà utilisé par un autre groupe
            conflits.push({
              code: source.code,
              sourceGroupeId: source.id,
              existingGroupeId: existant.id,
            });
            continue;
          }

          const cibleParentId = source.parentId
            ? (idMap.get(source.parentId) ?? null)
            : null;

          const groupe = await tx.groupe.create({
            data: {
              niveauId: source.niveauId,
              semestreId: dto.cibleSemestreId,
              parentId: cibleParentId,
              type: source.type,
              code: source.code,
              libelle: source.libelle,
              effectif: dto.reinitialiserEffectifs ? 0 : source.effectif,
              originId: source.id,
            },
          });

          const groupeDto = this.toGroupeDto(groupe);
          crees.push(groupeDto);
          idMap.set(source.id, groupe.id);

          if (dto.reinitialiserEffectifs) {
            avertissements.push(
              `Effectif réinitialisé à 0 pour le groupe "${groupe.code}"`,
            );
          }
        }

        // Atomicité : en cas de conflit, rien n'est créé (rollback de la transaction)
        if (conflits.length > 0) {
          throw new ConflictException({
            detail:
              'Un ou plusieurs codes de groupe existent déjà dans le semestre cible',
            code: 'DUPLICATE_RESOURCE',
            conflits,
          });
        }

        return { crees, ignorés, avertissements };
      },
      {
        userId,
        action: 'DUPLICATE',
        objetType: 'Groupe',
        motif: `Duplication des groupes du semestre ${dto.sourceSemestreId} vers le semestre ${dto.cibleSemestreId}`,
      },
    );
  }

  async findAllGroupes(query: GroupeQueryDto): Promise<PaginatedGroupesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    if (query.type !== undefined) {
      where.type = query.type;
    }

    if (query.niveauId !== undefined) {
      where.niveauId = query.niveauId;
    }

    if (query.semestreId !== undefined) {
      where.semestreId = query.semestreId;
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    const [groupes, total] = await Promise.all([
      this.prisma.groupe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ordre: 'asc', code: 'asc' },
        include: { parent: true, enfants: true },
      }),
      this.prisma.groupe.count({ where }),
    ]);

    return {
      data: groupes.map(this.toGroupeDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findGroupeById(id: string): Promise<GroupeResponseDto> {
    const groupe = await this.prisma.groupe.findUnique({ where: { id } });
    if (!groupe) {
      throw new NotFoundException('Groupe non trouvé');
    }
    return this.toGroupeDto(groupe);
  }

  async updateGroupe(
    id: string,
    dto: UpdateGroupeDto,
    userId: string,
  ): Promise<GroupeResponseDto> {
    const existing = await this.prisma.groupe.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Si on change le parent, vérifier l'absence de cycle
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId) {
        const parent = await this.prisma.groupe.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Groupe parent non trouvé');
        }
        const isDescendant = await this.isDescendantOf(dto.parentId, id);
        if (isDescendant) {
          throw new ConflictException(
            'Impossible de définir ce groupe comme parent : cela créerait un cycle',
          );
        }
      }
    }

    // Vérifier l'unicité si le code change
    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.groupe.findFirst({
        where: {
          niveauId: existing.niveauId,
          semestreId: existing.semestreId,
          code: dto.code,
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Le code de groupe "${dto.code}" existe déjà pour ce niveau et ce semestre`,
        );
      }
    }

    const groupe = await this.audit.auditTransaction<{
      id: string;
      niveauId: string;
      semestreId: string;
      parentId: string | null;
      type: GroupeType;
      code: string;
      libelle: string;
      effectif: number;
      ordre: number;
      originId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>(
      async (tx) => {
        return tx.groupe.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.effectif !== undefined && { effectif: dto.effectif }),
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Groupe',
        objetId: id,
        motif: `Mise à jour groupe ${id}`,
      },
    );

    if (dto.effectif !== undefined) {
      await this.conflitService.recalculerConflitsSemestre(existing.semestreId);
    }

    return this.toGroupeDto(groupe);
  }

  async removeGroupe(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.groupe.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Vérifier qu'il n'a pas d'enfants directs
    const enfants = await this.prisma.groupe.count({ where: { parentId: id } });
    if (enfants > 0) {
      throw new ConflictException(
        'Impossible de supprimer un groupe qui possède des sous-groupes',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.groupe.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Groupe',
        objetId: id,
        motif: `Suppression groupe ${existing.code}`,
      },
    );
  }
  // ============================================
  // Code-suggestion (nomenclature — L1-07)
  // ============================================

  async codeSuggestion(
    niveauId: string,
    semestreId?: string,
  ): Promise<CodeSuggestionDto> {
    // Vérifier que le niveau existe et résoudre le code de département/formation
    const niveau = await this.prisma.niveau.findUnique({
      where: { id: niveauId },
      include: { formation: { include: { departement: true } } },
    });
    if (!niveau) {
      throw new NotFoundException('Niveau non trouvé');
    }

    const departementCode = niveau.formation?.departement?.code ?? 'INCONNU';
    const departementId = niveau.formation?.departement?.id ?? null;
    const prefix = `${niveau.code}-${departementCode}-`;

    // Récupérer les codes existants pour ce niveau (et optionnellement ce semestre)
    const where: Record<string, unknown> = { niveauId };
    if (semestreId) {
      where.semestreId = semestreId;
    }

    const existing = await this.prisma.groupe.findMany({
      where,
      select: { code: true },
    });

    const used = new Set<number>();
    const prefixRegex = new RegExp(
      `^${this.escapeRegExpPrefix(prefix)}(\\d+)$`,
    );
    for (const groupe of existing) {
      const match = groupe.code.match(prefixRegex);
      if (match) {
        used.add(parseInt(match[1], 10));
      }
    }

    // Premier identifiant libre (segment 3 = 1, 2, 3 ...)
    let next = 1;
    while (used.has(next)) {
      next++;
    }

    return {
      niveauId,
      niveauCode: niveau.code,
      departementId,
      departementCode,
      suggestedCode: `${prefix}${next}`,
    };
  }

  // ============================================
  // Fermeture hiérarchique (ancêtres + descendants + soi)
  // ============================================

  async getClosure(id: string): Promise<{
    soi: GroupeResponseDto;
    ancetres: GroupeResponseDto[];
    descendants: GroupeResponseDto[];
  }> {
    const groupe = await this.prisma.groupe.findUnique({ where: { id } });
    if (!groupe) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Ancêtres : remonter la chaîne parent
    const ancetres: GroupeResponseDto[] = [];
    let ancestorId: string | null = groupe.parentId;
    while (ancestorId) {
      const parent = await this.prisma.groupe.findUnique({
        where: { id: ancestorId },
      });
      if (!parent) break;
      ancetres.push(this.toGroupeDto(parent));
      ancestorId = parent.parentId;
    }

    // Descendants : parcourir en largeur les enfants
    const descendants: GroupeResponseDto[] = [];
    const queue = [groupe];
    const visited = new Set<string>([id]);
    while (queue.length > 0) {
      const current = queue.shift()!;
      const enfants = await this.prisma.groupe.findMany({
        where: { parentId: current.id },
      });
      for (const enfant of enfants) {
        if (!visited.has(enfant.id)) {
          visited.add(enfant.id);
          descendants.push(this.toGroupeDto(enfant));
          queue.push(enfant);
        }
      }
    }

    return {
      soi: this.toGroupeDto(groupe),
      ancetres,
      descendants,
    };
  }

  // ============================================
  // Helpers privés
  // ============================================

  private async isDescendantOf(
    potentialAncestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    let current = await this.prisma.groupe.findUnique({
      where: { id: descendantId },
      select: { parentId: true },
    });
    while (current && current.parentId) {
      if (current.parentId === potentialAncestorId) {
        return true;
      }
      current = await this.prisma.groupe.findUnique({
        where: { id: current.parentId },
        select: { parentId: true },
      });
    }
    return false;
  }

  // Échappement des caractères spéciaux pour une utilisation dans une regex
  private escapeRegExpPrefix(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toGroupeDto(groupe: {
    id: string;
    niveauId: string;
    semestreId: string;
    parentId: string | null;
    type: GroupeType;
    code: string;
    libelle: string;
    effectif: number;
    ordre: number;
    originId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GroupeResponseDto {
    return {
      id: groupe.id,
      niveauId: groupe.niveauId,
      semestreId: groupe.semestreId,
      parentId: groupe.parentId,
      type: groupe.type,
      code: groupe.code,
      libelle: groupe.libelle,
      effectif: groupe.effectif,
      ordre: groupe.ordre,
      originId: groupe.originId,
      createdAt: groupe.createdAt,
      updatedAt: groupe.updatedAt,
    };
  }

  // ============================================
  // Réordonnancement (L7-18)
  // ============================================

  async reorderGroupes(dto: ReorderDto, userId: string): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const groupes = await this.prisma.groupe.findMany({
      where: { id: { in: ids } },
      select: { id: true, niveauId: true, semestreId: true, ordre: true },
    });

    if (groupes.length !== ids.length) {
      throw new NotFoundException('Un ou plusieurs groupes introuvables');
    }

    const niveauIds = new Set(groupes.map((g) => g.niveauId));
    const semestreIds = new Set(groupes.map((g) => g.semestreId));
    if (niveauIds.size !== 1 || semestreIds.size !== 1) {
      throw new BadRequestException(
        'Tous les groupes doivent appartenir au même niveau et au même semestre',
      );
    }

    await this.prisma.$transaction(
      dto.items.map((item, index) =>
        this.prisma.groupe.update({
          where: { id: item.id },
          data: { ordre: index + 1 },
        }),
      ),
    );

    await this.audit.auditTransaction(
      async () => {},
      {
        userId,
        action: 'UPDATE',
        objetType: 'Groupe',
        motif: `Réordonnancement des groupes (${ids.length} éléments)`,
      },
    );
  }
}
