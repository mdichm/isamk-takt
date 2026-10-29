import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { AnneeImmutabilityService } from '../annees/annee-immutability.service.js';
import type {
  CreateTypeSalleDto,
  UpdateTypeSalleDto,
  TypeSalleResponseDto,
  PaginatedTypeSallesDto,
  TypeSalleQueryDto,
  CreateSalleDto,
  UpdateSalleDto,
  SalleResponseDto,
  PaginatedSallesDto,
  SalleQueryDto,
  CreateEquipementDto,
  UpdateEquipementDto,
  EquipementResponseDto,
  PaginatedEquipementsDto,
  EquipementQueryDto,
  AssignerEquipementsDto,
} from './dto/salle.dto.js';

@Injectable()
export class SalleService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private conflitService: ConflitService,
    private anneeImmutability: AnneeImmutabilityService,
  ) {}

  // ============================================
  // Types de salle
  // ============================================

  async createTypeSalle(dto: CreateTypeSalleDto, userId: string): Promise<TypeSalleResponseDto> {
    const existing = await this.prisma.typeSalle.findFirst({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Le type de salle avec le code "${dto.code}" existe déjà`);
    }

    const typeSalle = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.typeSalle.create({
          data: {
            code: dto.code,
            libelle: dto.libelle,
            estActive: dto.estActive ?? true,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'TypeSalle',
        motif: `Création type de salle ${dto.code}`,
      },
    );

    return this.toTypeSalleDto(typeSalle);
  }

  async findAllTypeSalles(query: TypeSalleQueryDto): Promise<PaginatedTypeSallesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.estActive !== undefined) {
      where.estActive = query.estActive;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [typeSalles, total] = await Promise.all([
      this.prisma.typeSalle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.typeSalle.count({ where }),
    ]);

    return {
      data: typeSalles.map(this.toTypeSalleDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTypeSalleById(id: string): Promise<TypeSalleResponseDto> {
    const typeSalle = await this.prisma.typeSalle.findUnique({ where: { id } });
    if (!typeSalle) {
      throw new NotFoundException('Type de salle non trouvé');
    }
    return this.toTypeSalleDto(typeSalle);
  }

  async updateTypeSalle(id: string, dto: UpdateTypeSalleDto, userId: string): Promise<TypeSalleResponseDto> {
    const existing = await this.prisma.typeSalle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Type de salle non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.typeSalle.findFirst({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException(`Le code de type de salle "${dto.code}" existe déjà`);
      }
    }

    const typeSalle = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.typeSalle.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.estActive !== undefined && { estActive: dto.estActive }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'TypeSalle',
        objetId: id,
        motif: `Mise à jour type de salle ${id}`,
      },
    );

    return this.toTypeSalleDto(typeSalle);
  }

  async removeTypeSalle(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.typeSalle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Type de salle non trouvé');
    }

    const sallesLiees = await this.prisma.salle.count({ where: { typeSalleId: id } });
    if (sallesLiees > 0) {
      throw new ConflictException(`Impossible de supprimer : ${sallesLiees} salle(s) utilisent ce type de salle`);
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.typeSalle.update({ where: { id }, data: { estActive: false } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'TypeSalle',
        objetId: id,
        motif: `Désactivation type de salle ${existing.code}`,
      },
    );
  }

  private toTypeSalleDto(typeSalle: { id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }): TypeSalleResponseDto {
    return {
      id: typeSalle.id,
      code: typeSalle.code,
      libelle: typeSalle.libelle,
      estActive: typeSalle.estActive,
      originId: typeSalle.originId ?? undefined,
      createdAt: typeSalle.createdAt,
      updatedAt: typeSalle.updatedAt,
    };
  }

  // ============================================
  // Salles
  // ============================================

  async createSalle(dto: CreateSalleDto, userId: string): Promise<SalleResponseDto> {
    if (dto.capaciteRecommandee !== undefined && dto.capaciteRecommandee > dto.capaciteMax) {
      throw new BadRequestException('La capacité recommandée ne peut pas dépasser la capacité maximale');
    }

    const existing = await this.prisma.salle.findFirst({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`La salle avec le code "${dto.code}" existe déjà`);
    }

    if (dto.departementId) {
      const departement = await this.prisma.departement.findUnique({ where: { id: dto.departementId } });
      if (!departement) {
        throw new NotFoundException('Département parent non trouvé');
      }
      await this.anneeImmutability.verifyAnneeWritable(departement.anneeId);
    }

    if (dto.typeSalleId) {
      const typeSalle = await this.prisma.typeSalle.findUnique({ where: { id: dto.typeSalleId } });
      if (!typeSalle) {
        throw new NotFoundException('Type de salle non trouvé');
      }
    }

    const salle = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; siteId: string | null; capaciteMax: number; capaciteRecommandee: number | null; accesPMR: boolean; commentaire: string | null; estActive: boolean; departementId: string | null; typeSalleId: string | null; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.salle.create({
          data: {
            code: dto.code,
            libelle: dto.libelle,
            siteId: dto.siteId ?? null,
            capaciteMax: dto.capaciteMax,
            capaciteRecommandee: dto.capaciteRecommandee ?? null,
            accesPMR: dto.accesPMR ?? false,
            commentaire: dto.commentaire ?? null,
            estActive: true,
            departementId: dto.departementId ?? null,
            typeSalleId: dto.typeSalleId ?? null,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Salle',
        motif: `Création salle ${dto.code}`,
      },
    );

    return this.toSalleDto(salle);
  }

  async findAllSalles(query: SalleQueryDto): Promise<PaginatedSallesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.estActive !== undefined) {
      where.estActive = query.estActive;
    }

    if (query.departementId) {
      where.departementId = query.departementId;
    }

    if (query.typeSalleId) {
      where.typeSalleId = query.typeSalleId;
    }

    if (query.accesPMR !== undefined) {
      where.accesPMR = query.accesPMR;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [salles, total] = await Promise.all([
      this.prisma.salle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          typeSalle: { select: { id: true, code: true, libelle: true } },
          departement: { select: { id: true, code: true, libelle: true } },
        },
      }),
      this.prisma.salle.count({ where }),
    ]);

    return {
      data: salles.map(this.toSalleDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSalleById(id: string): Promise<SalleResponseDto> {
    const salle = await this.prisma.salle.findUnique({
      where: { id },
      include: {
        typeSalle: { select: { id: true, code: true, libelle: true } },
        departement: { select: { id: true, code: true, libelle: true } },
        equipements: { include: { equipement: { select: { id: true, code: true, libelle: true, estActive: true } } } },
      },
    });
    if (!salle) {
      throw new NotFoundException('Salle non trouvée');
    }
    return this.toSalleDto(salle);
  }

  async updateSalle(id: string, dto: UpdateSalleDto, userId: string): Promise<SalleResponseDto> {
    const existing = await this.prisma.salle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Salle non trouvée');
    }

    if (existing.departementId) {
      const departement = await this.prisma.departement.findUnique({
        where: { id: existing.departementId },
        select: { anneeId: true },
      });
      if (departement) {
        await this.anneeImmutability.verifyAnneeWritable(departement.anneeId);
      }
    }

    if (dto.capaciteMax !== undefined && dto.capaciteRecommandee !== undefined && dto.capaciteRecommandee > dto.capaciteMax) {
      throw new BadRequestException('La capacité recommandée ne peut pas dépasser la capacité maximale');
    }
    if (dto.capaciteRecommandee !== undefined && dto.capaciteMax === undefined) {
      if (dto.capaciteRecommandee > existing.capaciteMax) {
        throw new BadRequestException('La capacité recommandée ne peut pas dépasser la capacité maximale');
      }
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.salle.findFirst({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException(`Le code de salle "${dto.code}" existe déjà`);
      }
    }

    if (dto.departementId !== undefined && dto.departementId !== null) {
      const departement = await this.prisma.departement.findUnique({ where: { id: dto.departementId } });
      if (!departement) {
        throw new NotFoundException('Département parent non trouvé');
      }
    }

    if (dto.typeSalleId !== undefined && dto.typeSalleId !== null) {
      const typeSalle = await this.prisma.typeSalle.findUnique({ where: { id: dto.typeSalleId } });
      if (!typeSalle) {
        throw new NotFoundException('Type de salle non trouvé');
      }
    }

    const salle = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; siteId: string | null; capaciteMax: number; capaciteRecommandee: number | null; accesPMR: boolean; commentaire: string | null; estActive: boolean; departementId: string | null; typeSalleId: string | null; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.salle.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.siteId !== undefined && { siteId: dto.siteId ?? null }),
            ...(dto.capaciteMax !== undefined && { capaciteMax: dto.capaciteMax }),
            ...(dto.capaciteRecommandee !== undefined && { capaciteRecommandee: dto.capaciteRecommandee ?? null }),
            ...(dto.accesPMR !== undefined && { accesPMR: dto.accesPMR }),
            ...(dto.commentaire !== undefined && { commentaire: dto.commentaire ?? null }),
            ...(dto.estActive !== undefined && { estActive: dto.estActive }),
            ...(dto.departementId !== undefined && { departementId: dto.departementId ?? null }),
            ...(dto.typeSalleId !== undefined && { typeSalleId: dto.typeSalleId ?? null }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Salle',
        objetId: id,
        motif: `Mise à jour salle ${id}`,
      },
    );

    if (dto.capaciteMax !== undefined || dto.capaciteRecommandee !== undefined) {
      await this.conflitService.recalculerConflitsSemestre();
    }

    return this.toSalleDto(salle);
  }

  async removeSalle(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.salle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Salle non trouvée');
    }

    if (existing.departementId) {
      const departement = await this.prisma.departement.findUnique({
        where: { id: existing.departementId },
        select: { anneeId: true },
      });
      if (departement) {
        await this.anneeImmutability.verifyAnneeWritable(departement.anneeId);
      }
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.salle.update({ where: { id }, data: { estActive: false } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Salle',
        objetId: id,
        motif: `Désactivation salle ${existing.code}`,
      },
    );
  }

  async assignerEquipements(id: string, dto: AssignerEquipementsDto, userId: string): Promise<SalleResponseDto> {
    const salle = await this.prisma.salle.findUnique({ where: { id } });
    if (!salle) {
      throw new NotFoundException('Salle non trouvée');
    }

    if (salle.departementId) {
      const departement = await this.prisma.departement.findUnique({
        where: { id: salle.departementId },
        select: { anneeId: true },
      });
      if (departement) {
        await this.anneeImmutability.verifyAnneeWritable(departement.anneeId);
      }
    }

    const equipements = await this.prisma.equipement.findMany({
      where: { id: { in: dto.equipementIds } },
    });
    if (equipements.length !== dto.equipementIds.length) {
      throw new NotFoundException('Un ou plusieurs équipements sont introuvables');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.salleEquipement.deleteMany({ where: { salleId: id } });
        await tx.salleEquipement.createMany({
          data: dto.equipementIds.map((equipementId) => ({
            salleId: id,
            equipementId,
          })),
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Salle',
        objetId: id,
        motif: `Affectation de ${dto.equipementIds.length} équipement(s) à la salle ${salle.code}`,
      },
    );

    return this.findSalleById(id);
  }

  private toSalleDto(salle: {
    id: string;
    code: string;
    libelle: string;
    siteId: string | null;
    capaciteMax: number;
    capaciteRecommandee: number | null;
    accesPMR: boolean;
    commentaire: string | null;
    estActive: boolean;
    departementId: string | null;
    typeSalleId: string | null;
    originId: string | null;
    createdAt: Date;
    updatedAt: Date;
    typeSalle?: { id: string; code: string; libelle: string } | null;
    departement?: { id: string; code: string; libelle: string } | null;
    equipements?: { equipement: { id: string; code: string; libelle: string; estActive: boolean } }[];
  }): SalleResponseDto {
    return {
      id: salle.id,
      code: salle.code,
      libelle: salle.libelle,
      siteId: salle.siteId ?? undefined,
      capaciteMax: salle.capaciteMax,
      capaciteRecommandee: salle.capaciteRecommandee ?? undefined,
      accesPMR: salle.accesPMR,
      commentaire: salle.commentaire ?? undefined,
      estActive: salle.estActive,
      departementId: salle.departementId ?? undefined,
      typeSalleId: salle.typeSalleId ?? undefined,
      originId: salle.originId ?? undefined,
      createdAt: salle.createdAt,
      updatedAt: salle.updatedAt,
    };
  }

  // ============================================
  // Équipements
  // ============================================

  async createEquipement(dto: CreateEquipementDto, userId: string): Promise<EquipementResponseDto> {
    const existing = await this.prisma.equipement.findFirst({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`L'équipement avec le code "${dto.code}" existe déjà`);
    }

    const equipement = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.equipement.create({
          data: {
            code: dto.code,
            libelle: dto.libelle,
            estActive: dto.estActive ?? true,
            originId: dto.originId ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Equipement',
        motif: `Création équipement ${dto.code}`,
      },
    );

    return this.toEquipementDto(equipement);
  }

  async findAllEquipements(query: EquipementQueryDto): Promise<PaginatedEquipementsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.estActive !== undefined) {
      where.estActive = query.estActive;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const [equipements, total] = await Promise.all([
      this.prisma.equipement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.equipement.count({ where }),
    ]);

    return {
      data: equipements.map(this.toEquipementDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findEquipementById(id: string): Promise<EquipementResponseDto> {
    const equipement = await this.prisma.equipement.findUnique({ where: { id } });
    if (!equipement) {
      throw new NotFoundException('Équipement non trouvé');
    }
    return this.toEquipementDto(equipement);
  }

  async updateEquipement(id: string, dto: UpdateEquipementDto, userId: string): Promise<EquipementResponseDto> {
    const existing = await this.prisma.equipement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Équipement non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.equipement.findFirst({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException(`Le code d'équipement "${dto.code}" existe déjà`);
      }
    }

    const equipement = await this.audit.auditTransaction<{ id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.equipement.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
            ...(dto.estActive !== undefined && { estActive: dto.estActive }),
            ...(dto.originId !== undefined && { originId: dto.originId ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Equipement',
        objetId: id,
        motif: `Mise à jour équipement ${id}`,
      },
    );

    return this.toEquipementDto(equipement);
  }

  async removeEquipement(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.equipement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Équipement non trouvé');
    }

    const sallesLiees = await this.prisma.salleEquipement.count({ where: { equipementId: id } });
    if (sallesLiees > 0) {
      throw new ConflictException(`Impossible de supprimer : ${sallesLiees} salle(s) utilisent cet équipement`);
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.equipement.update({ where: { id }, data: { estActive: false } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Equipement',
        objetId: id,
        motif: `Désactivation équipement ${existing.code}`,
      },
    );
  }

  private toEquipementDto(equipement: { id: string; code: string; libelle: string; estActive: boolean; originId: string | null; createdAt: Date; updatedAt: Date }): EquipementResponseDto {
    return {
      id: equipement.id,
      code: equipement.code,
      libelle: equipement.libelle,
      estActive: equipement.estActive,
      originId: equipement.originId ?? undefined,
      createdAt: equipement.createdAt,
      updatedAt: equipement.updatedAt,
    };
  }
}