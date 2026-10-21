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
  ControleVolumeDto,
  ControlesResponseDto,
  ControleStatut,
  ValidateRepartitionDto,
  SnapshotAffectationDto,
  SnapshotChargeDto,
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

    // ImmutabilityGuard : une répartition VALIDEE ne peut plus être modifiée
    if (existing.statut === RepartitionStatut.VALIDEE) {
      throw new ConflictException(
        'IMMUTABILITY : cette répartition est déjà validée et ne peut plus être modifiée',
      );
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

    // ImmutabilityGuard : une répartition VALIDEE ne peut plus être supprimée
    if (existing.statut === RepartitionStatut.VALIDEE) {
      throw new ConflictException(
        'IMMUTABILITY : cette répartition est déjà validée et ne peut plus être supprimée',
      );
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

    // ImmutabilityGuard : aucune affectation sur une répartition VALIDEE
    if (repartition.statut === RepartitionStatut.VALIDEE) {
      throw new ConflictException(
        'IMMUTABILITY : cette répartition est déjà validée, aucune affectation ne peut être ajoutée',
      );
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

  // ============================================
  // Contrôles de cohérence des volumes (L2-09)
  // ============================================

  async getControles(
    repartitionId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ControlesResponseDto> {
    const repartition = await this.prisma.repartition.findUnique({
      where: { id: repartitionId },
      include: {
        departement: { select: { id: true } },
      },
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

    const affectations = await this.prisma.affectation.findMany({
      where: { repartitionId },
      include: {
        groupe: { select: { id: true, libelle: true } },
        module: { select: { id: true, libelle: true } },
        typeEnseignement: { select: { id: true, code: true } },
      },
    });

    // Index des ModuleVolume par (moduleId, type) pour le volume attendu
    const moduleIds = [...new Set(affectations.map((a) => a.moduleId))];
    const moduleVolumes = moduleIds.length > 0
      ? await this.prisma.moduleVolume.findMany({
          where: { moduleId: { in: moduleIds } },
        })
      : [];
    const mvIndex = new Map<string, number>();
    for (const mv of moduleVolumes) {
      mvIndex.set(`${mv.moduleId}:${mv.type}`, mv.volume);
    }

    // Regrouper les affectations par (groupeId, moduleId, typeEnseignementId)
    const groupes = new Map<string, {
      groupeId: string | null;
      groupeLibelle: string | null;
      moduleId: string;
      moduleLibelle: string;
      typeEnseignementId: string;
      typeCode: string;
      volumeAffecte: number;
    }>();

    for (const a of affectations) {
      const key = `${a.groupeId ?? 'null'}:${a.moduleId}:${a.typeEnseignementId}`;
      const existing = groupes.get(key);
      if (existing) {
        existing.volumeAffecte += a.volumeHebdoMinutes;
      } else {
        groupes.set(key, {
          groupeId: a.groupeId,
          groupeLibelle: a.groupe?.libelle ?? null,
          moduleId: a.module.id,
          moduleLibelle: a.module.libelle,
          typeEnseignementId: a.typeEnseignement.id,
          typeCode: a.typeEnseignement.code,
          volumeAffecte: a.volumeHebdoMinutes,
        });
      }
    }

    const controles: ControleVolumeDto[] = [];
    for (const g of groupes.values()) {
      const volumeAttendu = mvIndex.get(`${g.moduleId}:${g.typeCode}`) ?? 0;
      const ecart = volumeAttendu - g.volumeAffecte;
      let statut: ControleStatut;
      if (ecart < 0) {
        statut = ControleStatut.NON_COUVERT;
      } else if (ecart > 0) {
        statut = ControleStatut.EXCEDENT;
      } else {
        statut = ControleStatut.COUVERT;
      }
      controles.push({
        groupeId: g.groupeId,
        groupeLibelle: g.groupeLibelle,
        moduleId: g.moduleId,
        moduleLibelle: g.moduleLibelle,
        typeEnseignementId: g.typeEnseignementId,
        typeCode: g.typeCode,
        volumeAttendu,
        volumeAffecte: g.volumeAffecte,
        ecart,
        statut,
      });
    }

    // Tri déterministe pour un affichage stable
    controles.sort((a, b) => {
      const ga = a.groupeId ?? '';
      const gb = b.groupeId ?? '';
      if (ga !== gb) return ga.localeCompare(gb);
      if (a.moduleLibelle !== b.moduleLibelle) return a.moduleLibelle.localeCompare(b.moduleLibelle);
      return a.typeCode.localeCompare(b.typeCode);
    });

    return {
      repartitionId,
      controles,
    };
  }

  // ============================================
  // Validation de la répartition (L2-12)
  // ============================================

  async validateRepartition(
    id: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ValidateRepartitionDto> {
    // 1. Trouver la répartition
    const repartition = await this.prisma.repartition.findUnique({
      where: { id },
      include: { departement: { select: { id: true } } },
    });
    if (!repartition) {
      throw new NotFoundException(`Répartition ${id} introuvable`);
    }

    // 2. Vérifier la portée RBAC (département)
    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments &&
      !currentUser.departments.includes(repartition.departementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : cette répartition n\'appartient pas à votre département',
      );
    }

    // 3. Vérifier qu'elle n'est pas déjà validée
    if (repartition.statut === RepartitionStatut.VALIDEE) {
      throw new ConflictException(
        'Cette répartition est déjà validée',
      );
    }

    // 4. Contrôles de cohérence des volumes – refuser (422) s'il reste un écart
    const controles = await this.getControles(id, currentUser);
    const ecartsNonNuls = controles.controles.some((c) => c.ecart !== 0);
    if (ecartsNonNuls) {
      throw new UnprocessableEntityException({
        code: 'REPARTITION_INVALID',
        message: 'Des écarts de volume subsistent avant validation',
        details: controles.controles.filter((c) => c.ecart !== 0),
      });
    }

    // 5. Créer le snapshot dans une transaction
    const parAdministrateur = currentUser.role === 'ADMINISTRATEUR';
    const tag = `SNAP-${Date.now()}`;
    const hash = this.computeSnapshotHash(id, controles);

    await this.audit.auditTransaction<any>(
      async (tx) => {
        await tx.repartition.update({
          where: { id },
          data: { statut: RepartitionStatut.VALIDEE },
        });

        const snap = await tx.snapshot.create({
          data: {
            repartitionId: id,
            tag,
            hash,
            valideParId: currentUser.id,
            parAdministrateur,
            repartitionStatut: RepartitionStatut.VALIDEE,
          },
        });

        const affectations = await tx.affectation.findMany({
          where: { repartitionId: id },
        });
        for (const a of affectations) {
          await tx.snapshotAffectation.create({
            data: {
              snapshotId: snap.id,
              enseignantId: a.enseignantId,
              groupeId: a.groupeId,
              moduleId: a.moduleId,
              typeEnseignementId: a.typeEnseignementId,
              activityTagId: a.activityTagId,
              volumeHebdoMinutes: a.volumeHebdoMinutes,
              seancesParSemaine: a.seancesParSemaine,
              dureeMinutes: a.dureeMinutes,
              estCmCommun: a.estCmCommun,
              workingRevision: a.workingRevision,
            },
          });
        }

        const enseignantIds = [
          ...new Set(affectations.map((a) => a.enseignantId)),
        ];
        for (const enseignantId of enseignantIds) {
          const enseignantAffectations = affectations.filter(
            (a) => a.enseignantId === enseignantId,
          );
          const volumeBrut = enseignantAffectations.reduce(
            (sum, a) => sum + a.volumeHebdoMinutes,
            0,
          );
          await tx.snapshotCharge.create({
            data: {
              snapshotId: snap.id,
              enseignantId,
              volumeBrut,
              chargeCalculee: volumeBrut,
              chargeReference: 0,
              decharges: 0,
              serviceDu: 0,
              ecart: volumeBrut,
              heuresSup: 0,
            },
          });
        }
      },
      {
        userId: currentUser.id,
        action: 'VALIDATE',
        objetType: 'Repartition',
        objetId: id,
        nouvelleValeur: {
          statut: RepartitionStatut.VALIDEE,
          snapshotId: tag,
          parAdministrateur,
        },
        motif: `Validation répartition ${id}`,
      },
    );

    const snapshot = await this.prisma.snapshot.findFirst({
      where: { tag },
    });
    if (!snapshot) {
      throw new NotFoundException(
        `Snapshot ${tag} introuvable après création`,
      );
    }

    const [affectations, charges] = await Promise.all([
      this.prisma.snapshotAffectation.findMany({
        where: { snapshotId: snapshot.id },
      }),
      this.prisma.snapshotCharge.findMany({
        where: { snapshotId: snapshot.id },
      }),
    ]);

    return this.toValidateRepartitionDto(snapshot, repartition, id, affectations, charges);
  }
  private computeSnapshotHash(
    repartitionId: string,
    controles: ControlesResponseDto,
  ): string {
    const payload = JSON.stringify({
      repartitionId,
      controles: controles.controles.map((c) => ({
        groupeId: c.groupeId,
        moduleId: c.moduleId,
        typeEnseignementId: c.typeEnseignementId,
        volumeAttendu: c.volumeAttendu,
        volumeAffecte: c.volumeAffecte,
        ecart: c.ecart,
      })),
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private toValidateRepartitionDto(
    snapshot: any,
    repartition: any,
    repartitionId: string,
    affectations: any[] = [],
    charges: any[] = [],
  ): ValidateRepartitionDto {
    return {
      snapshotId: snapshot.id,
      repartitionId,
      tag: snapshot.tag,
      hash: snapshot.hash,
      statut: RepartitionStatut.VALIDEE,
      valideParId: snapshot.valideParId,
      valideLe: snapshot.valideLe,
      parAdministrateur: snapshot.parAdministrateur,
      affectations: affectations.map((a) => ({
        enseignantId: a.enseignantId,
        groupeId: a.groupeId,
        moduleId: a.moduleId,
        typeEnseignementId: a.typeEnseignementId,
        activityTagId: a.activityTagId,
        volumeHebdoMinutes: a.volumeHebdoMinutes,
        seancesParSemaine: a.seancesParSemaine,
        dureeMinutes: a.dureeMinutes,
        estCmCommun: a.estCmCommun,
        workingRevision: a.workingRevision,
      })),
      charges: charges.map((c) => ({
        enseignantId: c.enseignantId,
        volumeBrut: c.volumeBrut,
        chargeCalculee: c.chargeCalculee,
        chargeReference: c.chargeReference,
        decharges: c.decharges,
        serviceDu: c.serviceDu,
        ecart: c.ecart,
        heuresSup: c.heuresSup,
      })),
    };
  }
}

