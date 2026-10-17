import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateEnseignantDto,
  UpdateEnseignantDto,
  EnseignantResponseDto,
  PaginatedEnseignantsDto,
  EnseignantsQueryDto,
  AssignModulesDto,
} from './dto/enseignant.dto.js';

@Injectable()
export class EnseignantsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createEnseignant(
    dto: CreateEnseignantDto,
    userId: string,
  ): Promise<EnseignantResponseDto> {
    const existingMatricule = await this.prisma.enseignant.findFirst({
      where: {
        anneeId: dto.anneeId,
        matricule: dto.matricule,
      },
    });
    if (existingMatricule) {
      throw new ConflictException(
        `Le matricule "${dto.matricule}" existe déjà pour cette année`,
      );
    }

    const existingEmail = await this.prisma.enseignant.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException(
        `L'email "${dto.email}" est déjà utilisé`,
      );
    }

    await this.validateForeignKeys(dto.anneeId, dto.departementId, dto.gradeId);

    const enseignant = await this.audit.auditTransaction(
      async (tx) => {
        const created = await tx.enseignant.create({
          data: {
            matricule: dto.matricule,
            nom: dto.nom,
            prenom: dto.prenom,
            email: dto.email,
            telephone: dto.telephone || null,
            anneeId: dto.anneeId,
            departementId: dto.departementId,
            gradeId: dto.gradeId || null,
          },
        });

        if (dto.moduleIds && dto.moduleIds.length > 0) {
          await tx.enseignantModule.createMany({
            data: dto.moduleIds.map((moduleId) => ({
              enseignantId: created.id,
              moduleId,
            })),
            skipDuplicates: true,
          });
        }

        return created;
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Enseignant',
        motif: `Création enseignant ${dto.matricule} (${dto.prenom} ${dto.nom})`,
      },
    );

    return this.toEnseignantDto(
      await this.prisma.enseignant.findUnique({
        where: { id: enseignant.id },
        include: { enseignantModules: { select: { moduleId: true } } },
      }) as any,
    );
  }

  async findAllEnseignants(
    query: EnseignantsQueryDto,
  ): Promise<PaginatedEnseignantsDto> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive = true,
      departementId,
      gradeId,
      anneeId,
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive };

    if (departementId) where.departementId = departementId;
    if (gradeId) where.gradeId = gradeId;
    if (anneeId) where.anneeId = anneeId;

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { matricule: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.enseignant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nom: 'asc', prenom: 'asc' },
        include: {
          enseignantModules: { select: { moduleId: true } },
        },
      }),
      this.prisma.enseignant.count({ where }),
    ]);

    return {
      data: data.map((e) => this.toEnseignantDto(e as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findEnseignantById(id: string): Promise<EnseignantResponseDto> {
    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id },
      include: {
        enseignantModules: { select: { moduleId: true } },
      },
    });
    if (!enseignant) {
      throw new NotFoundException('Enseignant non trouvé');
    }
    return this.toEnseignantDto(enseignant as any);
  }

  async updateEnseignant(
    id: string,
    dto: UpdateEnseignantDto,
    userId: string,
  ): Promise<EnseignantResponseDto> {
    const existing = await this.prisma.enseignant.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Enseignant non trouvé');
    }

    if (dto.matricule && dto.matricule !== existing.matricule) {
      const dup = await this.prisma.enseignant.findFirst({
        where: {
          anneeId: dto.anneeId || existing.anneeId,
          matricule: dto.matricule,
        },
      });
      if (dup) {
        throw new ConflictException(
          `Le matricule "${dto.matricule}" existe déjà pour cette année`,
        );
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const dup = await this.prisma.enseignant.findUnique({
        where: { email: dto.email },
      });
      if (dup) {
        throw new ConflictException(
          `L'email "${dto.email}" est déjà utilisé`,
        );
      }
    }

    await this.validateForeignKeys(
      dto.anneeId || existing.anneeId,
      dto.departementId || existing.departementId,
      dto.gradeId,
    );

    const data: Record<string, unknown> = {};
    if (dto.matricule !== undefined) data.matricule = dto.matricule;
    if (dto.nom !== undefined) data.nom = dto.nom;
    if (dto.prenom !== undefined) data.prenom = dto.prenom;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telephone !== undefined) data.telephone = dto.telephone;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.anneeId !== undefined) data.anneeId = dto.anneeId;
    if (dto.departementId !== undefined) data.departementId = dto.departementId;
    if (dto.gradeId !== undefined) data.gradeId = dto.gradeId;

    const enseignant = await this.audit.auditTransaction(
      async (tx) => {
        return tx.enseignant.update({ where: { id }, data });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Enseignant',
        objetId: id,
        motif: `Mise à jour enseignant ${existing.matricule}`,
      },
    );

    return this.toEnseignantDto(
      await this.prisma.enseignant.findUnique({
        where: { id: enseignant.id },
        include: { enseignantModules: { select: { moduleId: true } } },
      }) as any,
    );
  }

  async removeEnseignant(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.enseignant.findUnique({
      where: { id },
      include: {
        enseignantModules: { select: { moduleId: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Enseignant non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.enseignant.update({
          where: { id },
          data: { isActive: false },
        });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Enseignant',
        objetId: id,
        motif: `Désactivation enseignant ${existing.matricule}`,
      },
    );
  }

  async assignModules(
    enseignantId: string,
    dto: AssignModulesDto,
    userId: string,
  ): Promise<EnseignantResponseDto> {
    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException('Enseignant non trouvé');
    }

    const modules = await this.prisma.module.findMany({
      where: { id: { in: dto.moduleIds } },
    });
    if (modules.length !== dto.moduleIds.length) {
      throw new NotFoundException('Un ou plusieurs modules sont introuvables');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.enseignantModule.createMany({
          data: dto.moduleIds.map((moduleId) => ({
            enseignantId,
            moduleId,
          })),
          skipDuplicates: true,
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Enseignant',
        objetId: enseignantId,
        motif: `Assignation de ${dto.moduleIds.length} module(s) à l'enseignant ${enseignant.matricule}`,
      },
    );

    return this.findEnseignantById(enseignantId);
  }

  async unassignModule(
    enseignantId: string,
    moduleId: string,
    userId: string,
  ): Promise<void> {
    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException('Enseignant non trouvé');
    }

    const existingLink = await this.prisma.enseignantModule.findUnique({
      where: {
        enseignantId_moduleId: { enseignantId, moduleId },
      },
    });
    if (!existingLink) {
      throw new NotFoundException(
        'Ce module n\'est pas assigné à cet enseignant',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.enseignantModule.delete({
          where: {
            enseignantId_moduleId: { enseignantId, moduleId },
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Enseignant',
        objetId: enseignantId,
        motif: `Désassignation du module ${moduleId} de l'enseignant ${enseignant.matricule}`,
      },
    );
  }

  private async validateForeignKeys(
    anneeId: string,
    departementId: string,
    gradeId?: string | null,
  ): Promise<void> {
    const annee = await this.prisma.annee.findUnique({ where: { id: anneeId } });
    if (!annee) {
      throw new NotFoundException('Année non trouvée');
    }

    const departement = await this.prisma.departement.findUnique({
      where: { id: departementId },
    });
    if (!departement) {
      throw new NotFoundException('Département non trouvé');
    }

    if (departement.anneeId !== anneeId) {
      throw new ConflictException(
        'Le département ne appartient pas à cette année universitaire',
      );
    }

    if (gradeId) {
      const grade = await this.prisma.grade.findUnique({ where: { id: gradeId } });
      if (!grade) {
        throw new NotFoundException('Grade non trouvé');
      }
    }
  }

  private toEnseignantDto(enseignant: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    isActive: boolean;
    anneeId: string;
    departementId: string;
    gradeId: string | null;
    enseignantModules: { moduleId: string }[];
    createdAt: Date;
    updatedAt: Date;
  }): EnseignantResponseDto {
    return {
      id: enseignant.id,
      matricule: enseignant.matricule,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      telephone: enseignant.telephone,
      isActive: enseignant.isActive,
      anneeId: enseignant.anneeId,
      departementId: enseignant.departementId,
      gradeId: enseignant.gradeId,
      moduleIds: enseignant.enseignantModules.map((m) => m.moduleId),
      createdAt: enseignant.createdAt,
      updatedAt: enseignant.updatedAt,
    };
  }
}
