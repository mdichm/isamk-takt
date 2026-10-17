import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateGroupeDto,
  UpdateGroupeDto,
  GroupeResponseDto,
  PaginatedGroupesDto,
  GroupeQueryDto,
  GroupeType,
} from './dto/groupe.dto.js';

@Injectable()
export class GroupesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Groupes
  // ============================================

  async createGroupe(dto: CreateGroupeDto, userId: string): Promise<GroupeResponseDto> {
    // Vérifier que le niveau existe
    const niveau = await this.prisma.niveau.findUnique({ where: { id: dto.niveauId } });
    if (!niveau) {
      throw new NotFoundException('Niveau non trouvé');
    }

    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({ where: { id: dto.semestreId } });
    if (!semestre) {
      throw new NotFoundException('Semestre non trouvé');
    }

    // Si un parent est spécifié, vérifier qu'il existe et appartient au même niveau
    if (dto.parentId) {
      const parent = await this.prisma.groupe.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Groupe parent non trouvé');
      }
      if (parent.niveauId !== dto.niveauId) {
        throw new ConflictException('Le groupe parent doit appartenir au même niveau');
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
      throw new ConflictException(`Le code de groupe "${dto.code}" existe déjà pour ce niveau et ce semestre`);
    }

    const groupe = await this.audit.auditTransaction<{
      id: string; niveauId: string; semestreId: string; parentId: string | null;
      type: GroupeType; code: string; libelle: string; effectif: number;
      originId: string | null; createdAt: Date; updatedAt: Date;
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
        orderBy: { code: 'asc' },
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

  async updateGroupe(id: string, dto: UpdateGroupeDto, userId: string): Promise<GroupeResponseDto> {
    const existing = await this.prisma.groupe.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Si on change le parent, vérifier l'absence de cycle
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId) {
        const parent = await this.prisma.groupe.findUnique({ where: { id: dto.parentId } });
        if (!parent) {
          throw new NotFoundException('Groupe parent non trouvé');
        }
        const isDescendant = await this.isDescendantOf(dto.parentId, id);
        if (isDescendant) {
          throw new ConflictException('Impossible de définir ce groupe comme parent : cela créerait un cycle');
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
        throw new ConflictException(`Le code de groupe "${dto.code}" existe déjà pour ce niveau et ce semestre`);
      }
    }

    const groupe = await this.audit.auditTransaction<{
      id: string; niveauId: string; semestreId: string; parentId: string | null;
      type: GroupeType; code: string; libelle: string; effectif: number;
      originId: string | null; createdAt: Date; updatedAt: Date;
    }>(
      async (tx) => {
        return tx.groupe.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.effectif !== undefined && { effectif: dto.effectif }),
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
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
      throw new ConflictException('Impossible de supprimer un groupe qui possède des sous-groupes');
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
  // Fermeture hiérarchique (ancêtres + descendants + soi)
  // ============================================

  async getClosure(id: string): Promise<{ soi: GroupeResponseDto; ancetres: GroupeResponseDto[]; descendants: GroupeResponseDto[] }> {
    const groupe = await this.prisma.groupe.findUnique({ where: { id } });
    if (!groupe) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Ancêtres : remonter la chaîne parent
    const ancetres: GroupeResponseDto[] = [];
    let ancestorId: string | null = groupe.parentId;
    while (ancestorId) {
      const parent = await this.prisma.groupe.findUnique({ where: { id: ancestorId } });
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
      const enfants = await this.prisma.groupe.findMany({ where: { parentId: current.id } });
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

  private async isDescendantOf(potentialAncestorId: string, descendantId: string): Promise<boolean> {
    let current = await this.prisma.groupe.findUnique({ where: { id: descendantId }, select: { parentId: true } });
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

  private toGroupeDto(groupe: {
    id: string; niveauId: string; semestreId: string; parentId: string | null;
    type: GroupeType; code: string; libelle: string; effectif: number;
    originId: string | null; createdAt: Date; updatedAt: Date;
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
      originId: groupe.originId,
      createdAt: groupe.createdAt,
      updatedAt: groupe.updatedAt,
    };
  }
}