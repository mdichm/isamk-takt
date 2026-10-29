import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreneauService } from '../creneaux/creneau.service.js';
import { AnneeImmutabilityService } from './annee-immutability.service.js';
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
  TransitionResponseDto,
} from './dto/annee.dto.js';
import {
  GenerateCreneauxDto,
  GenerateCreneauxResponseDto,
} from './dto/generate-creneaux.dto.js';
import {
  ImportAnneeDto,
  ImportPreviewDto,
  ImportResultDto,
  ImportPreviewItem,
  ImportConflict,
  ImportResume,
  ImportType,
  ALL_IMPORT_TYPES,
  IMPORT_ORDER,
} from './dto/import.dto.js';
// eslint-disable-next-line no-restricted-imports
import { JourSemaine } from '@takt/db';
// eslint-disable-next-line no-restricted-imports
import { Prisma } from '@takt/db';

const SLOT_MINUTES = 30;

@Injectable()
export class AnneesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private creneauService: CreneauService,
    private anneeImmutability: AnneeImmutabilityService,
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
  ): Promise<AnneeResponseDto | TransitionResponseDto> {
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
    if (!dto.confirmation || dto.confirmation !== existing.code) {
      throw new BadRequestException(
        `La confirmation doit être égale au code de l'année ("${existing.code}").`,
      );
    }
    if (existing.statut === 'CLOTUREE') {
      throw new ConflictException(`L'année "${existing.code}" est déjà clôturée`);
    }
    if (existing.statut === 'PREPARATION') {
      throw new ConflictException(`Impossible de clôturer une année en préparation. Activez-la d'abord.`);
    }

    // Vérifier qu'aucune version n'est EN_VALIDATION
    const versionsEnValidation = await this.prisma.versionEdt.findMany({
      where: {
        semestre: { anneeId: id },
        statut: 'EN_VALIDATION',
      },
      select: { id: true },
    });
    if (versionsEnValidation.length > 0) {
      throw new BadRequestException(
        `Clôture refusée : ${versionsEnValidation.length} version(s) en statut EN_VALIDATION.`,
      );
    }

    const now = new Date();

    const result = await this.audit.auditTransaction<{ id: string; code: string; versionsArchivees: number }>(
      async (tx) => {
        // Archiver les versions non publiées (statut != PUBLIE) avec le motif « clôture »
        const archivedVersions = await tx.versionEdt.updateMany({
          where: {
            semestre: { anneeId: id },
            statut: { not: 'PUBLIE' },
          },
          data: {
            statut: 'ARCHIVE',
            motif: 'clôture',
            publieLe: now,
          },
        });

        const annee = await tx.annee.update({
          where: { id },
          data: {
            statut: 'CLOTUREE',
            closedAt: now,
            closedBy: userId,
          },
        });

        return { id: annee.id, code: annee.code, versionsArchivees: archivedVersions.count };
      },
      {
        userId,
        action: 'STATUS_CHANGED',
        objetType: 'Annee',
        objetId: id,
        ancienneValeur: { statut: existing.statut, code: existing.code },
        nouvelleValeur: { statut: 'CLOTUREE', code: existing.code, closedAt: now, closedBy: userId },
        motif: `Clôture année ${existing.code}`,
      },
    );

    return {
      anneeId: result.id,
      de: 'ACTIVE',
      vers: 'CLOTUREE',
      versionsArchivees: result.versionsArchivees,
    };
  }

  // ============================================
  // Semestres
  // ============================================

  async createSemestre(dto: CreateSemestreDto, userId: string): Promise<SemestreResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id: dto.anneeId } });
    if (!annee) {
      throw new NotFoundException('Année parente non trouvée');
    }

    await this.anneeImmutability.verifyAnneeWritable(dto.anneeId);

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

    await this.anneeImmutability.verifyAnneeWritable(existing.anneeId);

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

    await this.anneeImmutability.verifyAnneeWritable(existing.anneeId);

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

  // ============================================
  // Génération de grille horaire (L1-18)
  // ============================================

  async generateCreneaux(
    semestreId: string,
    dto: GenerateCreneauxDto,
    userId: string,
  ): Promise<GenerateCreneauxResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const joursOrdres: { jour: JourSemaine; ordre: number; heureDebut: string; heureFin: string; estPause: boolean }[] = [];
    const parJour: { jour: JourSemaine; count: number }[] = [];

    for (const j of dto.jours) {
      const debut = new Date(`1970-01-01T${j.heureDebut}Z`);
      const fin = new Date(`1970-01-01T${j.heureFin}Z`);
      const diffMinutes = (fin.getTime() - debut.getTime()) / (1000 * 60);
      if (diffMinutes <= 0 || diffMinutes % SLOT_MINUTES !== 0) {
        throw new BadRequestException(
          `La plage horaire du jour ${j.jour} doit être un multiple positif de ${SLOT_MINUTES} minutes`,
        );
      }

      let pauseCursor = debut.getTime();
      if (j.pauses) {
        for (const p of j.pauses) {
          const pDebut = new Date(`1970-01-01T${p.debut}Z`);
          const pFin = new Date(`1970-01-01T${p.fin}Z`);
          const pDiff = (pFin.getTime() - pDebut.getTime()) / (1000 * 60);
          if (pDiff <= 0 || pDiff % SLOT_MINUTES !== 0) {
            throw new BadRequestException(
              `La pause du jour ${j.jour} de ${p.debut} à ${p.fin} doit être un multiple positif de ${SLOT_MINUTES} minutes`,
            );
          }
          if (pDebut.getTime() <= debut.getTime() || pFin.getTime() >= fin.getTime()) {
            throw new BadRequestException(
              `La pause du jour ${j.jour} doit être comprise strictement entre ${j.heureDebut} et ${j.heureFin}`,
            );
          }
          if (pDebut.getTime() < pauseCursor) {
            throw new BadRequestException(
              `Les pauses du jour ${j.jour} se chevauchent ou ne sont pas ordonnées`,
            );
          }
          pauseCursor = pFin.getTime();
        }
      }

      let cursor = debut.getTime();
      let ordre = 1;
      let jourCount = 0;
      while (cursor < fin.getTime()) {
        const slotFin = cursor + SLOT_MINUTES * 60 * 1000;
        let estPause = false;
        if (j.pauses) {
          for (const p of j.pauses) {
            const pDebut = new Date(`1970-01-01T${p.debut}Z`);
            const pFin = new Date(`1970-01-01T${p.fin}Z`);
            if (cursor >= pDebut.getTime() && cursor < pFin.getTime()) {
              estPause = true;
              break;
            }
          }
        }
        joursOrdres.push({
          jour: j.jour,
          ordre,
          heureDebut: new Date(cursor).toISOString().slice(11, 19),
          heureFin: new Date(slotFin).toISOString().slice(11, 19),
          estPause,
        });
        jourCount++;
        ordre++;
        cursor = slotFin;
      }
      parJour.push({ jour: j.jour, count: jourCount });
    }

    if (dto.dryRun === true) {
      return {
        semestreId,
        creneaux: joursOrdres.map((j) => ({
          jour: j.jour,
          ordre: j.ordre,
          heureDebut: j.heureDebut,
          heureFin: j.heureFin,
          estPause: j.estPause,
        })),
        total: joursOrdres.length,
        parJour,
      };
    }

    const grilleParams = {
      jours: dto.jours.map((j) => ({
        jour: j.jour,
        debut: j.heureDebut,
        fin: j.heureFin,
        pauses: j.pauses?.map((p) => ({ debut: p.debut, fin: p.fin })) ?? [],
      })),
    };

    // Contrôle 409 SLOT_IN_USE (inactif jusqu'à L3-10 : modèle Seance absent)
    // TODO L3-10 : une fois le modèle Seance implémenté, vérifier qu'aucune séance
    // ne référence un créneau du semestre qui serait supprimé/modifié.

    const result = await this.audit.auditTransaction(
      async (tx) => {
        await tx.creneau.deleteMany({ where: { semestreId } });

        const created: Array<{
          id: string;
          semestreId: string;
          jour: string;
          ordre: number;
          heureDebut: Date;
          heureFin: Date;
          estPause: boolean;
          estActive: boolean;
          createdAt: Date;
          updatedAt: Date;
        }> = [];

        for (const j of joursOrdres) {
          const c = await tx.creneau.create({
            data: {
              semestreId,
              jour: j.jour,
              ordre: j.ordre,
              heureDebut: new Date(`1970-01-01T${j.heureDebut}Z`),
              heureFin: new Date(`1970-01-01T${j.heureFin}Z`),
              estPause: j.estPause,
              estActive: true,
            },
          });
          created.push({
            id: c.id,
            semestreId: c.semestreId,
            jour: c.jour,
            ordre: c.ordre,
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            estPause: c.estPause,
            estActive: c.estActive,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        }

        await tx.semestre.update({
          where: { id: semestreId },
          data: { grilleParams: grilleParams as unknown as Prisma.InputJsonValue },
        });

        return created;
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Semestre',
        objetId: semestreId,
        motif: `Génération de la grille horaire du semestre ${semestreId} (${joursOrdres.length} créneaux)`,
      },
    );

    return {
      semestreId,
      creneaux: result.map((c) => ({
        jour: c.jour as JourSemaine,
        ordre: c.ordre,
        heureDebut: c.heureDebut.toISOString().slice(11, 19),
        heureFin: c.heureFin.toISOString().slice(11, 19),
        estPause: c.estPause,
      })),
      total: result.length,
      parJour,
    };
  }

// ============================================
// Import depuis une année clôturée (L1-24)
// ============================================

  async importAnnee(
    sourceAnneeId: string,
    dto: ImportAnneeDto,
    userId: string,
  ): Promise<ImportPreviewDto | ImportResultDto> {
    const sourceAnnee = await this.prisma.annee.findUnique({ where: { id: sourceAnneeId } });
    if (!sourceAnnee) {
      throw new NotFoundException(`Année source "${sourceAnneeId}" introuvable`);
    }
    if (sourceAnnee.statut !== 'CLOTUREE') {
      throw new BadRequestException(
        `L'année source "${sourceAnnee.code}" n'est pas clôturée (statut: ${sourceAnnee.statut})`,
      );
    }

    const cibleAnnee = await this.prisma.annee.findUnique({ where: { id: dto.cibleAnneeId } });
    if (!cibleAnnee) {
      throw new NotFoundException(`Année cible "${dto.cibleAnneeId}" introuvable`);
    }

    const importId = dto.importId ?? `import_${Date.now()}`;

    if (dto.dryRun === true) {
      return this.buildImportPreview(
        sourceAnneeId, dto.cibleAnneeId, dto.types, importId, sourceAnnee.code, cibleAnnee.code,
      );
    }

    if (dto.confirmation !== true) {
      throw new BadRequestException(
        'La confirmation est requise pour appliquer l\'import (définir confirmation=true)',
      );
    }

    return this.audit.auditTransaction<ImportResultDto>(
      async (tx) => {
        const idMaps = new Map<ImportType, Map<string, string>>();
        const crees: Record<string, string[]> = {};
        const ignores: Record<string, string[]> = {};
        const avertissements: string[] = [];
        const conflits: ImportConflict[] = [];

        for (const type of dto.types) {
          idMaps.set(type, new Map());
          crees[type] = [];
          ignores[type] = [];
        }

        for (const type of IMPORT_ORDER) {
          if (!dto.types.includes(type)) continue;
          switch (type) {
            case ImportType.DEPARTEMENTS: {
              const r = await this.importDepartements(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.FORMATIONS: {
              const r = await this.importFormations(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.NIVEAUX: {
              const r = await this.importNiveaux(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.GROUPES: {
              const r = await this.importGroupes(tx, sourceAnneeId, dto.cibleAnneeId, idMaps, dto.reinitialiserEffectifs ?? false);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.MODULES: {
              const r = await this.importModules(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.SALLES: {
              const r = await this.importSalles(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.ENSEIGNANTS: {
              const r = await this.importEnseignants(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.CRENEAUX: {
              const r = await this.importCreneaux(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
            case ImportType.GRILLE_RAMADAN: {
              const r = await this.importGrilleRamadan(tx, sourceAnneeId, dto.cibleAnneeId, idMaps);
              crees[type] = r.crees; ignores[type] = r.ignores;
              avertissements.push(...r.avertissements); conflits.push(...r.conflits);
              break;
            }
          }
        }

        if (conflits.length > 0) {
          throw new ConflictException({ detail: 'Conflits détectés lors de l\'import', code: 'IMPORT_CONFLICT', conflits });
        }

        return { importId, crees, ignores, avertissements };
      },
      { userId, action: 'IMPORT', objetType: 'Annee', objetId: sourceAnneeId, motif: `Import depuis ${sourceAnnee.code} vers ${cibleAnnee.code} (types: ${dto.types.join(', ')})` },
    );
  }

  // ============================================
  // Aperçu (dryRun) — lecture seule, aucune écriture
  // ============================================

  private async buildImportPreview(
    sourceAnneeId: string,
    cibleAnneeId: string,
    types: ImportType[],
    importId: string,
    sourceAnneeCode: string,
    cibleAnneeCode: string,
  ): Promise<ImportPreviewDto> {
    const items: ImportPreviewItem[] = [];
    const conflits: ImportConflict[] = [];
    const avertissements: string[] = [];
    const resume: ImportResume = { ajout: 0, modification: 0, doublon: 0, conflit: 0, erreur: 0 };
    const idMaps = new Map<ImportType, Map<string, string>>();
    for (const type of types) idMaps.set(type, new Map());

    for (const type of IMPORT_ORDER) {
      if (!types.includes(type)) continue;
      switch (type) {
        case ImportType.DEPARTEMENTS: {
          const source = await this.prisma.departement.findMany({ where: { anneeId: sourceAnneeId } });
          for (const s of source) {
            const cible = await this.prisma.departement.findFirst({ where: { anneeId: cibleAnneeId, code: s.code } });
            if (cible) {
              if (cible.originId === s.id) {
                items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'doublon', message: `Département "${s.code}" déjà importé (idempotent)` });
                idMaps.get(type)?.set(s.id, cible.id); resume.doublon++;
              } else {
                items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'conflit', message: `Département "${s.code}" existe déjà dans l'année cible (autre origine)`, targetId: cible.id });
                conflits.push({ type, code: s.code, sourceId: s.id, targetId: cible.id }); resume.conflit++;
              }
            } else {
              items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'ajout', message: `Département "${s.code}" sera créé` }); resume.ajout++;
            }
          }
          break;
        }
        case ImportType.NIVEAUX: {
          const source = await this.prisma.niveau.findMany({ where: { formation: { departement: { anneeId: sourceAnneeId } } }, include: { formation: { include: { departement: true } } } });
          for (const s of source) {
            const cibleFormationId = idMaps.get(ImportType.FORMATIONS)?.get(s.formationId);
            if (!cibleFormationId) { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'erreur', message: `Formation parent "${s.formation.code}" non importée` }); resume.erreur++; continue; }
            const cible = await this.prisma.niveau.findFirst({ where: { formationId: cibleFormationId, code: s.code } });
            if (cible) {
              if (cible.originId === s.id) { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'doublon', message: `Niveau "${s.code}" déjà importé (idempotent)`, targetId: cible.id }); idMaps.get(type)?.set(s.id, cible.id); resume.doublon++; }
              else { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'conflit', message: `Niveau "${s.code}" existe déjà dans la formation cible`, targetId: cible.id }); conflits.push({ type, code: s.code, sourceId: s.id, targetId: cible.id }); resume.conflit++; }
            } else { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'ajout', message: `Niveau "${s.code}" sera créé` }); resume.ajout++; }
          }
          break;
        }
        case ImportType.SALLES: {
          const source = await this.prisma.salle.findMany({ where: { departement: { anneeId: sourceAnneeId } }, include: { departement: true } });
          for (const s of source) {
            const cibleDepartementId = s.departementId ? idMaps.get(ImportType.DEPARTEMENTS)?.get(s.departementId) : null;
            if (s.departementId && !cibleDepartementId) { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'erreur', message: 'Département parent ' + (s.departement?.code ?? 'inconnu') + ' non importé' }); resume.erreur++; continue; }
            const cible = await this.prisma.salle.findFirst({ where: { departementId: cibleDepartementId, code: s.code } });
            if (cible) {
              if (cible.originId === s.id) { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'doublon', message: "Salle " + s.code + " déjà importée (idempotent)", targetId: cible.id }); idMaps.get(type)?.set(s.id, cible.id); resume.doublon++; }
              else { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'conflit', message: "Salle " + s.code + " existe déjà dans le département cible", targetId: cible.id }); conflits.push({ type, code: s.code, sourceId: s.id, targetId: cible.id }); resume.conflit++; }
            } else { items.push({ type, sourceId: s.id, sourceCode: s.code, action: 'ajout', message: "Salle " + s.code + " sera créée" }); resume.ajout++; }
          }
          break;
        }
        case ImportType.ENSEIGNANTS: {
          const source = await this.prisma.enseignant.findMany({ where: { anneeId: sourceAnneeId }, include: { departement: true } });
          for (const s of source) {
            const cibleDepartementId = idMaps.get(ImportType.DEPARTEMENTS)?.get(s.departementId);
            if (!cibleDepartementId) { items.push({ type, sourceId: s.id, sourceCode: s.matricule, action: 'erreur', message: 'Département ' + s.departement.code + ' non importé' }); resume.erreur++; continue; }
            const cible = await this.prisma.enseignant.findFirst({ where: { anneeId: cibleAnneeId, matricule: s.matricule } });
            if (cible) {
              items.push({ type, sourceId: s.id, sourceCode: s.matricule, action: 'doublon', message: "Enseignant " + s.matricule + " déjà importé (idempotent)", targetId: cible.id }); idMaps.get(type)?.set(s.id, cible.id); resume.doublon++;
            } else { items.push({ type, sourceId: s.id, sourceCode: s.matricule, action: 'ajout', message: "Enseignant " + s.matricule + " sera créé" }); resume.ajout++; }
          }
          break;
        }
        case ImportType.CRENEAUX: {
          const source = await this.prisma.creneau.findMany({ where: { semestre: { anneeId: sourceAnneeId } }, include: { semestre: true }, orderBy: [{ jour: 'asc' }, { ordre: 'asc' }] });
          for (const s of source) {
            const cibleSemestre = await this.prisma.semestre.findFirst({ where: { anneeId: cibleAnneeId, numero: s.semestre.numero } });
            if (!cibleSemestre) { items.push({ type, sourceId: s.id, sourceCode: s.jour + ' ' + s.ordre, action: 'erreur', message: 'Semestre ' + s.semestre.numero + ' non trouvé dans l\'année cible' }); resume.erreur++; continue; }
            const cible = await this.prisma.creneau.findFirst({ where: { semestreId: cibleSemestre.id, jour: s.jour, ordre: s.ordre } });
            if (cible) {
              items.push({ type, sourceId: s.id, sourceCode: s.jour + ' ' + s.ordre, action: 'doublon', message: "Créneau " + s.jour + " ordre " + s.ordre + " déjà importé (idempotent)", targetId: cible.id }); idMaps.get(type)?.set(s.id, cible.id); resume.doublon++;
            } else { items.push({ type, sourceId: s.id, sourceCode: s.jour + ' ' + s.ordre, action: 'ajout', message: "Créneau " + s.jour + " ordre " + s.ordre + " sera créé" }); resume.ajout++; }
          }
          break;
        }
        case ImportType.GRILLE_RAMADAN: {
          const sourceAffichages = await this.prisma.creneauAffichage.findMany({ where: { creneau: { semestre: { anneeId: sourceAnneeId } } }, include: { creneau: true } });
          for (const a of sourceAffichages) {
            const cibleCreneauId = idMaps.get(ImportType.CRENEAUX)?.get(a.creneauId);
            if (!cibleCreneauId) { items.push({ type, sourceId: a.creneauId, sourceCode: a.creneau.jour + ' ' + a.creneau.ordre, action: 'erreur', message: 'Créneau ' + a.creneau.jour + ' ordre ' + a.creneau.ordre + ' non importé' }); resume.erreur++; continue; }
            const cible = await this.prisma.creneauAffichage.findFirst({ where: { creneauId: cibleCreneauId, grille: a.grille } });
            if (cible) {
              items.push({ type, sourceId: a.id, sourceCode: a.creneau.jour + ' ' + a.creneau.ordre, action: 'doublon', message: "Affichage " + a.grille + " pour " + a.creneau.jour + " " + a.creneau.ordre + " déjà importé (idempotent)", targetId: cible.id }); idMaps.get(type)?.set(a.id, cible.id); resume.doublon++;
            } else { items.push({ type, sourceId: a.id, sourceCode: a.creneau.jour + ' ' + a.creneau.ordre, action: 'ajout', message: "Affichage Ramadan " + a.grille + " pour " + a.creneau.jour + " " + a.creneau.ordre + " sera créé" }); resume.ajout++; }
          }
          break;
        }
      }
    }

    return { importId, sourceAnneeCode, cibleAnneeCode, items, conflits, avertissements, resume };
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

  // ============================================
  // Helpers privés d'application (écriture transactionnelle)
  // ============================================

  private async importDepartements(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.departement.findMany({ where: { anneeId: sourceAnneeId } });
    for (const s of source) {
      const cible = await tx.departement.findFirst({ where: { anneeId: cibleAnneeId, code: s.code } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.DEPARTEMENTS)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.DEPARTEMENTS, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const created = await tx.departement.create({ data: { anneeId: cibleAnneeId, code: s.code, libelle: s.libelle, ordre: s.ordre, originId: s.id } });
        idMaps.get(ImportType.DEPARTEMENTS)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importFormations(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.formation.findMany({ where: { departement: { anneeId: sourceAnneeId } }, include: { departement: true } });
    for (const s of source) {
      const cibleDepartementId = idMaps.get(ImportType.DEPARTEMENTS)?.get(s.departementId);
      if (!cibleDepartementId) continue;
      const cible = await tx.formation.findFirst({ where: { departementId: cibleDepartementId, code: s.code } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.FORMATIONS)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.FORMATIONS, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const created = await tx.formation.create({ data: { departementId: cibleDepartementId, code: s.code, libelle: s.libelle, ordre: s.ordre, originId: s.id } });
        idMaps.get(ImportType.FORMATIONS)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importNiveaux(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.niveau.findMany({ where: { formation: { departement: { anneeId: sourceAnneeId } } }, include: { formation: true } });
    for (const s of source) {
      const cibleFormationId = idMaps.get(ImportType.FORMATIONS)?.get(s.formationId);
      if (!cibleFormationId) continue;
      const cible = await tx.niveau.findFirst({ where: { formationId: cibleFormationId, code: s.code } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.NIVEAUX)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.NIVEAUX, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const created = await tx.niveau.create({ data: { formationId: cibleFormationId, code: s.code, libelle: s.libelle, ordre: s.ordre, originId: s.id } });
        idMaps.get(ImportType.NIVEAUX)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importGroupes(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>, reinitialiserEffectifs: boolean,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.groupe.findMany({ where: { niveau: { formation: { departement: { anneeId: sourceAnneeId } } } }, include: { niveau: true, parent: true } });
    const sorted = [...source].sort((a: any, b: any) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));
    for (const s of sorted) {
      const cibleNiveauId = idMaps.get(ImportType.NIVEAUX)?.get(s.niveauId);
      if (!cibleNiveauId) continue;
      const cibleParentId = s.parentId ? idMaps.get(ImportType.GROUPES)?.get(s.parentId) ?? null : null;
      if (s.parentId && !cibleParentId) continue;
      const cible = await tx.groupe.findFirst({ where: { niveauId: cibleNiveauId, semestre: { anneeId: cibleAnneeId }, code: s.code } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.GROUPES)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.GROUPES, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const data: any = { niveauId: cibleNiveauId, code: s.code, libelle: s.libelle, type: s.type, ordre: s.ordre, originId: s.id };
        if (cibleParentId) data.parentId = cibleParentId;
        if (reinitialiserEffectifs) data.effectif = 0; else data.effectif = s.effectif;
        const created = await tx.groupe.create({ data });
        idMaps.get(ImportType.GROUPES)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    if (reinitialiserEffectifs) avertissements.push('Effectifs des groupes importés réinitialisés à 0');
    return { crees, ignores, avertissements, conflits };
  }

  private async importModules(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.module.findMany({ where: { niveau: { formation: { departement: { anneeId: sourceAnneeId } } } }, include: { niveau: true } });
    for (const s of source) {
      const cibleNiveauId = idMaps.get(ImportType.NIVEAUX)?.get(s.niveauId);
      if (!cibleNiveauId) continue;
      const cible = await tx.module.findFirst({ where: { niveauId: cibleNiveauId, code: s.code, semestreNumero: s.semestreNumero } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.MODULES)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.MODULES, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const created = await tx.module.create({ data: { niveauId: cibleNiveauId, typeId: s.typeId, gradeId: s.gradeId, code: s.code, libelle: s.libelle, semestreNumero: s.semestreNumero, credits: s.credits, effectifMax: s.effectifMax, originId: s.id } });
        idMaps.get(ImportType.MODULES)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importSalles(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.salle.findMany({ where: { departement: { anneeId: sourceAnneeId } }, include: { departement: true } });
    for (const s of source) {
      const cibleDepartementId = s.departementId ? idMaps.get(ImportType.DEPARTEMENTS)?.get(s.departementId) : null;
      if (s.departementId && !cibleDepartementId) continue;
      const cible = await tx.salle.findFirst({ where: { departementId: cibleDepartementId, code: s.code } });
      if (cible) {
        if (cible.originId === s.id) { idMaps.get(ImportType.SALLES)?.set(s.id, cible.id); ignores.push(s.id); }
        else { conflits.push({ type: ImportType.SALLES, code: s.code, sourceId: s.id, targetId: cible.id }); }
      } else {
        const created = await tx.salle.create({ data: { code: s.code, libelle: s.libelle, siteId: s.siteId, capaciteMax: s.capaciteMax, capaciteRecommandee: s.capaciteRecommandee, accesPMR: s.accesPMR, commentaire: s.commentaire, estActive: s.estActive, departementId: cibleDepartementId, typeSalleId: s.typeSalleId, originId: s.id } });
        idMaps.get(ImportType.SALLES)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importEnseignants(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.enseignant.findMany({ where: { anneeId: sourceAnneeId }, include: { departement: true } });
    for (const s of source) {
      const cibleDepartementId = idMaps.get(ImportType.DEPARTEMENTS)?.get(s.departementId);
      if (!cibleDepartementId) continue;
      const cible = await tx.enseignant.findFirst({ where: { anneeId: cibleAnneeId, matricule: s.matricule } });
      if (cible) {
        idMaps.get(ImportType.ENSEIGNANTS)?.set(s.id, cible.id); ignores.push(s.id);
      } else {
        const created = await tx.enseignant.create({ data: { anneeId: cibleAnneeId, departementId: cibleDepartementId, matricule: s.matricule, nom: s.nom, prenom: s.prenom, email: s.email, telephone: s.telephone, isActive: s.isActive, gradeId: s.gradeId, originId: s.id } });
        idMaps.get(ImportType.ENSEIGNANTS)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importCreneaux(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const source = await tx.creneau.findMany({ where: { semestre: { anneeId: sourceAnneeId } }, include: { semestre: true }, orderBy: [{ jour: 'asc' }, { ordre: 'asc' }] });
    for (const s of source) {
      const cibleSemestre = await tx.semestre.findFirst({ where: { anneeId: cibleAnneeId, numero: s.semestre.numero } });
      if (!cibleSemestre) continue;
      const cible = await tx.creneau.findFirst({ where: { semestreId: cibleSemestre.id, jour: s.jour, ordre: s.ordre } });
      if (cible) {
        idMaps.get(ImportType.CRENEAUX)?.set(s.id, cible.id); ignores.push(s.id);
      } else {
        const created = await tx.creneau.create({ data: { semestreId: cibleSemestre.id, jour: s.jour, ordre: s.ordre, heureDebut: s.heureDebut, heureFin: s.heureFin, estPause: s.estPause, estActive: s.estActive, originId: s.id } });
        idMaps.get(ImportType.CRENEAUX)?.set(s.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }

  private async importGrilleRamadan(
    tx: any, sourceAnneeId: string, cibleAnneeId: string,
    idMaps: Map<ImportType, Map<string, string>>,
  ): Promise<{ crees: string[]; ignores: string[]; avertissements: string[]; conflits: ImportConflict[] }> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];
    const sourceAffichages = await tx.creneauAffichage.findMany({ where: { creneau: { semestre: { anneeId: sourceAnneeId } } }, include: { creneau: true } });
    for (const a of sourceAffichages) {
      const cibleCreneauId = idMaps.get(ImportType.CRENEAUX)?.get(a.creneauId);
      if (!cibleCreneauId) continue;
      const cible = await tx.creneauAffichage.findFirst({ where: { creneauId: cibleCreneauId, grille: a.grille } });
      if (cible) {
        idMaps.get(ImportType.GRILLE_RAMADAN)?.set(a.id, cible.id); ignores.push(a.id);
      } else {
        const created = await tx.creneauAffichage.create({ data: { creneauId: cibleCreneauId, grille: a.grille, heureDebut: a.heureDebut, heureFin: a.heureFin, originId: a.id } });
        idMaps.get(ImportType.GRILLE_RAMADAN)?.set(a.id, created.id); crees.push(created.id);
      }
    }
    return { crees, ignores, avertissements, conflits };
  }
}
