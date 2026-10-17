import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateAnneeDto,
  UpdateAnneeDto,
  AnneeResponseDto,
  PaginatedAnneesDto,
  AnneeQueryDto,
  CreateSemestreDto,
  UpdateSemestreDto,
  SemestreResponseDto,
  PaginatedSemestresDto,
  SemestreQueryDto,
  AnneeStatut,
  TransitionAnneeDto,
} from './dto/annee.dto.js';

@Injectable()
export class AnneesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Années
  // ============================================

  async createAnnee(dto: CreateAnneeDto, userId: string): Promise<AnneeResponseDto> {
    const existingByCode = await this.prisma.annee.findUnique({ where: { code: dto.code } });
    if (existingByCode) {
      throw new ConflictException(`Le code d'année "${dto.code}" existe déjà`);
    }

    const existingByNumero = await this.prisma.annee.findUnique({ where: { numero: dto.numero } });
    if (existingByNumero) {
      throw new ConflictException(`Le numéro d'année ${dto.numero} existe déjà`);
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.create({
          data: {
            numero: dto.numero,
            code: dto.code,
            nbSemaines: dto.nbSemaines ?? 14,
            statut: 'PREPARATION',
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Annee',
        motif: `Création année ${dto.code}`,
      },
    );

    return this.toAnneeDto(annee);
  }

  async findAllAnnees(query: AnneeQueryDto): Promise<PaginatedAnneesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { numero: query.search },
      ];
    }

    if (query.statut !== undefined) {
      where.statut = query.statut;
    }

    const [annees, total] = await Promise.all([
      this.prisma.annee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { numero: 'desc' },
      }),
      this.prisma.annee.count({ where }),
    ]);

    return {
      data: annees.map(this.toAnneeDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAnneeById(id: string): Promise<AnneeResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id } });
    if (!annee) {
      throw new NotFoundException('Année non trouvée');
    }
    return this.toAnneeDto(annee);
  }

  async updateAnnee(id: string, dto: UpdateAnneeDto, userId: string): Promise<AnneeResponseDto> {
    const existing = await this.prisma.annee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.annee.findUnique({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException(`Le code d'année "${dto.code}" existe déjà`);
      }
    }

    if (dto.numero !== undefined && dto.numero !== existing.numero) {
      const conflict = await this.prisma.annee.findUnique({ where: { numero: dto.numero } });
      if (conflict) {
        throw new ConflictException(`Le numéro d'année ${dto.numero} existe déjà`);
      }
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.numero !== undefined && { numero: dto.numero }),
            ...(dto.nbSemaines !== undefined && { nbSemaines: dto.nbSemaines }),
            ...(dto.statut !== undefined && { statut: dto.statut as AnneeStatut }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Annee',
        objetId: id,
        motif: `Mise à jour année ${id}`,
      },
    );

    return this.toAnneeDto(annee);
  }

  async removeAnnee(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.annee.findUnique({
      where: { id },
      include: { semestres: true },
    });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (existing.semestres.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer une année comportant des semestres. Supprimez d\'abord les semestres.',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.annee.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Annee',
        objetId: id,
        motif: `Suppression année ${existing.code}`,
      },
    );
  }

  private toAnneeDto(annee: { id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }): AnneeResponseDto {
    return {
      id: annee.id,
      numero: annee.numero,
      code: annee.code,
      nbSemaines: annee.nbSemaines,
      statut: annee.statut,
      createdAt: annee.createdAt,
      updatedAt: annee.updatedAt,
    };
  }

  // ============================================
  // Transitions (activation / clôture) — L1-02
  // ============================================

  async activerAnnee(
    id: string,
    dto: TransitionAnneeDto,
    userId: string,
  ): Promise<AnneeResponseDto> {
    const existing = await this.prisma.annee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (dto.action === 'ACTIVER') {
      if (existing.statut === 'ACTIVE') {
        throw new ConflictException(`L'année "${existing.code}" est déjà active`);
      }
      // Double sécurité : une seule année ACTIVE à la fois (index unique partiel en DB également)
      const activeAnnee = await this.prisma.annee.findFirst({ where: { statut: 'ACTIVE' } });
      if (activeAnnee) {
        throw new ConflictException(
          `L'année "${activeAnnee.code}" est déjà active. Une seule année peut être active à la fois.`,
        );
      }

      const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
        async (tx) => {
          return tx.annee.update({
            where: { id },
            data: { statut: 'ACTIVE' },
          });
        },
        {
          userId,
          action: 'STATUS_CHANGED',
          objetType: 'Annee',
          objetId: id,
          motif: `Activation année ${existing.code}`,
        },
      );
      return this.toAnneeDto(annee);
    }

    // CLOTURER
    if (!dto.confirmation) {
      throw new BadRequestException('La clôture d\'une année nécessite une confirmation explicite.');
    }
    if (existing.statut === 'CLOTUREE') {
      throw new ConflictException(`L'année "${existing.code}" est déjà clôturée`);
    }
    if (existing.statut === 'PREPARATION') {
      throw new ConflictException(`Impossible de clôturer une année en préparation. Activez-la d'abord.`);
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.update({
          where: { id },
          data: { statut: 'CLOTUREE' },
        });
      },
      {
        userId,
        action: 'STATUS_CHANGED',
        objetType: 'Annee',
        objetId: id,
        motif: `Clôture année ${existing.code}`,
      },
    );
    return this.toAnneeDto(annee);
  }

  // ============================================
  // Semestres
  // ============================================

  async createSemestre(dto: CreateSemestreDto, userId: string): Promise<SemestreResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id: dto.anneeId } });
    if (!annee) {
      throw new NotFoundException('Année parente non trouvée');
    }

    const existing = await this.prisma.semestre.findUnique({
      where: { anneeId_numero: { anneeId: dto.anneeId, numero: dto.numero } },
    });
    if (existing) {
      throw new ConflictException(`Le semestre ${dto.numero} existe déjà pour cette année`);
    }

    const semestre = await this.audit.auditTransaction<{ id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.semestre.create({
          data: {
            anneeId: dto.anneeId,
            numero: dto.numero,
            nbSemaines: dto.nbSemaines ?? 14,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Semestre',
        motif: `Création semestre ${dto.numero} pour l'année ${dto.anneeId}`,
      },
    );

    return this.toSemestreDto(semestre);
  }

  async findAllSemestres(anneeId: string, query: SemestreQueryDto): Promise<PaginatedSemestresDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const [semestres, total] = await Promise.all([
      this.prisma.semestre.findMany({
        where: { anneeId },
        skip,
        take: limit,
        orderBy: { numero: 'asc' },
      }),
      this.prisma.semestre.count({ where: { anneeId } }),
    ]);

    return {
      data: semestres.map(this.toSemestreDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSemestreById(id: string): Promise<SemestreResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id } });
    if (!semestre) {
      throw new NotFoundException('Semestre non trouvé');
    }
    return this.toSemestreDto(semestre);
  }

  async updateSemestre(id: string, dto: UpdateSemestreDto, userId: string): Promise<SemestreResponseDto> {
    const existing = await this.prisma.semestre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Semestre non trouvé');
    }

    if (dto.numero !== undefined && dto.numero !== existing.numero) {
      const conflict = await this.prisma.semestre.findUnique({
        where: { anneeId_numero: { anneeId: existing.anneeId, numero: dto.numero } },
      });
      if (conflict) {
        throw new ConflictException(`Le semestre ${dto.numero} existe déjà pour cette année`);
      }
    }

    const semestre = await this.audit.auditTransaction<{ id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.semestre.update({
          where: { id },
          data: {
            ...(dto.numero !== undefined && { numero: dto.numero }),
            ...(dto.nbSemaines !== undefined && { nbSemaines: dto.nbSemaines }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Semestre',
        objetId: id,
        motif: `Mise à jour semestre ${id}`,
      },
    );

    return this.toSemestreDto(semestre);
  }

  async removeSemestre(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.semestre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Semestre non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.semestre.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Semestre',
        objetId: id,
        motif: `Suppression semestre ${existing.numero}`,
      },
    );
  }

  private toSemestreDto(semestre: { id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }): SemestreResponseDto {
    return {
      id: semestre.id,
      anneeId: semestre.anneeId,
      numero: semestre.numero,
      nbSemaines: semestre.nbSemaines,
      createdAt: semestre.createdAt,
      updatedAt: semestre.updatedAt,
    };
  }
}