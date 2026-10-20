import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateTypeEnseignementDto,
  UpdateTypeEnseignementDto,
  TypeEnseignementResponseDto,
  TypeEnseignementCode,
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  GradeCode,
  CreateModuleDto,
  UpdateModuleDto,
  ModuleResponseDto,
  PaginatedModulesDto,
  ModulesQueryDto,
} from './dto/module.dto.js';
import {
  CreateModuleVolumeDto,
  UpdateModuleVolumeDto,
  ModuleVolumeResponseDto,
  ModuleVolumesQueryDto,
  PaginatedModuleVolumesDto,
  VolumeTypeValues,
} from './dto/volume.dto.js';

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Types d'enseignement
  // ============================================

  async createTypeEnseignement(
    dto: CreateTypeEnseignementDto,
    userId: string,
  ): Promise<TypeEnseignementResponseDto> {
    const existing = await this.prisma.typeEnseignement.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Le type d'enseignement "${dto.code}" existe déjà`,
      );
    }

    const type = await this.audit.auditTransaction(
      async (tx) => {
        return tx.typeEnseignement.create({
          data: {
            code: dto.code,
            libelle: dto.libelle,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'TypeEnseignement',
        motif: `Création type d'enseignement ${dto.code}`,
      },
    );

    return this.toTypeEnseignementDto(type);
  }

  async findAllTypesEnseignement(): Promise<TypeEnseignementResponseDto[]> {
    const types = await this.prisma.typeEnseignement.findMany({
      orderBy: { code: 'asc' },
    });
    return types.map((t) => this.toTypeEnseignementDto(t));
  }

  async findTypeEnseignementById(id: string): Promise<TypeEnseignementResponseDto> {
    const type = await this.prisma.typeEnseignement.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException('Type d\'enseignement non trouvé');
    }
    return this.toTypeEnseignementDto(type);
  }

  async updateTypeEnseignement(
    id: string,
    dto: UpdateTypeEnseignementDto,
    userId: string,
  ): Promise<TypeEnseignementResponseDto> {
    const existing = await this.prisma.typeEnseignement.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Type d\'enseignement non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.typeEnseignement.findUnique({
        where: { code: dto.code },
      });
      if (dup) {
        throw new ConflictException(
          `Le type d'enseignement "${dto.code}" existe déjà`,
        );
      }
    }

    const type = await this.audit.auditTransaction(
      async (tx) => {
        return tx.typeEnseignement.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'TypeEnseignement',
        objetId: id,
        motif: `Mise à jour type d'enseignement ${existing.code}`,
      },
    );

    return this.toTypeEnseignementDto(type);
  }

  async removeTypeEnseignement(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.typeEnseignement.findUnique({
      where: { id },
      include: { modules: true },
    });
    if (!existing) {
      throw new NotFoundException('Type d\'enseignement non trouvé');
    }

    if (existing.modules.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer un type d\'enseignement référencé par des modules',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.typeEnseignement.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'TypeEnseignement',
        objetId: id,
        motif: `Suppression type d'enseignement ${existing.code}`,
      },
    );
  }

// ============================================
// Grades
// ============================================

  async createGrade(dto: CreateGradeDto, userId: string): Promise<GradeResponseDto> {
    const existing = await this.prisma.grade.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Le grade "${dto.code}" existe déjà`);
    }

    const grade = await this.audit.auditTransaction(
      async (tx) => {
        return tx.grade.create({ data: { code: dto.code, libelle: dto.libelle } });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Grade',
        motif: `Création grade ${dto.code}`,
      },
    );

    return this.toGradeDto(grade);
  }

  async findAllGrades(): Promise<GradeResponseDto[]> {
    const grades = await this.prisma.grade.findMany({ orderBy: { code: 'asc' } });
    return grades.map((g) => this.toGradeDto(g));
  }

  async findGradeById(id: string): Promise<GradeResponseDto> {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw new NotFoundException('Grade non trouvé');
    }
    return this.toGradeDto(grade);
  }

  async updateGrade(
    id: string,
    dto: UpdateGradeDto,
    userId: string,
  ): Promise<GradeResponseDto> {
    const existing = await this.prisma.grade.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Grade non trouvé');
    }

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.grade.findUnique({ where: { code: dto.code } });
      if (dup) {
        throw new ConflictException(`Le grade "${dto.code}" existe déjà`);
      }
    }

    const grade = await this.audit.auditTransaction(
      async (tx) => {
        return tx.grade.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Grade',
        objetId: id,
        motif: `Mise à jour grade ${existing.code}`,
      },
    );

    return this.toGradeDto(grade);
  }

  async removeGrade(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.grade.findUnique({
      where: { id },
      include: { modules: true },
    });
    if (!existing) {
      throw new NotFoundException('Grade non trouvé');
    }

    if (existing.modules.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer un grade référencé par des modules',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.grade.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Grade',
        objetId: id,
        motif: `Suppression grade ${existing.code}`,
      },
    );
  }

  // ============================================
  // Modules

  async createModule(dto: CreateModuleDto, userId: string): Promise<ModuleResponseDto> {
    const niveau = await this.prisma.niveau.findUnique({ where: { id: dto.niveauId } });
    if (!niveau) {
      throw new NotFoundException('Niveau non trouvé');
    }

    const type = await this.prisma.typeEnseignement.findUnique({ where: { id: dto.typeId } });
    if (!type) {
      throw new NotFoundException('Type d\'enseignement non trouvé');
    }

    if (dto.gradeId) {
      const grade = await this.prisma.grade.findUnique({ where: { id: dto.gradeId } });
      if (!grade) {
        throw new NotFoundException('Grade non trouvé');
      }
    }

    const existing = await this.prisma.module.findFirst({
      where: {
        niveauId: dto.niveauId,
        code: dto.code,
        semestreNumero: dto.semestreNumero,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Le module "${dto.code}" existe déjà pour ce niveau et ce semestre`,
      );
    }

    const module = await this.audit.auditTransaction(
      async (tx) => {
        return tx.module.create({
          data: {
            niveauId: dto.niveauId,
            typeId: dto.typeId,
            gradeId: dto.gradeId ?? null,
            code: dto.code,
            libelle: dto.libelle,
            semestreNumero: dto.semestreNumero,
            credits: dto.credits ?? null,
            effectifMax: dto.effectifMax ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Module',
        motif: `Création module ${dto.code}`,
      },
    );

    return this.toModuleDto(module);
  }


  async findAllModules(query: ModulesQueryDto): Promise<PaginatedModulesDto> {
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

    if (query.niveauId) {
      where.niveauId = query.niveauId;
    }

    if (query.semestreNumero !== undefined) {
      where.semestreNumero = query.semestreNumero;
    }

    if (query.typeCode !== undefined) {
      const type = await this.prisma.typeEnseignement.findFirst({
        where: { code: query.typeCode as any },
      });
      if (type) {
        where.typeId = type.id;
      } else {
        where.typeId = 'nonexistent-id';
      }
    }

    if (query.gradeCode !== undefined) {
      const grade = await this.prisma.grade.findFirst({
        where: { code: query.gradeCode as any },
      });
      if (grade) {
        where.gradeId = grade.id;
      } else {
        where.gradeId = 'nonexistent-id';
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: { type: true, grade: true },
      }),
      this.prisma.module.count({ where }),
    ]);

    return {
      data: data.map((m) => this.toModuleDto(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findModuleById(id: string): Promise<ModuleResponseDto> {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: { type: true, grade: true },
    });
    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }
    return this.toModuleDto(module);
  }

  async updateModule(
    id: string,
    dto: UpdateModuleDto,
    userId: string,
  ): Promise<ModuleResponseDto> {
    const existing = await this.prisma.module.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Module non trouvé');
    }

    if (dto.niveauId) {
      const niveau = await this.prisma.niveau.findUnique({ where: { id: dto.niveauId } });
      if (!niveau) {
        throw new NotFoundException('Niveau non trouvé');
      }
    }

    if (dto.typeId) {
      const type = await this.prisma.typeEnseignement.findUnique({ where: { id: dto.typeId } });
      if (!type) {
        throw new NotFoundException('Type d\'enseignement non trouvé');
      }
    }

    if (dto.gradeId !== undefined) {
      if (dto.gradeId !== null) {
        const grade = await this.prisma.grade.findUnique({ where: { id: dto.gradeId } });
        if (!grade) {
          throw new NotFoundException('Grade non trouvé');
        }
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.libelle !== undefined) data.libelle = dto.libelle;
    if (dto.semestreNumero !== undefined) data.semestreNumero = dto.semestreNumero;
    if (dto.credits !== undefined) data.credits = dto.credits;
    if (dto.effectifMax !== undefined) data.effectifMax = dto.effectifMax;
    if (dto.niveauId !== undefined) data.niveauId = dto.niveauId;
    if (dto.typeId !== undefined) data.typeId = dto.typeId;
    if (dto.gradeId !== undefined) data.gradeId = dto.gradeId;

    const module = await this.audit.auditTransaction(
      async (tx) => {
        return tx.module.update({ where: { id }, data });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Module',
        objetId: id,
        motif: `Mise à jour module ${existing.code}`,
      },
    );

    return this.toModuleDto(module);
  }

  async removeModule(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.module.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Module non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.module.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Module',
        objetId: id,
        motif: `Suppression module ${existing.code}`,
      },
    );
  }

  // ============================================
  // Module Volumes (L2-01)
  // ============================================

  async createModuleVolume(
    moduleId: string,
    dto: CreateModuleVolumeDto,
    userId: string,
  ): Promise<ModuleVolumeResponseDto> {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }

    const existing = await this.prisma.moduleVolume.findUnique({
      where: { moduleId_type: { moduleId, type: dto.type } },
    });
    if (existing) {
      throw new ConflictException(
        `Un volume existe déjà pour le module ${moduleId} et le type ${dto.type}`,
      );
    }

    if (dto.volume % 30 !== 0) {
      throw new ConflictException(
        'Le volume doit être un multiple de 30 minutes',
      );
    }

    const volume = await this.audit.auditTransaction(
      async (tx) => {
        return tx.moduleVolume.create({
          data: {
            moduleId,
            type: dto.type,
            volume: dto.volume,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ModuleVolume',
        motif: `Création volume module ${moduleId} type ${dto.type}`,
      },
    );

    return this.toModuleVolumeDto(volume);
  }

  async findModuleVolumes(
    moduleId: string,
    query: ModuleVolumesQueryDto,
  ): Promise<PaginatedModuleVolumesDto> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.moduleVolume.findMany({
        where: { moduleId },
        orderBy: { type: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.moduleVolume.count({ where: { moduleId } }),
    ]);

    return {
      data: data.map((v) => this.toModuleVolumeDto(v)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findModuleVolumeById(volumeId: string): Promise<ModuleVolumeResponseDto> {
    const volume = await this.prisma.moduleVolume.findUnique({
      where: { id: volumeId },
    });
    if (!volume) {
      throw new NotFoundException('Volume non trouvé');
    }
    return this.toModuleVolumeDto(volume);
  }

  async updateModuleVolume(
    volumeId: string,
    dto: UpdateModuleVolumeDto,
    userId: string,
  ): Promise<ModuleVolumeResponseDto> {
    const existing = await this.prisma.moduleVolume.findUnique({
      where: { id: volumeId },
    });
    if (!existing) {
      throw new NotFoundException('Volume non trouvé');
    }

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.volume !== undefined) {
      if (dto.volume % 30 !== 0) {
        throw new ConflictException(
          'Le volume doit être un multiple de 30 minutes',
        );
      }
      data.volume = dto.volume;
    }

    // Check uniqueness if type changed
    if (dto.type !== undefined && dto.type !== existing.type) {
      const dup = await this.prisma.moduleVolume.findUnique({
        where: { moduleId_type: { moduleId: existing.moduleId, type: dto.type } },
      });
      if (dup) {
        throw new ConflictException(
          `Un volume existe déjà pour le module ${existing.moduleId} et le type ${dto.type}`,
        );
      }
    }

    const volume = await this.audit.auditTransaction(
      async (tx) => {
        return tx.moduleVolume.update({
          where: { id: volumeId },
          data,
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ModuleVolume',
        objetId: volumeId,
        motif: `Mise à jour volume ${volumeId}`,
      },
    );

    return this.toModuleVolumeDto(volume);
  }

  async removeModuleVolume(volumeId: string, userId: string): Promise<void> {
    const existing = await this.prisma.moduleVolume.findUnique({
      where: { id: volumeId },
    });
    if (!existing) {
      throw new NotFoundException('Volume non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.moduleVolume.delete({ where: { id: volumeId } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'ModuleVolume',
        objetId: volumeId,
        motif: `Suppression volume ${volumeId}`,
      },
    );
  }

  // ============================================
  // Helpers privés
  // ============================================

  private toTypeEnseignementDto(type: {
    id: string; code: TypeEnseignementCode; libelle: string;
    createdAt: Date; updatedAt: Date;
  }): TypeEnseignementResponseDto {
    return {
      id: type.id,
      code: type.code,
      libelle: type.libelle,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    };
  }

  private toGradeDto(grade: {
    id: string; code: GradeCode; libelle: string;
    createdAt: Date; updatedAt: Date;
  }): GradeResponseDto {
    return {
      id: grade.id,
      code: grade.code,
      libelle: grade.libelle,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    };
  }

  private toModuleDto(module: {
    id: string; niveauId: string; typeId: string; gradeId: string | null;
    code: string; libelle: string; semestreNumero: number; credits: number | null;
    effectifMax: number | null; originId: string | null; createdAt: Date; updatedAt: Date;
  }): ModuleResponseDto {
    return {
      id: module.id,
      niveauId: module.niveauId,
      typeId: module.typeId,
      gradeId: module.gradeId,
      code: module.code,
      libelle: module.libelle,
      semestreNumero: module.semestreNumero,
      credits: module.credits ?? 0,
      effectifMax: module.effectifMax,
      originId: module.originId,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  private toModuleVolumeDto(volume: {
    id: string; moduleId: string; type: string; volume: number;
    createdAt: Date; updatedAt: Date;
  }): ModuleVolumeResponseDto {
    return {
      id: volume.id,
      moduleId: volume.moduleId,
      type: volume.type as (typeof VolumeTypeValues)[number],
      volume: volume.volume,
      createdAt: volume.createdAt,
      updatedAt: volume.updatedAt,
    };
  }
}
  // ============================================