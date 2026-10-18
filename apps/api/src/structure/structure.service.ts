import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateDepartementDto,
  UpdateDepartementDto,
  DepartementResponseDto,
  PaginatedDepartementsDto,
  DepartementQueryDto,
  CreateFormationDto,
  UpdateFormationDto,
  FormationResponseDto,
  PaginatedFormationsDto,
  FormationQueryDto,
  CreateNiveauDto,
  UpdateNiveauDto,
  NiveauResponseDto,
  PaginatedNiveauxDto,
  NiveauQueryDto,
  ReorderDto,
} from './dto/structure.dto.js';

@Injectable()
export class StructureService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Départements
  // ============================================

  async createDepartement(dto: CreateDepartementDto, userId: string): Promise<DepartementResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id: dto.anneeId } });
    if (!annee) {
      throw new NotFoundException('Année parente non trouvée');
    }

    const existing = await this.prisma.departement.findFirst({
      where: { anneeId: dto.anneeId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Le département avec le code "${dto.code}" existe déjà pour cette année`);
    }

    const departement = await this.audit.auditTransaction<{ id: string; anneeId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.departement.create({
          data: {
            anneeId: dto.anneeId,
            code: dto.code,
            libelle: dto.libelle,
            ordre: dto.ordre ?? 0,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Departement',
        motif: `Création département ${dto.code}`,
      },
    );

    return this.toDepartementDto(departement);
  }

  async findAllDepartements(query: DepartementQueryDto): Promise<PaginatedDepartementsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.anneeId) {
      where.anneeId = query.anneeId;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [departements, total] = await Promise.all([
      this.prisma.departement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ordre: 'asc', code: 'asc' },
      }),
      this.prisma.departement.count({ where }),
    ]);

    return {
      data: departements.map(this.toDepartementDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDepartementById(id: string): Promise<DepartementResponseDto> {
    const departement = await this.prisma.departement.findUnique({ where: { id } });
    if (!departement) {
      throw new NotFoundException('Département non trouvé');
    }
    return this.toDepartementDto(departement);
  }

  async updateDepartement(id: string, dto: UpdateDepartementDto, userId: string): Promise<DepartementResponseDto> {
    const existing = await this.prisma.departement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Département non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.departement.findFirst({
        where: { anneeId: existing.anneeId, code: dto.code },
      });
      if (conflict) {
        throw new ConflictException(`Le code de département "${dto.code}" existe déjà pour cette année`);
      }
    }

    const departement = await this.audit.auditTransaction<{ id: string; anneeId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.departement.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Departement',
        objetId: id,
        motif: `Mise à jour département ${id}`,
      },
    );

    return this.toDepartementDto(departement);
  }

  async removeDepartement(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.departement.findUnique({
      where: { id },
      include: { formations: true },
    });
    if (!existing) {
      throw new NotFoundException('Département non trouvé');
    }

    if (existing.formations.length > 0) {
      const refs = existing.formations.map((f) => `formation "${f.code}"`).join(', ');
      throw new ConflictException(`Suppression refusée : le département est référencé par ${refs}`);
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.departement.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Departement',
        objetId: id,
        motif: `Suppression département ${existing.code}`,
      },
    );
  }

  private toDepartementDto(departement: { id: string; anneeId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }): DepartementResponseDto {
    return {
      id: departement.id,
      anneeId: departement.anneeId,
      code: departement.code,
      libelle: departement.libelle,
      ordre: departement.ordre,
      originId: departement.originId ?? undefined,
      createdAt: departement.createdAt,
      updatedAt: departement.updatedAt,
    };
  }

  // ============================================
  // Formations
  // ============================================

  async createFormation(dto: CreateFormationDto, userId: string): Promise<FormationResponseDto> {
    const departement = await this.prisma.departement.findUnique({ where: { id: dto.departementId } });
    if (!departement) {
      throw new NotFoundException('Département parent non trouvé');
    }

    const existing = await this.prisma.formation.findFirst({
      where: { departementId: dto.departementId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`La formation avec le code "${dto.code}" existe déjà pour ce département`);
    }

    const formation = await this.audit.auditTransaction<{ id: string; departementId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.formation.create({
          data: {
            departementId: dto.departementId,
            code: dto.code,
            libelle: dto.libelle,
            ordre: dto.ordre ?? 0,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Formation',
        motif: `Création formation ${dto.code}`,
      },
    );

    return this.toFormationDto(formation);
  }

  async findAllFormations(query: FormationQueryDto): Promise<PaginatedFormationsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.departementId) {
      where.departementId = query.departementId;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [formations, total] = await Promise.all([
      this.prisma.formation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ordre: 'asc', code: 'asc' },
      }),
      this.prisma.formation.count({ where }),
    ]);

    return {
      data: formations.map(this.toFormationDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findFormationById(id: string): Promise<FormationResponseDto> {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) {
      throw new NotFoundException('Formation non trouvée');
    }
    return this.toFormationDto(formation);
  }

  async updateFormation(id: string, dto: UpdateFormationDto, userId: string): Promise<FormationResponseDto> {
    const existing = await this.prisma.formation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Formation non trouvée');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.formation.findFirst({
        where: { departementId: existing.departementId, code: dto.code },
      });
      if (conflict) {
        throw new ConflictException(`Le code de formation "${dto.code}" existe déjà pour ce département`);
      }
    }

    const formation = await this.audit.auditTransaction<{ id: string; departementId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.formation.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Formation',
        objetId: id,
        motif: `Mise à jour formation ${id}`,
      },
    );

    return this.toFormationDto(formation);
  }

  async removeFormation(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.formation.findUnique({
      where: { id },
      include: { niveaux: true },
    });
    if (!existing) {
      throw new NotFoundException('Formation non trouvée');
    }

    if (existing.niveaux.length > 0) {
      const refs = existing.niveaux.map((n) => `niveau "${n.code}"`).join(', ');
      throw new ConflictException(`Suppression refusée : la formation est référencée par ${refs}`);
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.formation.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Formation',
        objetId: id,
        motif: `Suppression formation ${existing.code}`,
      },
    );
  }

  private toFormationDto(formation: { id: string; departementId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }): FormationResponseDto {
    return {
      id: formation.id,
      departementId: formation.departementId,
      code: formation.code,
      libelle: formation.libelle,
      ordre: formation.ordre,
      originId: formation.originId ?? undefined,
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
    };
  }

  // ============================================
  // Niveaux
  // ============================================

  async createNiveau(dto: CreateNiveauDto, userId: string): Promise<NiveauResponseDto> {
    const formation = await this.prisma.formation.findUnique({ where: { id: dto.formationId } });
    if (!formation) {
      throw new NotFoundException('Formation parente non trouvée');
    }

    const existing = await this.prisma.niveau.findFirst({
      where: { formationId: dto.formationId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Le niveau avec le code "${dto.code}" existe déjà pour cette formation`);
    }

    const niveau = await this.audit.auditTransaction<{ id: string; formationId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.niveau.create({
          data: {
            formationId: dto.formationId,
            code: dto.code,
            libelle: dto.libelle,
            ordre: dto.ordre ?? 0,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Niveau',
        motif: `Création niveau ${dto.code}`,
      },
    );

    return this.toNiveauDto(niveau);
  }

  async findAllNiveaux(query: NiveauQueryDto): Promise<PaginatedNiveauxDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.formationId) {
      where.formationId = query.formationId;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [niveaux, total] = await Promise.all([
      this.prisma.niveau.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ordre: 'asc', code: 'asc' },
      }),
      this.prisma.niveau.count({ where }),
    ]);

    return {
      data: niveaux.map(this.toNiveauDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findNiveauById(id: string): Promise<NiveauResponseDto> {
    const niveau = await this.prisma.niveau.findUnique({ where: { id } });
    if (!niveau) {
      throw new NotFoundException('Niveau non trouvé');
    }
    return this.toNiveauDto(niveau);
  }

  async updateNiveau(id: string, dto: UpdateNiveauDto, userId: string): Promise<NiveauResponseDto> {
    const existing = await this.prisma.niveau.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Niveau non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.niveau.findFirst({
        where: { formationId: existing.formationId, code: dto.code },
      });
      if (conflict) {
        throw new ConflictException(`Le code de niveau "${dto.code}" existe déjà pour cette formation`);
      }
    }

    const niveau = await this.audit.auditTransaction<{ id: string; formationId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.niveau.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Niveau',
        objetId: id,
        motif: `Mise à jour niveau ${id}`,
      },
    );

    return this.toNiveauDto(niveau);
  }

  async removeNiveau(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.niveau.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Niveau non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.niveau.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Niveau',
        objetId: id,
        motif: `Suppression niveau ${existing.code}`,
      },
    );
  }

  private toNiveauDto(niveau: { id: string; formationId: string; code: string; libelle: string; ordre: number; originId: string | null; createdAt: Date; updatedAt: Date }): NiveauResponseDto {
    return {
      id: niveau.id,
      formationId: niveau.formationId,
      code: niveau.code,
      libelle: niveau.libelle,
      ordre: niveau.ordre,
      originId: niveau.originId ?? undefined,
      createdAt: niveau.createdAt,
      updatedAt: niveau.updatedAt,
    };
  }

  // ============================================
  // Réordonnancement (L7-18)
  // ============================================

  async reorderDepartements(dto: ReorderDto, userId: string): Promise<void> {
    // Vérifier que tous les IDs existent et appartiennent à la même année
    const ids = dto.items.map((item) => item.id);
    const departements = await this.prisma.departement.findMany({
      where: { id: { in: ids } },
      select: { id: true, anneeId: true, ordre: true },
    });

    if (departements.length !== ids.length) {
      throw new NotFoundException('Un ou plusieurs départements introuvables');
    }

    const anneeIds = new Set(departements.map((d) => d.anneeId));
    if (anneeIds.size !== 1) {
      throw new BadRequestException('Tous les départements doivent appartenir à la même année');
    }

    // Reassigner 1..N dans l'ordre fourni
    await this.prisma.$transaction(
      dto.items.map((item, index) =>
        this.prisma.departement.update({
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
        objetType: 'Departement',
        motif: `Réordonnancement des départements (${ids.length} éléments)`,
      },
    );
  }

  async reorderFormations(dto: ReorderDto, userId: string): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const formations = await this.prisma.formation.findMany({
      where: { id: { in: ids } },
      select: { id: true, departementId: true, ordre: true },
    });

    if (formations.length !== ids.length) {
      throw new NotFoundException('Un ou plusieurs formations introuvables');
    }

    const departementIds = new Set(formations.map((f) => f.departementId));
    if (departementIds.size !== 1) {
      throw new BadRequestException('Toutes les formations doivent appartenir au même département');
    }

    await this.prisma.$transaction(
      dto.items.map((item, index) =>
        this.prisma.formation.update({
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
        objetType: 'Formation',
        motif: `Réordonnancement des formations (${ids.length} éléments)`,
      },
    );
  }

  async reorderNiveaux(dto: ReorderDto, userId: string): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const niveaux = await this.prisma.niveau.findMany({
      where: { id: { in: ids } },
      select: { id: true, formationId: true, ordre: true },
    });

    if (niveaux.length !== ids.length) {
      throw new NotFoundException('Un ou plusieurs niveaux introuvables');
    }

    const formationIds = new Set(niveaux.map((n) => n.formationId));
    if (formationIds.size !== 1) {
      throw new BadRequestException('Tous les niveaux doivent appartenir à la même formation');
    }

    await this.prisma.$transaction(
      dto.items.map((item, index) =>
        this.prisma.niveau.update({
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
        objetType: 'Niveau',
        motif: `Réordonnancement des niveaux (${ids.length} éléments)`,
      },
    );
  }
}