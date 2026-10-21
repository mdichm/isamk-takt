import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateRepartitionDto,
  UpdateRepartitionDto,
  RepartitionResponseDto,
  PaginatedRepartitionsDto,
  RepartitionQueryDto,
} from './dto/repartition.dto.js';
import {
  CreateAffectationDto,
  UpdateAffectationDto,
  AffectationResponseDto,
  PaginatedAffectationsDto,
  AffectationQueryDto,
} from './dto/affectation.dto.js';
import { RepartitionStatut } from '@takt/db';

const toRepartitionDto = (entity: any): RepartitionResponseDto => ({
  id: entity.id,
  semestreId: entity.semestreId,
  departementId: entity.departementId,
  statut: entity.statut,
  libelle: entity.libelle ?? undefined,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

const toAffectationDto = (entity: any): AffectationResponseDto => ({
  id: entity.id,
  repartitionId: entity.repartitionId,
  enseignantId: entity.enseignantId,
  groupeId: entity.groupeId ?? undefined,
  moduleId: entity.moduleId,
  typeEnseignementId: entity.typeEnseignementId,
  activityTagId: entity.activityTagId ?? undefined,
  volumeHebdoMinutes: entity.volumeHebdoMinutes,
  seancesParSemaine: entity.seancesParSemaine,
  dureeMinutes: entity.dureeMinutes,
  estCmCommun: entity.estCmCommun,
  workingRevision: entity.workingRevision,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

@Injectable()
export class RepartitionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createRepartition(
    dto: CreateRepartitionDto,
    userId: string,
  ): Promise<RepartitionResponseDto> {
    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre ${dto.semestreId} introuvable`);
    }

    // Vérifier que le département existe
    const departement = await this.prisma.departement.findUnique({
      where: { id: dto.departementId },
    });
    if (!departement) {
      throw new NotFoundException(`Département ${dto.departementId} introuvable`);
    }

    // Vérifier l'unicité de (semestreId, departementId)
    const existing = await this.prisma.repartition.findFirst({
      where: {
        semestreId: dto.semestreId,
        departementId: dto.departementId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Une répartition existe déjà pour ce semestre et ce département`,
      );
    }

    const statut = dto.statut ?? RepartitionStatut.BROUILLON;

    const repartition = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.create({
          data: {
            semestreId: dto.semestreId,
            departementId: dto.departementId,
            statut,
            libelle: dto.libelle ?? null,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Repartition',
        motif: `Création répartition semestre=${dto.semestreId} departement=${dto.departementId}`,
      },
    );

    return toRepartitionDto(repartition);
  }

  async findAllRepartitions(
    query: RepartitionQueryDto,
  ): Promise<PaginatedRepartitionsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    if (query.statut) {
      where.statut = query.statut;
    }

    if (query.semestreId) {
      where.semestreId = query.semestreId;
    }

    if (query.departementId) {
      where.departementId = query.departementId;
    }

    const [repartitions, total] = await Promise.all([
      this.prisma.repartition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          semestre: { select: { id: true, numero: true } },
          departement: { select: { id: true, code: true, libelle: true } },
        },
      }),
      this.prisma.repartition.count({ where }),
    ]);

    return {
      data: repartitions.map((r) => ({
        id: r.id,
        semestreId: r.semestreId,
        departementId: r.departementId,
        statut: r.statut,
        libelle: r.libelle ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRepartitionById(id: string): Promise<RepartitionResponseDto> {
    const repartition = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!repartition) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }
    return toRepartitionDto(repartition);
  }

  async updateRepartition(
    id: string,
    dto: UpdateRepartitionDto,
    userId: string,
  ): Promise<RepartitionResponseDto> {
    const existing = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }

    const updated = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.update({
          where: { id },
          data: {
            ...(dto.statut !== undefined && { statut: dto.statut }),
            ...(dto.libelle !== undefined && { libelle: dto.libelle ?? null }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Repartition',
        objetId: id,
        motif: `Mise à jour répartition ${id}`,
      },
    );

    return toRepartitionDto(updated);
  }

  async removeRepartition(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.repartition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }

    await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.repartition.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Repartition',
        objetId: id,
        motif: `Suppression répartition ${id}`,
      },
    );
  }

  // ============================================
  // Affectations (L2-07)
  // ============================================

  async createAffectation(
    repartitionId: string,
    dto: CreateAffectationDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AffectationResponseDto> {
    const repartition = await this.prisma.repartition.findUnique({
      where: { id: repartitionId },
      include: { semestre: { select: { id: true, numero: true } } },
    });
    if (!repartition) {
      throw new NotFoundException(`Répartition ${repartitionId} introuvable`);
    }

    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments &&
      !currentUser.departments.includes(repartition.departementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : cette répartition n\'appartient pas à votre département',
      );
    }

    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: dto.enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException(`Enseignant ${dto.enseignantId} introuvable`);
    }
    if (!enseignant.isActive) {
      throw new UnprocessableEntityException(
        `L'enseignant ${enseignant.matricule} est inactif`,
      );
    }

    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
    });
    if (!module) {
      throw new NotFoundException(`Module ${dto.moduleId} introuvable`);
    }

    const typeEnseignement = await this.prisma.typeEnseignement.findUnique({
      where: { id: dto.typeEnseignementId },
    });
    if (!typeEnseignement) {
      throw new NotFoundException(
        `Type d'enseignement ${dto.typeEnseignementId} introuvable`,
      );
    }

    if (dto.groupeId) {
      const groupe = await this.prisma.groupe.findUnique({
        where: { id: dto.groupeId },
      });
      if (!groupe) {
        throw new NotFoundException(`Groupe ${dto.groupeId} introuvable`);
      }
      if (module.niveauId !== groupe.niveauId) {
        throw new UnprocessableEntityException(
          'Le module n\'appartient pas au même niveau que le groupe',
        );
      }
    }

    if (module.semestreNumero !== repartition.semestre.numero) {
      throw new UnprocessableEntityException(
        'Le module n\'est pas enseigné ce semestre',
      );
    }

    const existing = await this.prisma.affectation.findFirst({
      where: {
        repartitionId,
        enseignantId: dto.enseignantId,
        moduleId: dto.moduleId,
        typeEnseignementId: dto.typeEnseignementId,
        groupeId: dto.groupeId ?? null,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Une affectation existe déjà pour ce (répartition, enseignant, module, type, groupe)',
      );
    }

    if (dto.dureeMinutes % 30 !== 0) {
      throw new BadRequestException(
        'La durée doit être un multiple de 30 minutes',
      );
    }

    const volumeHebdoMinutes = dto.seancesParSemaine * dto.dureeMinutes;
    const activityTagId = dto.activityTagId ?? typeEnseignement.activityTagId ?? null;

    const affectation = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.affectation.create({
          data: {
            repartitionId,
            enseignantId: dto.enseignantId,
            groupeId: dto.groupeId ?? null,
            moduleId: dto.moduleId,
            typeEnseignementId: dto.typeEnseignementId,
            activityTagId,
            volumeHebdoMinutes,
            seancesParSemaine: dto.seancesParSemaine,
            dureeMinutes: dto.dureeMinutes,
            estCmCommun: dto.estCmCommun ?? false,
          },
        });
      },
      {
        userId: currentUser.id,
        action: 'CREATE',
        objetType: 'Affectation',
        motif: 'Création affectation enseignant=' + dto.enseignantId + ' module=' + dto.moduleId + ' type=' + dto.typeEnseignementId,
      },
    );

    return toAffectationDto(affectation);
  }
  async findAllAffectations(
    repartitionId: string,
    query: AffectationQueryDto,
  ): Promise<PaginatedAffectationsDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { repartitionId };

    if (query.enseignantId) where.enseignantId = query.enseignantId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.groupeId) where.groupeId = query.groupeId;

    const [affectations, total] = await Promise.all([
      this.prisma.affectation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enseignant: { select: { id: true, matricule: true, nom: true, prenom: true } },
          module: { select: { id: true, code: true, libelle: true } },
          typeEnseignement: { select: { id: true, code: true, libelle: true } },
          groupe: { select: { id: true, code: true, libelle: true } },
          activityTag: { select: { id: true, code: true, libelle: true } },
        },
      }),
      this.prisma.affectation.count({ where }),
    ]);

    return {
      data: affectations.map((a) => toAffectationDto(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAffectationById(id: string): Promise<AffectationResponseDto> {
    const affectation = await this.prisma.affectation.findUnique({
      where: { id },
    });
    if (!affectation) {
      throw new NotFoundException(`Affectation ${id} introuvable`);
    }
    return toAffectationDto(affectation);
  }
  async updateAffectation(
    id: string,
    dto: UpdateAffectationDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AffectationResponseDto> {
    const existing = await this.prisma.affectation.findUnique({
      where: { id },
      include: { repartition: true },
    });
    if (!existing) {
      throw new NotFoundException(`Affectation ${id} introuvable`);
    }

    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments &&
      !currentUser.departments.includes(existing.repartition.departementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : cette affectation n\'appartient pas à votre département',
      );
    }

    if (dto.dureeMinutes !== undefined && dto.dureeMinutes % 30 !== 0) {
      throw new BadRequestException(
        'La durée doit être un multiple de 30 minutes',
      );
    }

    const seancesParSemaine = dto.seancesParSemaine ?? existing.seancesParSemaine;
    const dureeMinutes = dto.dureeMinutes ?? existing.dureeMinutes;
    const volumeHebdoMinutes = seancesParSemaine * dureeMinutes;

    let activityTagId = existing.activityTagId;
    if (dto.typeEnseignementId !== undefined && dto.typeEnseignementId !== existing.typeEnseignementId) {
      const typeEnseignement = await this.prisma.typeEnseignement.findUnique({
        where: { id: dto.typeEnseignementId },
      });
      if (!typeEnseignement) {
        throw new NotFoundException(
          `Type d'enseignement ${dto.typeEnseignementId} introuvable`,
        );
      }
      activityTagId = dto.activityTagId ?? typeEnseignement.activityTagId ?? null;
    } else if (dto.activityTagId !== undefined) {
      activityTagId = dto.activityTagId;
    }

    if (
      (dto.enseignantId !== undefined && dto.enseignantId !== existing.enseignantId) ||
      (dto.moduleId !== undefined && dto.moduleId !== existing.moduleId) ||
      (dto.typeEnseignementId !== undefined && dto.typeEnseignementId !== existing.typeEnseignementId) ||
      (dto.groupeId !== undefined && dto.groupeId !== existing.groupeId)
    ) {
      const duplicate = await this.prisma.affectation.findFirst({
        where: {
          repartitionId: existing.repartitionId,
          enseignantId: dto.enseignantId ?? existing.enseignantId,
          moduleId: dto.moduleId ?? existing.moduleId,
          typeEnseignementId: dto.typeEnseignementId ?? existing.typeEnseignementId,
          groupeId: dto.groupeId ?? existing.groupeId ?? null,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'Une affectation existe déjà pour ce (répartition, enseignant, module, type, groupe)',
        );
      }
    }
    const updated = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.affectation.update({
          where: { id },
          data: {
            ...(dto.enseignantId !== undefined && { enseignantId: dto.enseignantId }),
            ...(dto.groupeId !== undefined && { groupeId: dto.groupeId ?? null }),
            ...(dto.moduleId !== undefined && { moduleId: dto.moduleId }),
            ...(dto.typeEnseignementId !== undefined && { typeEnseignementId: dto.typeEnseignementId }),
            ...(dto.activityTagId !== undefined && { activityTagId: dto.activityTagId ?? null }),
            ...((dto.seancesParSemaine !== undefined || dto.dureeMinutes !== undefined) && { volumeHebdoMinutes }),
            ...(dto.seancesParSemaine !== undefined && { seancesParSemaine }),
            ...(dto.dureeMinutes !== undefined && { dureeMinutes }),
            ...(dto.estCmCommun !== undefined && { estCmCommun: dto.estCmCommun }),
            workingRevision: existing.workingRevision + 1,
          },
        });
      },
      {
        userId: currentUser.id,
        action: 'UPDATE',
        objetType: 'Affectation',
        objetId: id,
        motif: 'Mise à jour affectation ' + id,
      },
    );

    return toAffectationDto(updated);
  }

  async removeAffectation(
    id: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<void> {
    const existing = await this.prisma.affectation.findUnique({
      where: { id },
      include: { repartition: true },
    });
    if (!existing) {
      throw new NotFoundException(`Affectation ${id} introuvable`);
    }

    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments &&
      !currentUser.departments.includes(existing.repartition.departementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : cette affectation n\'appartient pas à votre département',
      );
    }

    await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.affectation.delete({ where: { id } });
      },
      {
        userId: currentUser.id,
        action: 'DELETE',
        objetType: 'Affectation',
        objetId: id,
        motif: 'Suppression affectation ' + id,
      },
    );
  }
}

