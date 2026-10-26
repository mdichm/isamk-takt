// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de création de version (L3-09)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import type {
  VersionStatut,
  GenerationStatut,
  GenerationMode,
  SeanceStatut,
  SeanceOrigine,
  VerrouType,
  RessourceType,
  JourSemaine,
  Creneau,
  Seance,
  ImpactDepartementStatut,
  ConflitSeverite,
} from '@takt/db';
import type { PgBoss as PgBossType } from 'pg-boss';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import type { VersionResponseDto } from './dto/version-response.dto.js';
import type { CompletudeResponseDto } from './dto/completude-response.dto.js';
import type { PerimetreResponseDto } from './dto/perimetre-response.dto.js';
import type { ConflitResponseDto } from '../conflit/dto/conflit-response.dto.js';
import type { CreateGenerationDto } from './dto/create-generation.dto.js';
import type { GenerationResponseDto } from './dto/generation-response.dto.js';
import type { TransitionDto } from './dto/transition.dto.js';
import type { TransitionResponseDto } from './dto/transition-response.dto.js';
import type { TransitionType } from '@takt/contracts';
import { Prisma as PrismaValue } from '@takt/db';
import { mkdtemp, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AdoptResponseDto } from './dto/adopt-response.dto.js';
import type { GenerationListResponseDto } from './dto/generation-list-response.dto.js';
import type { ImportGenerationResponseDto } from './dto/import-generation-response.dto.js';
import type { HistoryResponseDto } from './dto/history-response.dto.js';
import type { ImpactResponseDto } from './dto/impact-response.dto.js';
import type { ImpactDepartementDto } from './dto/impact-departement.dto.js';
import type { ValidationDepartementDto } from './dto/validation-departement.dto.js';
import type { ValidationResponseDto } from './dto/validation-response.dto.js';
import type { PublishResponseDto } from './dto/publish-response.dto.js';
import type { PrevisualisationPublicationDto } from './dto/previsualisation-publication.dto.js';
import type { NewRevisionResponseDto } from './dto/new-revision-response.dto.js';
import type { VersionDiffResponseDto } from './dto/diff-response.dto.js';
import type { ChangementSeanceDto } from './dto/diff-response.dto.js';
import type { VersionProvenanceResponseDto } from './dto/provenance-response.dto.js';
import type { ChargeRuleSetProvenanceDto } from './dto/provenance-response.dto.js';
import { PolicyService } from '../policy/policy.service.js';

// ============================================
// Création de version (L3-09)
// POST /versions : sélection des derniers snapshots validés par département,
// création des séances à partir des affectations figées.
// ============================================

@Injectable()
export class VersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preparationService: PreparationService,
    private readonly conflitService: ConflitService,
    private readonly policyService: PolicyService,
    @Inject('BOSS') private readonly boss: PgBossType,
  ) {}

  /** Liste toutes les versions (lecture, permission version:read). */
  async findAll(): Promise<VersionResponseDto[]> {
    const versions = await this.prisma.versionEdt.findMany({
      select: {
        id: true,
        semestreId: true,
        numero: true,
        statut: true,
        motif: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return versions.map((v) => ({
      id: v.id,
      semestreId: v.semestreId,
      numero: v.numero,
      statut: v.statut,
      motif: v.motif ?? undefined,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  /** Détail d'une version par ID (lecture, permission version:read). */
  async findOne(id: string): Promise<VersionResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id },
      select: {
        id: true,
        semestreId: true,
        numero: true,
        statut: true,
        motif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${id}" introuvable`);
    }

    // L3-24 : dernier auteur et dernière modification de la version depuis l'audit.
    const dernierAudit = await this.prisma.auditLog.findFirst({
      where: { versionId: id },
      orderBy: { at: 'desc' },
      select: { userId: true, at: true },
    });

    return {
      id: version.id,
      semestreId: version.semestreId,
      numero: version.numero,
      statut: version.statut,
      motif: version.motif ?? undefined,
      dernierAuteurId: dernierAudit?.userId ?? undefined,
      derniereModificationAt: dernierAudit?.at ?? undefined,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  /** Couverture et complétude d'une version (L3-30). Retourne l'attendu, le placé et l'écart par affectation. */
  async getCompletude(versionId: string): Promise<CompletudeResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const seances = (await this.prisma.seance.findMany({
      where: { versionId },
      select: { affectationKey: true, statut: true },
    })) ?? [];

    const parAffectationMap = new Map<string, { attendu: number; place: number }>();
    for (const s of seances) {
      if (!parAffectationMap.has(s.affectationKey)) {
        parAffectationMap.set(s.affectationKey, { attendu: 0, place: 0 });
      }
      const entry = parAffectationMap.get(s.affectationKey)!;
      entry.attendu += 1;
      if (s.statut === 'PLACEE') {
        entry.place += 1;
      }
    }

    const parAffectation = Array.from(parAffectationMap.entries()).map(
      ([affectationKey, { attendu, place }]) => ({
        affectationKey,
        attendu,
        place,
        ecart: attendu - place,
      }),
    );

    const attenduTotal = parAffectation.reduce((sum, a) => sum + a.attendu, 0);
    const placeTotal = parAffectation.reduce((sum, a) => sum + a.place, 0);
    const ecartTotal = attenduTotal - placeTotal;
    const couvertureTotale = attenduTotal === 0 ? 100 : Math.round((placeTotal / attenduTotal) * 100);
    const couvertureExacte = ecartTotal === 0;

    return {
      attenduTotal,
      placeTotal,
      ecartTotal,
      couvertureTotale,
      couvertureExacte,
      parAffectation,
    };
  }

  // ============================================
  // Contrôle de soumission (L5-02)
  // Recontrôle les conflits et la couverture avant MARQUER_PRET, SOUMETTRE, RESOUMETTRE.
  // ============================================

  private async verifierSoumission(
    versionId: string,
  ): Promise<{
    estSubmittable: boolean;
    conflitsBloquants: ConflitResponseDto[];
    couvertureIncomplete: Array<{
      affectationKey: string;
      attenduMinutes: number;
      placeMinutes: number;
      ecart: number;
    }>;
    avertissementsNonAcceptes: number;
  }> {
    // 1. Recalcul des conflits (à jour avant la soumission)
    const conflits = (await this.conflitService.recomputeConflits(versionId)) ?? [];

    // Conflits bloquants non résolus -> bloquent la soumission
    const conflitsBloquants = conflits.filter(
      (c) => c.severite === 'BLOQUANT' && c.resoluLe === null,
    );

    // 2. Couverture : affectations avec un écart (attendu - placé > 0)
    const completude = (await this.getCompletude(versionId)) ?? { parAffectation: [] };
    const couvertureIncomplete = completude.parAffectation
      .filter((a) => a.ecart > 0)
      .map((a) => ({
        affectationKey: a.affectationKey,
        attenduMinutes: a.attendu,
        placeMinutes: a.place,
        ecart: a.ecart,
      }));

    // 3. Avertissements non acceptés : conflits AVERTISSEMENT non résolus
    //    sans acceptation valide (AvertissementAccepte avec caduqueLe = null)
    const avertissements = conflits.filter(
      (c) => c.severite === 'AVERTISSEMENT' && c.resoluLe === null,
    );
    const accepte = (await this.prisma.avertissementAccepte.findMany({
      where: { versionId, caduqueLe: null },
      select: { signature: true },
    })) ?? [];
    const accepteSignatures = new Set(accepte.map((a) => a.signature));
    const avertissementsNonAcceptes = avertissements.filter(
      (c) => !accepteSignatures.has(c.signature),
    ).length;

    const estSubmittable =
      conflitsBloquants.length === 0 && couvertureIncomplete.length === 0;

    return { estSubmittable, conflitsBloquants, couvertureIncomplete, avertissementsNonAcceptes };
  }

  async createVersion(
    dto: CreateVersionDto,
    _userId: string,
  ): Promise<VersionResponseDto> {
    // 1. Vérifier l'existence du semestre
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    // 2. Récupérer les départements du semestre
    const departements = await this.prisma.departement.findMany({
      where: { anneeId: semestre.anneeId },
      select: { id: true, code: true },
    });

    // 3. Pour chaque département, trouver le dernier snapshot VALIDEE
    const snapshotsParDepartement = await Promise.all(
      departements.map(async (departement) => {
        const repartition = await this.prisma.repartition.findFirst({
          where: {
            semestreId: dto.semestreId,
            departementId: departement.id,
            statut: 'VALIDEE',
          },
          select: { id: true },
        });

        if (!repartition) {
          throw new BadRequestException(
            `Aucun snapshot valide pour le département "${departement.code}"`,
          );
        }

        const snapshot = await this.prisma.snapshot.findFirst({
          where: { repartitionId: repartition.id },
          orderBy: { createdAt: 'desc' },
        });

        if (!snapshot) {
          throw new BadRequestException(
            `Aucun snapshot valide pour le département "${departement.code}"`,
          );
        }

        return snapshot;
      }),
    );

    // 4. Vérifier qu'aucune version de travail n'existe déjà pour ce semestre
    const versionExistante = await this.prisma.versionEdt.findFirst({
      where: {
        semestreId: dto.semestreId,
        statut: {
          notIn: ['PUBLIE', 'ARCHIVE'],
        },
      },
    });
    if (versionExistante) {
      throw new ConflictException(
        `Une version de travail existe déjà pour ce semestre (${versionExistante.numero}, statut ${versionExistante.statut})`,
      );
    }

    // 5. Numérotation : premier majeur à 1, sinon dernier majeur + 1, mineur 0
    const derniereVersion = await this.prisma.versionEdt.findFirst({
      where: { semestreId: dto.semestreId },
      orderBy: { createdAt: 'desc' },
    });
    let majeur = 1;
    if (derniereVersion) {
      const dernierMajeur = parseInt(derniereVersion.numero.split('.')[0], 10);
      majeur = Number.isNaN(dernierMajeur) ? 1 : dernierMajeur + 1;
    }
    const numero = `${majeur}.0`;

    // 6. Créer la version, ses snapshots et ses séances dans une transaction
    const version = await this.prisma.$transaction(async (tx) => {
      const v = await tx.versionEdt.create({
        data: {
          semestreId: dto.semestreId,
          numero,
          statut: 'BROUILLON' as VersionStatut,
          motif: dto.motif ?? null,
        },
      });

      // Lier les snapshots sélectionnés
      await tx.versionSnapshot.createMany({
        data: snapshotsParDepartement.map((s: { id: string }) => ({
          versionId: v.id,
          snapshotId: s.id,
        })),
      });

      // Créer une séance par affectation figée dans chaque snapshot
      for (const snapshot of snapshotsParDepartement) {
        const affectations = await tx.snapshotAffectation.findMany({
          where: { snapshotId: snapshot.id },
          orderBy: [
            { enseignantId: 'asc' },
            { moduleId: 'asc' },
            { typeEnseignementId: 'asc' },
          ],
        });

        // Dédoublonnage CM commun : regrouper par (groupeCommunKey, module, type, enseignant)
        const cmParCle = new Map<string, typeof affectations[number][]>();
        const affectationsSimples: typeof affectations = [];

        for (const a of affectations) {
          if (a.estCmCommun && a.groupeId) {
            const cle = `cm-${a.moduleId}-${a.typeEnseignementId}`;
            if (!cmParCle.has(cle)) cmParCle.set(cle, []);
            cmParCle.get(cle)!.push(a);
          } else {
            affectationsSimples.push(a);
          }
        }

        // Séances pour les affectations simples (1 séance par affectation)
        for (const a of affectationsSimples) {
          const groupeIds = a.groupeId ? [a.groupeId] : [];
          await this.creerSeance(
            tx,
            v.id,
            dto.semestreId,
            a,
            groupeIds,
            snapshot.tag,
          );
        }

        // Séances pour les CM communs (1 séance multi-groupes par clé)
        for (const [_cle, groupeAffectations] of cmParCle) {
          const representant = groupeAffectations[0];
          const groupeIds = [
            ...new Set(
              groupeAffectations
                .map((a) => a.groupeId)
                .filter((g): g is string => g !== null),
            ),
          ];
          await this.creerSeance(
            tx,
            v.id,
            dto.semestreId,
            representant,
            groupeIds,
            snapshot.tag,
          );
        }
      }

      return v;
    });

    return {
      id: version.id,
      semestreId: version.semestreId,
      numero: version.numero,
      statut: version.statut,
      motif: version.motif ?? undefined,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }
  /**
   * Crée une séance et ses liens SeanceGroupe à partir d'une affectation figée.
   */
  private async creerSeance(
    tx: any,
    versionId: string,
    semestreId: string,
    affectation: {
      enseignantId: string;
      groupeId: string | null;
      moduleId: string;
      typeEnseignementId: string;
      activityTagId: string | null;
      dureeMinutes: number;
      seancesParSemaine: number;
      estCmCommun: boolean;
    },
    groupeIds: string[],
    tag: string | undefined,
  ): Promise<void> {
    const affectationKey = affectation.groupeId
      ? `${affectation.groupeId}:${affectation.moduleId}:${affectation.typeEnseignementId}:${affectation.enseignantId}`
      : `cm:${affectation.moduleId}:${affectation.typeEnseignementId}:${affectation.enseignantId}`;

    await tx.seance.create({
      data: {
        versionId,
        semestreId,
        affectationKey,
        rang: 1,
        tag,
        enseignantId: affectation.enseignantId,
        salleId: null,
        jour: null,
        creneauDebut: null,
        nbCreneaux: 1,
        statut: 'NON_PLACEE',
        groupes: {
          create: groupeIds.map((groupeId) => ({ groupeId })),
        },
      },
    });
  }

  // ============================================
  // Périmètre de génération (L4-13)
  // GET /versions/{id}/perimetre : périmètre figé du semestre complet et empreinte.
  // ============================================

  /** Retourne le périmètre figé d'une version avec son empreinte SHA-256 (L4-13). */
  async getPerimetre(versionId: string): Promise<PerimetreResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        semestreId: true,
        numero: true,
        statut: true,
        verrous: {
          select: { id: true, type: true, seanceId: true, leveLe: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const semestre = await this.prisma.semestre.findUnique({
      where: { id: version.semestreId },
      select: {
        id: true,
        numero: true,
        anneeId: true,
        annee: { select: { id: true, code: true, numero: true } },
        groupes: {
          select: {
            id: true,
            code: true,
            effectif: true,
            niveau: { select: { code: true, libelle: true, formation: { select: { departementId: true } } } },
          },
          orderBy: { code: 'asc' },
        },
        creneaux: { select: { id: true, jour: true, ordre: true, heureDebut: true, heureFin: true }, orderBy: { jour: 'asc', ordre: 'asc' } },
        contrainteInstances: {
          where: { actif: true },
          include: { definition: true },
          orderBy: { id: 'asc' },
        },
        exigencesSalle: { select: { id: true, affectationKey: true, salleImposeeId: true }, orderBy: { id: 'asc' } },
      },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${version.semestreId}" introuvable`);
    }

    // Départements distincts des groupes du semestre
    const deptIds = [...new Set(
      semestre.groupes
        .map((g) => g.niveau.formation.departementId)
        .filter((id): id is string => id !== null),
    )];
    const departements = await this.prisma.departement.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, code: true, libelle: true },
      orderBy: { code: 'asc' },
    });

    // Enseignants de l'année du semestre
    const enseignants = await this.prisma.enseignant.findMany({
      where: { anneeId: semestre.anneeId },
      select: { id: true, nom: true, prenom: true },
      orderBy: { nom: 'asc', prenom: 'asc' },
    });

    // Salles actives des départements du semestre
    const salles = await this.prisma.salle.findMany({
      where: { departementId: { in: deptIds }, estActive: true },
      select: { id: true, code: true, capaciteMax: true },
      orderBy: { code: 'asc' },
    });

    // Profil de génération par défaut du semestre (profil suggéré pour le lancement)
    const profilParDefaut = await this.prisma.profilGeneration.findFirst({
      where: { semestreId: version.semestreId, estParDefaut: true },
      select: {
        id: true,
        nom: true,
        numero: true,
        estParDefaut: true,
        engineVersion: true,
        constructeurVersion: true,
      },
    });

    // Activités (affectations des snapshots de la version)
    const versionSnapshots = await this.prisma.versionSnapshot.findMany({
      where: { versionId },
      select: { snapshotId: true },
    });
    const snapshotIds = versionSnapshots.map((vs) => vs.snapshotId);
    const affectations = snapshotIds.length > 0
      ? await this.prisma.snapshotAffectation.findMany({
          where: { snapshotId: { in: snapshotIds } },
          select: { id: true, groupeId: true, moduleId: true, typeEnseignementId: true, activityTagId: true },
          orderBy: { id: 'asc' },
        })
      : [];

    const moduleIds = [...new Set(affectations.map((a) => a.moduleId))];
    const typeIds = [...new Set(affectations.map((a) => a.typeEnseignementId))];
    const modules = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, code: true },
    });
    const typesEnseignement = await this.prisma.typeEnseignement.findMany({
      where: { id: { in: typeIds } },
      select: { id: true, code: true },
    });
    const moduleById = new Map(modules.map((m) => [m.id, m.code]));
    const typeById = new Map(typesEnseignement.map((t) => [t.id, t.code]));

    const activites = affectations.map((a) => ({
      id: a.id,
      moduleCode: moduleById.get(a.moduleId) ?? '',
      typeEnseignement: typeById.get(a.typeEnseignementId) ?? '',
    }));

    // Empreinte déterministe (snapshots, contraintes, exigences, verrous, grille)
    const perimetreContent = {
      contraintes: semestre.contrainteInstances.map((ci) => ({
        id: ci.id,
        code: ci.definition.code,
        actif: ci.actif,
      })),
      exigences: semestre.exigencesSalle.map((e) => ({
        id: e.id,
        affectationKey: e.affectationKey,
        salleImposeeId: e.salleImposeeId,
      })),
      grille: semestre.creneaux.map((c) => ({
        jour: c.jour,
        ordre: c.ordre,
        heureDebut: c.heureDebut,
        heureFin: c.heureFin,
      })),
      snapshots: versionSnapshots.map((vs) => ({ id: vs.snapshotId })).sort((a, b) => a.id.localeCompare(b.id)),
      verrous: version.verrous.map((v) => ({
        id: v.id,
        type: v.type,
        seanceId: v.seanceId,
        leveLe: v.leveLe,
      })),
    };
    const perimetreHash = createHash('sha256')
      .update(JSON.stringify(perimetreContent, Object.keys(perimetreContent).sort()))
      .digest('hex');

    // Profil de génération (par défaut du semestre)
    let profil: PerimetreResponseDto['profil'] = null;
    let versionDuJeuDeRegles: string | null = null;
    let versionAdaptateur: string | null = null;
    if (profilParDefaut) {
      const p = profilParDefaut;
      profil = {
        id: p.id,
        nom: p.nom,
        numero: p.numero,
        estParDefaut: p.estParDefaut,
        engineVersion: p.engineVersion,
        constructeurVersion: p.constructeurVersion,
      };
      versionDuJeuDeRegles = String(p.numero);
      versionAdaptateur = p.constructeurVersion;
    }

    return {
      versionId: version.id,
      semestreId: version.semestreId,
      annee: semestre.annee.code ?? String(semestre.annee.numero),
      semestreNumero: semestre.numero,
      departements: departements.map((d) => ({ id: d.id, code: d.code, libelle: d.libelle })),
      activites,
      groupes: semestre.groupes.map((g) => ({
        id: g.id,
        code: g.code,
        niveau: g.niveau.libelle,
        effectif: g.effectif,
      })),
      enseignants: enseignants.map((e) => ({ id: e.id, nom: e.nom, prenom: e.prenom })),
      salles: salles.map((s) => ({ id: s.id, code: s.code, capacite: s.capaciteMax })),
      contraintes: semestre.contrainteInstances.map((ci) => ({
        id: ci.id,
        code: ci.definition.code,
        libelle: ci.definition.libelle,
        nature: ci.nature,
        portee: ci.definition.portee,
        actif: ci.actif,
      })),
      verrous: version.verrous.map((v) => ({
        id: v.id,
        type: v.type,
        seanceId: v.seanceId,
        leveLe: v.leveLe,
      })),
      profil,
      versionDuJeuDeRegles,
      versionAdaptateur,
      perimetreHash,
      genereLe: new Date(),
    };
  }

  // ============================================
  // Lancement de génération (L4-14)
  // POST /versions/{id}/generations -> 202 ACCEPTED
  // ============================================

  /** Lance une génération d'emploi du temps après pré-validation synchrone (L4-14). */
  async createGeneration(
    versionId: string,
    dto: CreateGenerationDto,
    userId: string,
  ): Promise<GenerationResponseDto> {
    // 1. Récupération de la version (404 si absente)
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        semestreId: true,
        statut: true,
        verrous: {
          select: { id: true, type: true, seanceId: true, leveLe: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // 2. Immuabilité de la version (423 VERSION_IMMUTABLE)
    const statutsImmutables = ['PUBLIE', 'ARCHIVE'];
    if (statutsImmutables.includes(version.statut as string)) {
      throw new ConflictException({
        code: 'VERSION_IMMUTABLE',
        message: `La version "${versionId}" est immuable (statut: ${version.statut})`,
      });
    }

    // 3. Bail d'édition détenu (423 EDIT_LOCK_HELD)
    const editLock = await this.prisma.editLock.findUnique({
      where: { versionId },
      select: { id: true, userId: true, expiresAt: true },
    });
    if (editLock && new Date(editLock.expiresAt) > new Date()) {
      throw new ConflictException({
        code: 'EDIT_LOCK_HELD',
        message: `Un bail d'édition est détenu sur la version "${versionId}"`,
      });
    }

    // 4. Génération déjà en cours (409 GENERATION_ALREADY_RUNNING)
    const generationEnCours = await this.prisma.generation.findFirst({
      where: {
        versionId,
        statut: { in: ['QUEUED', 'RUNNING'] as GenerationStatut[] },
      },
      select: { id: true, statut: true, createdAt: true },
    });
    if (generationEnCours) {
      throw new ConflictException({
        code: 'GENERATION_ALREADY_RUNNING',
        message: `Une génération est déjà en cours sur la version "${versionId}" (statut: ${generationEnCours.statut})`,
      });
    }

    // 5. Profil de génération (existence et appartenance au semestre)
    const profil = await this.prisma.profilGeneration.findUnique({
      where: { id: dto.profilId },
      select: { id: true, semestreId: true, numero: true, nom: true, preserverVerrous: true },
    });
    if (!profil) {
      throw new NotFoundException(
        `Profil de génération "${dto.profilId}" introuvable`,
      );
    }
    if (profil.semestreId !== version.semestreId) {
      throw new BadRequestException({
        code: 'PROFIL_WRONG_SEMESTRE',
        message: `Le profil "${dto.profilId}" n'appartient pas au semestre de la version`,
      });
    }

    // 6. Pré-validation du tableau de préparation (422 PREPARATION_BLOCKED)
    const preparation = await this.preparationService.getPreparation(
      version.semestreId,
    );
    if (!preparation.peutGenerer) {
      const bloquants = preparation.controles
        .filter((c) => c.niveau === 'BLOQUANT' && c.statut === 'NON_CONFORME')
        .flatMap((c) => c.anomalies.map((a) => a.explication));
      throw new BadRequestException({
        code: 'PREPARATION_BLOCKED',
        message: 'Le tableau de préparation présente des anomalies bloquantes',
        details: bloquants,
      });
    }

    // 7. Verrous incompatibles (422 LOCK_INCOMPATIBLE)
    const controleVerrous = preparation.controles.find((c) => c.numero === 6);
    if (
      controleVerrous &&
      controleVerrous.statut === 'NON_CONFORME' &&
      controleVerrous.niveau === 'BLOQUANT'
    ) {
      throw new BadRequestException({
        code: 'LOCK_INCOMPATIBLE',
        message: 'Des verrous sont incompatibles avec les contraintes du semestre',
        details: controleVerrous.anomalies.map((a) => a.explication),
      });
    }

    // 8. Contraintes non traduites sans acquittement (422 UNTRANSLATED_CONSTRAINTS_UNACKNOWLEDGED)
    const constraintsNonTraduites = await this.prisma.contrainteInstance.findMany({
      where: {
        semestreId: version.semestreId,
        actif: true,
        definition: {
          fetSupport: 'AUCUN',
        },
      },
      select: { id: true, definitionId: true },
    });
    if (
      constraintsNonTraduites.length > 0 &&
      !dto.acknowledgeUntranslatedConstraints
    ) {
      throw new BadRequestException({
        code: 'UNTRANSLATED_CONSTRAINTS_UNACKNOWLEDGED',
        message: `${constraintsNonTraduites.length} contrainte(s) active(s) n'a(ont) pas de traduction FET supportée`,
        details: constraintsNonTraduites.map((c) => c.id),
      });
    }

    // 9. Empreinte du périmètre : recalcul et comparaison (409 PERIMETER_CHANGED)
    const perimetre = await this.getPerimetre(versionId);
    if (perimetre.perimetreHash !== dto.perimetreHash) {
      throw new ConflictException({
        code: 'PERIMETER_CHANGED',
        message:
          "L'empreinte du périmètre ne correspond plus aux données actuelles. Rafraîchissez le périmètre et relancez.",
        expected: perimetre.perimetreHash,
        provided: dto.perimetreHash,
      });
    }

    // 10. Création de la génération (dans une transaction)
    const maintenant = new Date();
    const generation = await this.prisma.$transaction(async (tx) => {
      const gen = await tx.generation.create({
        data: {
          id: require('crypto').randomUUID(),
          semestreId: version.semestreId,
          versionId: version.id,
          auteurId: userId,
          statut: 'QUEUED' as GenerationStatut,
          mode: 'AUTOMATIQUE' as GenerationMode,
          engine: 'fet',
          profilGenerationId: dto.profilId,
          profilGenerationVersion: profil.numero,
          perimetre: perimetre as unknown as any,
          perimetreHash: dto.perimetreHash,
          queuedAt: maintenant,
        },
        select: {
          id: true,
          versionId: true,
          semestreId: true,
          profilGenerationId: true,
          statut: true,
          mode: true,
          perimetreHash: true,
          queuedAt: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: require('crypto').randomUUID(),
          action: 'GENERATION_LAUNCH',
          objetType: 'Generation',
          objetId: gen.id,
          versionId: version.id,
          userId: userId,
          at: maintenant,
          details: {
            perimetreHash: dto.perimetreHash,
            profilId: dto.profilId,
          },
        },
      });

      return gen;
    });

    // 11. Retour DTO
    return {
      id: generation.id,
      versionId: generation.versionId,
      semestreId: generation.semestreId,
      profilId: (generation.profilGenerationId ?? undefined) as string | undefined,
      statut: generation.statut,
      mode: generation.mode,
      perimetreHash: generation.perimetreHash as string,
      queuedAt: generation.queuedAt,
      createdAt: maintenant,
    };
  }

  // ============================================
  // Adoption d'une génération (L4-19)
  // POST /versions/{id}/adopt
  // ============================================

  async adoptGeneration(
    versionId: string,
    generationId: string,
    userId: string,
  ): Promise<AdoptResponseDto> {
    // 1. La version existe
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      include: {
        seances: {
          where: { origine: 'MOTEUR' as SeanceOrigine },
          include: { verrous: true },
        },
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // 2. La version doit être mutable (pas PUBLIE / ARCHIVE) -> 409
    const statutsImmutables = ['PUBLIE', 'ARCHIVE'] as VersionStatut[];
    if (statutsImmutables.includes(version.statut)) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `La version "${versionId}" est immuable (statut: ${version.statut})`,
      });
    }

    // 3. La génération existe et appartient à cette version
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      include: { seances: true },
    });
    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }
    if (generation.versionId !== versionId) {
      throw new UnprocessableEntityException({
        code: 'GENERATION_WRONG_VERSION',
        message: 'La génération ne porte pas sur les snapshots de cette version',
      });
    }

    // 4. La génération doit être réussie (y compris avec avertissements)
    const statutsReussis = [
      'SUCCEEDED',
      'SUCCEEDED_WITH_WARNINGS',
    ] as GenerationStatut[];
    if (!statutsReussis.includes(generation.statut)) {
      throw new UnprocessableEntityException({
        code: 'GENERATION_NOT_SUCCESSFUL',
        message: `La génération "${generationId}" n'est pas dans un état adopté (statut: ${generation.statut})`,
      });
    }

    // 5. Les snapshots de la version n'ont pas changé depuis la génération
    const perimetre = await this.getPerimetre(versionId);
    if (perimetre.perimetreHash !== generation.perimetreHash) {
      throw new UnprocessableEntityException({
        code: 'SNAPSHOTS_CHANGED',
        message: 'Les snapshots de la version ont changé depuis la génération',
      });
    }

    // 6. Séances MOTEUR à remplacer : celles sans verrou ACTIVITE non levé
    const seancesARemplacer = version.seances.filter(
      (s) =>
        !s.verrous.some(
          (v) => v.type === 'ACTIVITE' && v.leveLe === null,
        ),
    );
    const seanceIdsARemplacer = seancesARemplacer.map((s) => s.id);

    // Numérotation : majeur + 1 (RC-04), mineur remis à 0
    const ancienNumero = version.numero;
    const majeur = parseInt(ancienNumero.split('.')[0], 10);
    const nouveauNumero = `${Number.isNaN(majeur) ? 1 : majeur + 1}.0`;
    const maintenant = new Date();

    // 7. Transaction : suppression, insertion, occupations, mise à jour, audit
    await this.prisma.$transaction(async (tx) => {
      // a. Supprimer les séances MOTEUR remplaçables et leurs dépendances
      if (seanceIdsARemplacer.length > 0) {
        await tx.occupation.deleteMany({
          where: { seanceId: { in: seanceIdsARemplacer } },
        });
        await tx.seanceGroupe.deleteMany({
          where: { seanceId: { in: seanceIdsARemplacer } },
        });
        await tx.seance.deleteMany({
          where: { id: { in: seanceIdsARemplacer } },
        });
      }

      // b. Insérer les séances de la génération
      const creneaux = await tx.creneau.findMany({
        where: { semestreId: version.semestreId },
        orderBy: [{ jour: 'asc' }, { ordre: 'asc' }],
      });
      const creneauxParJour = new Map<JourSemaine, Creneau[]>();
      for (const c of creneaux) {
        const liste = creneauxParJour.get(c.jour) ?? [];
        liste.push(c);
        creneauxParJour.set(c.jour, liste);
      }

      for (const gs of generation.seances) {
        const seance = await tx.seance.create({
          data: {
            id: randomUUID(),
            semestreId: version.semestreId,
            versionId: version.id,
            affectationKey: gs.affectationKey,
            rang: gs.rang,
            nbCreneaux: gs.nbCreneaux,
            statut: gs.statut,
            origine: 'MOTEUR' as SeanceOrigine,
            enseignantId: gs.enseignantId,
            salleId: gs.salleId,
            jour: (gs.jour ?? undefined) as JourSemaine | undefined,
            creneauDebutId: gs.creneauDebutId,
            tag: null,
            revision: 0,
            groupes: {
              create: gs.groupeIds.map((gid) => ({ groupeId: gid })),
            },
          },
          include: { groupes: true },
        });

        // Reconstruire les occupations uniquement si la séance est placée
        if (
          seance.statut === 'PLACEE' &&
          seance.jour &&
          seance.creneauDebutId
        ) {
          const creneauxCouverts = this.creneauxCouvertsPourSeance(
            creneauxParJour,
            seance.jour,
            seance.creneauDebutId,
            seance.nbCreneaux,
          );
          const occupationsData: Array<{
            versionId: string;
            seanceId: string;
            jour: JourSemaine;
            creneauId: string;
            ressourceType: RessourceType;
            ressourceId: string;
          }> = [];
          for (const creneauId of creneauxCouverts) {
            if (seance.enseignantId) {
              occupationsData.push({
                versionId: version.id,
                seanceId: seance.id,
                jour: seance.jour,
                creneauId,
                ressourceType: 'ENSEIGNANT',
                ressourceId: seance.enseignantId,
              });
            }
            if (seance.salleId) {
              occupationsData.push({
                versionId: version.id,
                seanceId: seance.id,
                jour: seance.jour,
                creneauId,
                ressourceType: 'SALLE',
                ressourceId: seance.salleId,
              });
            }
            for (const g of seance.groupes) {
              occupationsData.push({
                versionId: version.id,
                seanceId: seance.id,
                jour: seance.jour,
                creneauId,
                ressourceType: 'GROUPE',
                ressourceId: g.groupeId,
              });
            }
          }
          if (occupationsData.length > 0) {
            await tx.occupation.createMany({ data: occupationsData });
          }
        }
      }

      // c. Supprimer les conflits existants de la version
      await tx.conflit.deleteMany({ where: { versionId } });

      // d. Passer la version en EDITION et incrémenter le majeur (RC-04)
      await tx.versionEdt.update({
        where: { id: versionId },
        data: {
          statut: 'EDITION' as VersionStatut,
          numero: nouveauNumero,
          motif: `Adoption de la génération ${generationId}`,
        },
      });

      // e. Audit
      await tx.auditLog.create({
        data: {
          action: 'GENERATION_ADOPT',
          objetType: 'Version',
          objetId: version.id,
          versionId: version.id,
          userId,
          at: maintenant,
          details: {
            generationId,
            ancienNumero,
            nouveauNumero,
            nbSeancesRemplacees: seanceIdsARemplacer.length,
            nbSeancesGenerees: generation.seances.length,
          },
        },
      });
    });

    // 8. Recalcul complet des conflits (après la transaction, lit les nouvelles données)
    const conflits = await this.conflitService.recomputeConflits(versionId);

    return {
      versionId: version.id,
      numero: nouveauNumero,
      statut: 'EDITION' as VersionStatut,
      conflitsInitiaux: conflits.length,
    };
  }

  // ============================================
  // Transitions de workflow de version (L5-01)
  // POST /versions/{id}/transitions
  // ============================================

  /** Table des transitions autorisées (ST §4.1.1). */
  private readonly TRANSITION_TABLE: { de: VersionStatut; vers: VersionStatut; action: TransitionType }[] = [
    { de: 'BROUILLON', vers: 'EDITION', action: 'DEMARRER_EDITION' },
    { de: 'EDITION', vers: 'PRET_POUR_VALIDATION', action: 'MARQUER_PRET' },
    { de: 'PRET_POUR_VALIDATION', vers: 'EDITION', action: 'REPRENDRE' },
    { de: 'PRET_POUR_VALIDATION', vers: 'EN_VALIDATION', action: 'SOUMETTRE' },
    { de: 'REJETE', vers: 'CORRECTION', action: 'REPRENDRE' },
    { de: 'CORRECTION', vers: 'EN_VALIDATION', action: 'RESOUMETTRE' },
  ];

  /** Statuts immuables sur lesquels aucune transition n'est permise. */
  private readonly STATUTS_IMMUTABLES = ['PUBLIE', 'ARCHIVE'] as VersionStatut[];

  async transition(
    versionId: string,
    action: TransitionType,
    userId: string,
    commentaire?: string,
  ): Promise<TransitionResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.versionEdt.findUnique({
        where: { id: versionId },
        select: { id: true, numero: true, statut: true, revision: true },
      });
      if (!version) {
        throw new NotFoundException(`Version \"${versionId}\" introuvable`);
      }
      if (action === 'ABANDONNER') {
        if (this.STATUTS_IMMUTABLES.includes(version.statut)) {
          throw new ConflictException({
            code: 'INVALID_STATE_TRANSITION',
            message: `Impossible d'abandonner une version déjà publiée ou archivée (statut: ${version.statut})`,
          });
        }
        await tx.versionEdt.update({
          where: { id: versionId },
          data: {
            statut: 'ARCHIVE' as VersionStatut,
            revision: { increment: 1 },
            motif: commentaire ?? null,
          },
        });
        await tx.workflowTransition.create({
          data: { versionId, de: version.statut, vers: 'ARCHIVE', userId, automatique: false, commentaire: commentaire ?? null },
        });
        await tx.auditLog.create({
          data: {
            userId, action: 'VERSION_ABANDONNER', objetType: 'VersionEdt', objetId: versionId,
            ancienneValeur: { statut: version.statut, revision: version.revision },
            nouvelleValeur: { statut: 'ARCHIVE', revision: (version.revision ?? 0) + 1 },
            versionId, motif: commentaire ?? null,
          },
        });
        const updated = await tx.versionEdt.findUnique({
          where: { id: versionId },
          select: { id: true, numero: true, statut: true, revision: true },
        });
        return this.toTransitionResponse(updated!, version.statut, 'ARCHIVE', action, commentaire);
      }
      const transition = this.TRANSITION_TABLE.find((t) => t.de === version.statut && t.action === action);
      if (!transition) {
        throw new ConflictException({
          code: 'INVALID_STATE_TRANSITION',
          message: `Action "${action}" interdite depuis l'état "${version.statut}"`,
        });
      }
      if (action === 'DEMARRER_EDITION') {
        const seanceNonPlacee = await tx.seance.findFirst({
          where: { versionId, statut: 'NON_PLACEE' as SeanceStatut }, select: { id: true },
        });
        if (!seanceNonPlacee) {
          throw new ConflictException({
            code: 'NO_SEANCES_TO_EDIT',
            message: 'Aucune séance à placer (NON_PLACEE) sur cette version',
          });
        }
      }
      if (action === 'MARQUER_PRET' || action === 'SOUMETTRE' || action === 'RESOUMETTRE') {
        const seanceNonPlacee = await tx.seance.findFirst({
          where: { versionId, statut: 'NON_PLACEE' as SeanceStatut }, select: { id: true },
        });
        if (seanceNonPlacee) {
          throw new ConflictException({
            code: 'SEANCES_NON_PLACES',
            message: 'Des séances restent à placer (NON_PLACEE) : couverture incomplète',
          });
        }

        // L5-02 : contrôle de soumission (conflits bloquants et couverture)
        const soumission = await this.verifierSoumission(versionId);
        if (!soumission.estSubmittable) {
          throw new UnprocessableEntityException({
            code: 'VERSION_NOT_SUBMITTABLE',
            status: 422,
            conflits: soumission.conflitsBloquants,
            couverture: soumission.couvertureIncomplete,
            avertissementsNonAcceptes: soumission.avertissementsNonAcceptes,
          });
        }
      }

      await tx.versionEdt.update({
        where: { id: versionId },
        data: {
          statut: transition.vers,
          revision: { increment: 1 },
          ...(action === 'SOUMETTRE' || action === 'RESOUMETTRE'
            ? { cycleValidation: { increment: 1 }, soumisPar: userId }
            : {}),
        },
      });
      await tx.workflowTransition.create({
        data: {
          versionId, de: version.statut, vers: transition.vers, userId, automatique: false, commentaire: commentaire ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          userId, action: `VERSION_${action}`, objetType: 'VersionEdt', objetId: versionId,
          ancienneValeur: { statut: version.statut, revision: version.revision },
          nouvelleValeur: { statut: transition.vers, revision: (version.revision ?? 0) + 1 },
          versionId, motif: commentaire ?? null,
        },
      });

      // L5-02 : libération du bail d'édition après soumission (version passe en lecture seule)
      if (action === 'SOUMETTRE' || action === 'RESOUMETTRE') {
        await tx.editLock.deleteMany({ where: { versionId } });
      }

      const updated = await tx.versionEdt.findUnique({
        where: { id: versionId },
        select: { id: true, numero: true, statut: true, revision: true, cycleValidation: true, soumisPar: true },
      }) ?? {
        id: versionId,
        numero: version.numero,
        statut: transition.vers,
        revision: (version.revision ?? 0) + 1,
        cycleValidation: 0,
      } as { id: string; numero: string; statut: VersionStatut; revision: number; cycleValidation?: number };
      return this.toTransitionResponse(updated, version.statut, transition.vers, action, commentaire);
    });
  }

  private toTransitionResponse(
    version: { id: string; numero: string; statut: VersionStatut; revision: number; cycleValidation?: number },
    de: VersionStatut,
    vers: VersionStatut,
    action: TransitionType,
    commentaire?: string,
  ): TransitionResponseDto {
    return {
      versionId: version.id,
      numero: version.numero,
      de,
      vers,
      action,
      revision: version.revision,
      cycleValidation: version.cycleValidation ?? 0,
      commentaire,
      at: new Date(),
    };
  }

  // ============================================
  // Listage des générations d'une version (L4-21)
  // GET /versions/{id}/generations
  // ============================================

  /** Liste toutes les générations d'une version (lecture, permission version:read). */
  async getGenerationsByVersion(
    versionId: string,
  ): Promise<GenerationListResponseDto> {
    // Vérifier que la version existe
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, numero: true },
    });
    if (!version) {
      throw new NotFoundException(`Version \"${versionId}\" introuvable`);
    }

    const generations = await this.prisma.generation.findMany({
      where: { versionId },
      select: {
        id: true,
        versionId: true,
        statut: true,
        score: true,
        classee: true,
        classement: true,
        motifNonClassee: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        durationSeconds: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: generations.map((g) => ({
        id: g.id,
        versionId: g.versionId,
        versionNom: version.numero,
        statut: g.statut,
        score: g.score ?? null,
        classee: g.classee ?? null,
        classement: g.classement ?? null,
        motifNonClassee: g.motifNonClassee ?? null,
        createdAt: g.createdAt,
        startedAt: g.startedAt ?? null,
        finishedAt: g.finishedAt ?? null,
        durationSeconds: g.durationSeconds ?? null,
      })),
      total: generations.length,
    };
  }

  // ============================================
  // Historique de version (L5-09)
  // GET /versions/{id}/history
  // ============================================

  /** Retourne la chronologie des transitions de workflow d'une version. */
  async getHistory(versionId: string): Promise<HistoryResponseDto> {
    // Vérifier que la version existe
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true },
    });
    if (!version) {
      throw new NotFoundException(`Version \"${versionId}\" introuvable`);
    }

    const transitions = await this.prisma.workflowTransition.findMany({
      where: { versionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { at: 'desc' },
    });

    const entries = transitions.map((t) => {
      const userName =
        t.user.firstName && t.user.lastName
          ? `${t.user.firstName} ${t.user.lastName}`
          : t.user.email;

      return {
        id: t.id,
        de: t.de,
        vers: t.vers,
        action: this.actionFromTransition(t.de, t.vers),
        userId: t.userId,
        userName,
        automatique: t.automatique,
        commentaire: t.commentaire ?? null,
        at: t.at,
      };
    });

    return {
      versionId,
      entries,
    };
  }

  /** Déduit le libellé d'action d'une transition à partir des statuts source/cible. */
  private actionFromTransition(de: VersionStatut, vers: VersionStatut): string {
    const found = this.TRANSITION_TABLE.find((t) => t.de === de && t.vers === vers);
    if (found) {
      return found.action;
    }
    if (vers === 'ARCHIVE') {
      return 'ABANDONNER';
    }
    return `${de} → ${vers}`;
  }

  /**
   * Retourne les nbCreneaux créneaux couverts à partir de creneauDebutId,
   * dans l'ordre du jour donné.
   */
  private creneauxCouvertsPourSeance(
    creneauxParJour: Map<JourSemaine, Creneau[]>,
    jour: JourSemaine,
    creneauDebutId: string,
    nbCreneaux: number,
  ): string[] {
    const liste = creneauxParJour.get(jour) ?? [];
    const indexDebut = liste.findIndex((c) => c.id === creneauDebutId);
    if (indexDebut < 0) {
      return [];
    }
    return liste
      .slice(indexDebut, indexDebut + nbCreneaux)
      .map((c) => c.id);
  }

  // Import de résultat de génération manuelle (L4-16)
  // POST /versions/{id}/generations/import
  // ============================================

  /**
   * Importe le résultat d'une exécution manuelle de FET pour une version.
   *
   * Étapes :
   * 1. Vérifier que la version existe et est en statut EDITION
   * 2. Vérifier qu'aucune génération n'est déjà en cours sur cette version
   * 3. Vérifier que l'empreinte du fichier moteur correspond à un FichierMoteur lié à une génération de cette version
   * 4. Créer la Generation en mode MANUELLE (sans graines, fichierAttendu = sha256)
   * 5. Stocker le fichier uploadé temporairement
   * 6. Enfiler un job pg-boss pour l'import du résultat par le worker
   * 7. Retourner { generationId, mode: 'MANUELLE' }
   */
  async importManualGeneration(
    versionId: string,
    file: Express.Multer.File,
    fichierMoteurSha256: string,
    userId: string,
  ): Promise<ImportGenerationResponseDto> {
    // 1. Récupérer la version
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        semestreId: true,
        statut: true,
      },
    });
    if (!version) {
      throw new NotFoundException(`Version \"${versionId}\" introuvable`);
    }

    // 2. La version doit être en statut EDITION pour accepter une importation
    if (version.statut !== 'EDITION') {
      throw new BadRequestException({
        code: 'VERSION_NOT_EDITION',
        message: `La version \"${versionId}\" n'est pas en statut EDITION (actuel: ${version.statut})`,
      });
    }

    // 3. Vérifier qu'aucune génération n'est déjà en cours (RUNNING ou QUEUED) sur cette version
    const generationEnCours = await this.prisma.generation.findFirst({
      where: {
        versionId,
        statut: { in: ['QUEUED', 'RUNNING'] as GenerationStatut[] },
      },
      select: { id: true, statut: true },
    });
    if (generationEnCours) {
      throw new ConflictException({
        code: 'GENERATION_ALREADY_RUNNING',
        message: `Une génération est déjà en cours sur la version \"${versionId}\" (id: ${generationEnCours.id}, statut: ${generationEnCours.statut})`,
      });
    }

    // 4. Vérifier que l'empreinte correspond à un FichierMoteur lié à une génération de cette version
    const fichierMoteur = await this.prisma.fichierMoteur.findFirst({
      where: {
        sha256: fichierMoteurSha256,
        generation: {
          versionId,
        },
      },
      select: {
        id: true,
        sha256: true,
        engineVersion: true,
        generationId: true,
      },
    });
    if (!fichierMoteur) {
      throw new UnprocessableEntityException({
        code: 'ENGINE_FILE_MISMATCH',
        message:
          "L'empreinte du fichier moteur ne correspond à aucun fichier moteur exporté pour cette version",
        expected: fichierMoteurSha256,
      });
    }

    // 5. Stocker le fichier uploadé temporairement pour le worker
    const storageDir = process.env.ENGINE_FILE_STORAGE_DIR ?? join(tmpdir(), 'takt-engine-files');
    const importDir = await mkdtemp(join(storageDir, 'import-manuel-'));
    const filePath = join(importDir, file.originalname ?? 'import.fet');
    await writeFile(filePath, file.buffer);

    // 6. Créer la Generation en mode MANUELLE dans une transaction
    const maintenant = new Date();
    const generation = await this.prisma.$transaction(async (tx) => {
      const gen = await tx.generation.create({
        data: {
          id: randomUUID(),
          semestreId: version.semestreId,
          versionId: version.id,
          auteurId: userId,
          statut: 'QUEUED' as GenerationStatut,
          mode: 'MANUELLE' as GenerationMode,
          engine: 'fet',
          engineVersion: fichierMoteur.engineVersion ?? null,
          fichierAttendu: fichierMoteurSha256,
          seeds: PrismaValue.JsonNull,
          perimetre: PrismaValue.JsonNull,
          perimetreHash: null,
          profilGenerationVersion: 0,
          queuedAt: maintenant,
        },
        select: {
          id: true,
          versionId: true,
          semestreId: true,
          statut: true,
          mode: true,
          fichierAttendu: true,
          queuedAt: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'GENERATION_IMPORT_MANUEL',
          objetType: 'Generation',
          objetId: gen.id,
          versionId: version.id,
          userId: userId,
          at: maintenant,
          details: {
            fichierMoteurId: fichierMoteur.id,
            fichierMoteurSha256: fichierMoteurSha256,
            engineVersion: fichierMoteur.engineVersion,
          },
        },
      });

      return gen;
    });

    // 7. Enfiler le job d'import manuel sur pg-boss
    await this.boss.send(
      'generation:import-manuel',
      {
        generationId: generation.id,
        semestreId: generation.semestreId,
        filePath,
        versionId: version.id,
      },
      {
        retryDelay: 30_000,
        retryBackoff: true,
        expireInSeconds: 600,
      },
    );

    // 8. Retour DTO
    return {
      generationId: generation.id,
      mode: generation.mode,
    };
  }

  async getImpact(versionId: string): Promise<ImpactResponseDto> {
    // 1. Récupération de la version (404 si absente)
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, semestreId: true, numero: true, statut: true, createdAt: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // 2. Départements du semestre (distincts, via groupes → niveau → formation)
    const groupes = await this.prisma.groupe.findMany({
      where: { semestreId: version.semestreId },
      select: {
        id: true,
        niveau: {
          select: {
            formation: {
              select: {
                departement: { select: { id: true, code: true, libelle: true } },
              },
            },
          },
        },
      },
    });
    const deptMap = new Map<string, { id: string; code: string; libelle: string }>();
    for (const g of groupes) {
      const d = g.niveau.formation.departement;
      if (!deptMap.has(d.id)) {
        deptMap.set(d.id, { id: d.id, code: d.code, libelle: d.libelle });
      }
    }
    const departements = Array.from(deptMap.values());
    // 3. Séances modifiées de cette version (revision > 0)
    const seancesModifiees = await this.prisma.seance.findMany({
      where: { versionId, revision: { gt: 0 } },
      select: {
        id: true,
        enseignantId: true,
        groupes: { select: { groupeId: true } },
      },
    });

    // 4. Départements concernés par les séances modifiées (via leurs groupes)
    const seanceGroupeModifie: { groupeId: string }[] = [];
    for (const s of seancesModifiees) {
      for (const sg of s.groupes) {
        seanceGroupeModifie.push({ groupeId: sg.groupeId });
      }
    }

    const groupeIdsModifies = new Set(seanceGroupeModifie.map((sg) => sg.groupeId));
    const groupeToDept = new Map<string, string>();
    if (groupeIdsModifies.size > 0) {
      const groupesModifies = await this.prisma.groupe.findMany({
        where: { id: { in: Array.from(groupeIdsModifies) } },
        select: {
          id: true,
          niveau: { select: { formation: { select: { departementId: true } } } },
        },
      });
      for (const g of groupesModifies) {
        groupeToDept.set(g.id, g.niveau.formation.departementId);
      }
    }

    const deptsAvecSeancesModifiees = new Set<string>();
    for (const { groupeId } of seanceGroupeModifie) {
      const deptId = groupeToDept.get(groupeId);
      if (deptId) deptsAvecSeancesModifiees.add(deptId);
    }

    // 5. Enseignants affectés aux séances modifiées → leurs départements sont impactés
    const enseignantIdsModifies = new Set<string>();
    for (const s of seancesModifiees) {
      if (s.enseignantId) enseignantIdsModifies.add(s.enseignantId);
    }

    const deptsAvecEnseignantPartage = new Set<string>();
    if (enseignantIdsModifies.size > 0) {
      const enseignants = await this.prisma.enseignant.findMany({
        where: { id: { in: Array.from(enseignantIdsModifies) } },
        select: { id: true, departementId: true },
      });
      for (const e of enseignants) {
        deptsAvecEnseignantPartage.add(e.departementId);
      }
    }

    // 6. Snapshots modifiés : un département est impacté si sa répartition a un snapshot
    //    créé après la version courante (nouvelle validation depuis)
    const deptsSnapshotModifie = new Set<string>();
    const repartitions = await this.prisma.repartition.findMany({
      where: { semestreId: version.semestreId },
      select: { id: true, departementId: true },
    });
    if (repartitions.length > 0) {
      const repartIds = repartitions.map((r) => r.id);
      const snapshots = await this.prisma.snapshot.findMany({
        where: { repartitionId: { in: repartIds } },
        select: { repartitionId: true, valideLe: true },
        orderBy: { valideLe: 'desc' },
      });
      const dernierSnapshotParRepart = new Map<string, Date>();
      for (const snap of snapshots) {
        const exist = dernierSnapshotParRepart.get(snap.repartitionId);
        if (!exist || snap.valideLe > exist) {
          dernierSnapshotParRepart.set(snap.repartitionId, snap.valideLe);
        }
      }
      for (const r of repartitions) {
        const dernier = dernierSnapshotParRepart.get(r.id);
        if (dernier && dernier > version.createdAt) {
          deptsSnapshotModifie.add(r.departementId);
        }
      }
    }

    // 7. Version parente : dernière version PUBLIE ou ARCHIVE du même semestre, avant la courante
    const versionParente = await this.prisma.versionEdt.findFirst({
      where: {
        semestreId: version.semestreId,
        id: { not: version.id },
        statut: { in: ['PUBLIE', 'ARCHIVE'] as VersionStatut[] },
        createdAt: { lt: version.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, statut: true, numero: true },
    });

    const parenteApprouvee = !!versionParente;

    // 8. Construire le résultat par département
    const departementsDto: ImpactDepartementDto[] = [];
    for (const dept of departements) {
      const id = dept.id;
      const seanceModifiee = deptsAvecSeancesModifiees.has(id);
      const enseignantPartage = deptsAvecEnseignantPartage.has(id);
      const snapshotModifie = deptsSnapshotModifie.has(id);

      let statut: ImpactDepartementStatut;
      let raison: string;

      if (!parenteApprouvee) {
        statut = 'IMPACTE';
        raison = 'PREMIERE_VERSION';
      } else if (seanceModifiee || enseignantPartage || snapshotModifie) {
        statut = 'IMPACTE';
        raison = seanceModifiee
          ? 'SEANCES_MODIFIEES'
          : enseignantPartage
          ? 'ENSEIGNANT_PARTAGE'
          : 'SNAPSHOT_MODIFIE';
      } else {
        statut = 'NON_IMPACTE';
        raison = 'AUCUN_CHANGEMENT';
      }

      let reportee = false;
      let cycleSource: string | undefined;
      if (statut === 'NON_IMPACTE' && parenteApprouvee && versionParente) {
        reportee = true;
        cycleSource = versionParente.id;
      }

      departementsDto.push({
        departementId: id,
        departementCode: dept.code,
        departementLibelle: dept.libelle,
        statut,
        raison,
        reportee,
        cycleSource,
      });
    }

    // 9. Persister (upsert par [versionId, departementId])
    for (const dto of departementsDto) {
      await this.prisma.impactDepartement.upsert({
        where: { versionId_departementId: { versionId, departementId: dto.departementId } },
        update: {
          statut: dto.statut,
          raison: dto.raison,
          reportee: dto.reportee,
          cycleSource: dto.cycleSource ?? null,
        },
        create: {
          versionId,
          departementId: dto.departementId,
          statut: dto.statut,
          raison: dto.raison,
          reportee: dto.reportee,
          cycleSource: dto.cycleSource ?? null,
        },
      });
    }

    // 10. Synthèse
    const impactes = departementsDto.filter((d) => d.statut === 'IMPACTE').length;
    const nonImpactes = departementsDto.filter((d) => d.statut === 'NON_IMPACTE').length;
    const reportees = departementsDto.filter((d) => d.reportee).length;

    return {
      versionId,
      versionNumero: version.numero,
      departements: departementsDto,
      resume: { impactes, nonImpactes, reportees },
    };
  }

// ============================================
// Décision de validation par département (L5-04)
// POST /versions/:id/validations
// ============================================

async submitValidation(
  versionId: string,
  dto: ValidationDepartementDto,
  userId: string,
  role: string,
  userDepartements: string[],
): Promise<ValidationResponseDto> {
  const maintenant = new Date();

  // 1. Récupération de la version (404 si absente)
  const version = await this.prisma.versionEdt.findUnique({
    where: { id: versionId },
    select: {
      id: true,
      numero: true,
      statut: true,
      cycleValidation: true,
      soumisPar: true,
    },
  });
  if (!version) {
    throw new NotFoundException(`Version "${versionId}" introuvable`);
  }

  // 2. La validation doit être ouverte sur la version
  if (version.statut !== 'EN_VALIDATION') {
    throw new BadRequestException(
      `La version n'est pas en cours de validation (statut: ${version.statut})`,
    );
  }

  // 3. Décision déjà donnée sur ce département dans ce cycle (409)
  const existante = await this.prisma.validationDepartement.findUnique({
    where: {
      versionId_departementId: {
        versionId,
        departementId: dto.departementId,
      },
    },
    select: { decision: true },
  });
  if (existante && existante.decision !== 'EN_ATTENTE') {
    throw new ConflictException(
      'Une décision a déjà été enregistrée pour ce département dans ce cycle',
    );
  }

  // 4. Le département doit être impacté
  const impact = await this.prisma.impactDepartement.findUnique({
    where: {
      versionId_departementId: {
        versionId,
        departementId: dto.departementId,
      },
    },
    select: { statut: true },
  });
  if (!impact || impact.statut !== 'IMPACTE') {
    throw new BadRequestException(
      'Le département n\'est pas impacté pour cette version',
    );
  }
    // 5. Permissions selon le rôle et la portée département
    let parAdministrateur = false;
    if (role === 'ADMINISTRATEUR') {
      parAdministrateur = true;
    } else if (role === 'RESPONSABLE_DEPARTEMENT') {
      if (!userDepartements.includes(dto.departementId)) {
        throw new ForbiddenException(
          'Vous ne pouvez décider que pour votre propre département',
        );
      }
    } else {
      throw new ForbiddenException(
        'Rôle non autorisé à prendre une décision de validation',
      );
    }

    // 6. Séparation des tâches : le soumetteur du cycle ne peut pas décider
    const submitterId = version.soumisPar ?? undefined;
    this.policyService.checkSegregationOfDuties(submitterId, userId);

    // 7. Motif obligatoire en cas de rejet
    if (dto.decision === 'REJETE' && !dto.motif) {
      throw new UnprocessableEntityException(
        'Un motif est obligatoire en cas de rejet',
      );
    }

    const cycle = version.cycleValidation ?? 0;

    // 8. Créer / mettre à jour la décision + gestion de l'unanimité (transaction)
    const validation = await this.prisma.$transaction(async (tx) => {
      const v = await tx.validationDepartement.upsert({
        where: {
          versionId_departementId: {
            versionId,
            departementId: dto.departementId,
          },
        },
        update: {
          decision: dto.decision,
          motif: dto.motif ?? null,
          userId,
          parAdministrateur,
          at: maintenant,
          impact: impact.statut,
          cycle,
        },
        create: {
          versionId,
          departementId: dto.departementId,
          cycle,
          impact: impact.statut,
          decision: dto.decision,
          motif: dto.motif ?? null,
          userId,
          parAdministrateur,
          at: maintenant,
        },
        select: {
          id: true,
          decision: true,
          motif: true,
          parAdministrateur: true,
          at: true,
        },
      });

      // 9. Unanimité : tous les départements impactés ont-ils décidé ?
      const departementsImpactes = await tx.impactDepartement.findMany({
        where: { versionId },
        select: { departementId: true },
      });
      const totalImpactes = departementsImpactes.length;

      const decidees = await tx.validationDepartement.count({
        where: {
          versionId,
          decision: { not: 'EN_ATTENTE' },
        },
      });

      let nouveauStatutVersion: string | undefined;
      let unanimous = false;

      if (decidees === totalImpactes && totalImpactes > 0) {
        unanimous = true;
        const rejects = await tx.validationDepartement.count({
          where: { versionId, decision: 'REJETE' },
        });
        const cible: VersionStatut = rejects > 0 ? 'REJETE' : 'VALIDE';

        await tx.versionEdt.update({
          where: { id: versionId },
          data: { statut: cible },
        });

        await tx.workflowTransition.create({
          data: {
            versionId,
            de: 'EN_VALIDATION',
            vers: cible,
            userId,
            automatique: true,
            commentaire: `Unanimité atteinte : ${cible}`,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'VERSION_VALIDATION_UNANIMITE',
            objetType: 'VersionEdt',
            objetId: version.id,
            versionId: version.id,
            userId,
            at: maintenant,
            motif: cible === 'REJETE' ? 'AU_MOINS_UN_REJET' : 'TOUS_APPROUVE',
            details: { statutAvant: 'EN_VALIDATION', statutApres: cible },
          },
        });

        nouveauStatutVersion = cible;
      }

      return { v, nouveauStatutVersion, unanimous };
    });

    // 10. Retour DTO
    return {
      versionId: version.id,
      versionNumero: version.numero,
      departementId: dto.departementId,
      decision: validation.v.decision,
      motif: validation.v.motif ?? undefined,
      parAdministrateur: validation.v.parAdministrateur,
      at: validation.v.at ?? undefined,
      unanimiteAtteinte: validation.unanimous,
      nouveauStatutVersion: validation.nouveauStatutVersion,
    };
  }

  // ============================================
  // Publication atomique de version (L5-07)
  // POST /versions/{id}/publish
  // ============================================

  async publishVersion(
    versionId: string,
    userId: string,
  ): Promise<PublishResponseDto> {
    // Vérifications préliminaires hors transaction (lecture seule)
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        numero: true,
        statut: true,
        semestreId: true,
        revision: true,
      },
    });
    if (!version) {
      throw new NotFoundException(`Version \\\"${versionId}\\\" introuvable`);
    }
    if (version.statut !== 'VALIDE') {
      throw new ConflictException({
        code: 'INVALID_STATE_FOR_PUBLISH',
        message: `Impossible de publier une version dont le statut est "${version.statut}" (VALIDE requis)`,
      });
    }
    const nbPublie = await this.prisma.versionEdt.count({
      where: {
        semestreId: version.semestreId,
        id: { not: versionId },
        statut: 'PUBLIE' as VersionStatut,
      },
    });
    if (nbPublie > 0) {
      throw new ConflictException({
        code: 'ALREADY_PUBLISHED',
        message: 'Une version est déjà publiée pour ce semestre',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const maintenant = new Date();
      const impactDepartements = await tx.impactDepartement.findMany({
        where: { versionId },
        select: { departementId: true },
      });
      const deptsImpactes = impactDepartements.map((d) => d.departementId);
      const validations = await tx.validationDepartement.findMany({
        where: { versionId },
        select: { departementId: true, decision: true },
      });
      const decisionsParDept = new Map(
        validations.map((v) => [v.departementId, v.decision as string]),
      );
      for (const deptId of deptsImpactes) {
        const decision = decisionsParDept.get(deptId);
        if (decision !== 'APPROUVE') {
          throw new ConflictException({
            code: 'VALIDATION_INCOMPLETE',
            message: `Le département ${deptId} n'a pas encore approuvé la version`,
          });
        }
      }
      const conflitsBloquants = await tx.conflit.count({
        where: {
          versionId,
          severite: 'BLOQUANT' as ConflitSeverite,
          resoluLe: null,
        },
      });
      if (conflitsBloquants > 0) {
        throw new ConflictException({
          code: 'CONFLITS_BLOQUANTS',
          message: `${conflitsBloquants} conflit(s) bloquant(s) non résolu(x)`,
        });
      }
      const editLock = await tx.editLock.findUnique({
        where: { versionId },
        select: { expiresAt: true },
      });
      if (editLock && new Date(editLock.expiresAt) > maintenant) {
        throw new ConflictException({
          code: 'EDIT_LOCK_HELD',
          message: 'Un verrou d\'édition est actif sur cette version',
        });
      }
      const verrousActifs = await tx.verrouSeance.count({
        where: { versionId, leveLe: null },
      });
      if (verrousActifs > 0) {
        throw new ConflictException({
          code: 'VERROUS_SEANCES_ACTIFS',
          message: `${verrousActifs} verrou(x) de séance(x) actif(s)`,
        });
      }
      const snapshotCount = await tx.versionSnapshot.count({
        where: { versionId },
      });
      if (snapshotCount === 0) {
        throw new ConflictException({
          code: 'NO_SNAPSHOTS',
          message: 'Aucun snapshot lié à cette version (provenance manquante)',
        });
      }
      const publieExistante = await tx.versionEdt.findFirst({
        where: {
          semestreId: version.semestreId,
          id: { not: versionId },
          statut: 'PUBLIE' as VersionStatut,
        },
        select: { id: true, numero: true },
      });
      if (publieExistante) {
        await tx.versionEdt.update({
          where: { id: publieExistante.id },
          data: {
            statut: 'ARCHIVE' as VersionStatut,
            revision: { increment: 1 },
          },
        });
        await tx.workflowTransition.create({
          data: {
            versionId: publieExistante.id,
            de: 'PUBLIE',
            vers: 'ARCHIVE',
            userId,
            automatique: true,
            commentaire: `Archivée par publication de la version ${version.numero}`,
          },
        });
        await tx.auditLog.create({
          data: {
            action: 'VERSION_ARCHIVE_PAR_PUBLICATION',
            objetType: 'VersionEdt',
            objetId: publieExistante.id,
            versionId: publieExistante.id,
            userId,
            at: maintenant,
            details: {
              ancienStatut: 'PUBLIE',
              nouveauStatut: 'ARCHIVE',
              raison: 'PUBLICATION_NOUVELLE_VERSION',
              publiePar: version.id,
            },
          },
        });
      }
      const updated = await tx.versionEdt.update({
        where: { id: versionId },
        data: {
          statut: 'PUBLIE' as VersionStatut,
          revision: { increment: 1 },
        },
      });
      await tx.workflowTransition.create({
        data: {
          versionId,
          de: 'VALIDE',
          vers: 'PUBLIE',
          userId,
          automatique: false,
          commentaire: 'Publication atomique',
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'VERSION_PUBLIER',
          objetType: 'VersionEdt',
          objetId: versionId,
          versionId,
          userId,
          at: maintenant,
          details: {
            ancienStatut: 'VALIDE',
            nouveauStatut: 'PUBLIE',
            ancienneRevision: version.revision,
            nouvelleRevision: (version.revision ?? 0) + 1,
          },
        },
      });
      return {
        versionId: updated.id,
        numero: updated.numero,
        statut: 'PUBLIE' as VersionStatut,
        versionPrecedenteId: publieExistante?.id ?? null,
        versionPrecedenteNumero: publieExistante?.numero ?? null,
        at: maintenant,
      };
    });
  }

  // ============================================
  // Nouvelle révision d'une version publiée (L5-10)
  // POST /versions/{id}/new-revision
  // ============================================

  async newRevision(
    versionId: string,
    userId: string,
  ): Promise<NewRevisionResponseDto> {
    // 1. La version parente doit exister et être PUBLIE
    const parent = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      include: {
        seances: {
          include: {
            groupes: true,
            verrous: true,
          },
        },
      },
    });
    if (!parent) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }
    if (parent.statut !== 'PUBLIE') {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Impossible de créer une révision à partir d'une version dont le statut est "${parent.statut}" (PUBLIE requis)`,
      });
    }

    // 2. Numérotation : mineur + 1 (RC-04, correction manuelle)
    const ancienNumero = parent.numero;
    const parties = ancienNumero.split('.');
    const majeur = parseInt(parties[0], 10);
    const mineur = parseInt(parties[1] ?? '0', 10);
    const nouveauNumero = `${Number.isNaN(majeur) ? 1 : majeur}.${Number.isNaN(mineur) ? 0 : mineur + 1}`;

    const maintenant = new Date();

    // 3. Transaction : créer la version enfant, copier séances + verrous, historiser
    const enfant = await this.prisma.$transaction(async (tx) => {
      // a. Créer la version enfant (EDITION)
      const v = await tx.versionEdt.create({
        data: {
          semestreId: parent.semestreId,
          numero: nouveauNumero,
          statut: 'EDITION' as VersionStatut,
          parentId: parent.id,
          auteurId: userId,
          motif: `Révision de la version ${ancienNumero}`,
          revision: 0,
        },
      });

      // b. Copier les séances de la version parente
      const seanceMap = new Map<string, string>(); // ancienId -> nouvelId
      for (const s of parent.seances) {
        const nouvelle = await tx.seance.create({
          data: {
            id: randomUUID(),
            semestreId: s.semestreId,
            versionId: v.id,
            affectationKey: s.affectationKey,
            rang: s.rang,
            tag: s.tag,
            jour: s.jour,
            creneauDebutId: s.creneauDebutId,
            nbCreneaux: s.nbCreneaux,
            statut: s.statut,
            origine: s.origine,
            enseignantId: s.enseignantId,
            salleId: s.salleId,
          },
        });
        seanceMap.set(s.id, nouvelle.id);

        // c. Copier les groupes de séance
        if (s.groupes.length > 0) {
          await tx.seanceGroupe.createMany({
            data: s.groupes.map((g) => ({
              seanceId: nouvelle.id,
              groupeId: g.groupeId,
            })),
          });
        }

        // d. Copier les verrous de séance (suivent la séance, ST §4.14)
        if (s.verrous.length > 0) {
          await tx.verrouSeance.createMany({
            data: s.verrous.map((vr) => ({
              versionId: v.id,
              seanceId: nouvelle.id,
              type: vr.type,
              auteurId: userId,
              justification: vr.justification,
              leveLe: null,
              levePar: null,
            })),
          });
        }
      }

      // e. Transition de workflow PUBLIE -> EDITION
      await tx.workflowTransition.create({
        data: {
          versionId: v.id,
          de: 'PUBLIE' as VersionStatut,
          vers: 'EDITION' as VersionStatut,
          userId,
          automatique: false,
          commentaire: `Nouvelle révision de la version ${ancienNumero}`,
        },
      });

      // f. Audit
      await tx.auditLog.create({
        data: {
          action: 'VERSION_NEW_REVISION',
          objetType: 'VersionEdt',
          objetId: v.id,
          versionId: v.id,
          userId,
          at: maintenant,
          details: {
            parentId: parent.id,
            parentNumero: ancienNumero,
            nouveauNumero,
          },
        },
      });

      return v;
    });

    return {
      versionId: enfant.id,
      numero: enfant.numero,
      statut: 'EDITION' as VersionStatut,
      parentId: parent.id,
      at: maintenant,
    };
  }

  // ============================================
  // Prévisualisation avant publication (L5-08)
  // GET /versions/{id}/previsualisation-publication
  // ============================================

  async getPrevisualisationPublication(
    versionId: string,
  ): Promise<PrevisualisationPublicationDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        numero: true,
        statut: true,
        revision: true,
        semestreId: true,
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // Version précédente publiée du même semestre
    const versionPrecedente = await this.prisma.versionEdt.findFirst({
      where: {
        semestreId: version.semestreId,
        id: { not: versionId },
        statut: 'PUBLIE' as VersionStatut,
      },
      select: { id: true, numero: true },
    });

    // Départements ayant validé (APPROUVE)
    const validations = await this.prisma.validationDepartement.findMany({
      where: { versionId, decision: 'APPROUVE' },
      select: {
        departementId: true,
        userId: true,
        at: true,
        departement: {
          select: { code: true, libelle: true },
        },
      },
    });

    const departementsValides = validations.map((v) => ({
      departementId: v.departementId,
      departementCode: v.departement.code,
      departementLibelle: v.departement.libelle,
      decision: 'APPROUVE',
      userId: v.userId ?? null,
      at: v.at?.toISOString() ?? null,
    }));

    // Conflits de la version
    const conflits = await this.prisma.conflit.findMany({
      where: { versionId },
      select: {
        id: true,
        type: true,
        severite: true,
        resoluLe: true,
      },
      orderBy: [{ severite: 'desc' }, { createdAt: 'desc' }],
    });

    // Avertissements acceptés
    const avertissements = await this.prisma.avertissementAccepte.findMany({
      where: { versionId },
      select: {
        regleCode: true,
        auteurId: true,
        accepteLe: true,
      },
      orderBy: { accepteLe: 'desc' },
    });

    // Verrous de séance actifs
    const verrous = await this.prisma.verrouSeance.findMany({
      where: { versionId, leveLe: null },
      select: {
        id: true,
        type: true,
        seanceId: true,
        auteurId: true,
        creeLe: true,
      },
      orderBy: { creeLe: 'desc' },
    });

    // Provenance : génération liée et son profil
    const generation = await this.prisma.generation.findFirst({
      where: { versionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        profilGenerationVersion: true,
        perimetreHash: true,
        engineVersion: true,
        profilGeneration: {
          select: { nom: true, numero: true },
        },
      },
    });

    // Activités : séances de la version avec enseignant et salle
    const seances = await this.prisma.seance.findMany({
      where: { versionId },
      select: {
        affectationKey: true,
        enseignantId: true,
        enseignant: {
          select: { nom: true, prenom: true },
        },
        salleId: true,
        salle: {
          select: { code: true },
        },
      },
      orderBy: { affectationKey: 'asc' },
    });

    const activites = seances.map((s) => ({
      affectationKey: s.affectationKey,
      enseignantId: s.enseignantId,
      enseignantNom:
        s.enseignant != null
          ? `${s.enseignant.prenom} ${s.enseignant.nom}`
          : '',
      salleId: s.salleId ?? null,
      salleCode: s.salle?.code ?? null,
      planifiee: s.salleId != null,
    }));

    return {
      versionId: version.id,
      versionNumero: version.numero,
      statut: version.statut,
      revision: version.revision,
      versionPrecedenteId: versionPrecedente?.id ?? null,
      versionPrecedenteNumero: versionPrecedente?.numero ?? null,
      departementsValides,
      activitesModifiees: activites.length,
      conflits: conflits.map((c) => ({
        id: c.id,
        type: c.type,
        severite: c.severite,
        resoluLe: c.resoluLe?.toISOString() ?? null,
      })),
      avertissementsAcceptes: avertissements.map((a) => ({
        regleCode: a.regleCode,
        auteurId: a.auteurId,
        accepteLe: a.accepteLe.toISOString(),
      })),
      verrous: verrous.map((v) => ({
        id: v.id,
        type: v.type,
        seanceId: v.seanceId,
        auteurId: v.auteurId,
        creeLe: v.creeLe.toISOString(),
      })),
      provenance: {
        generationId: generation?.id ?? null,
        profilVersion: generation?.profilGenerationVersion
          ? String(generation.profilGenerationVersion)
          : null,
        profilNom: generation?.profilGeneration?.nom ?? null,
        perimetreHash: generation?.perimetreHash ?? null,
        engineVersion: generation?.engineVersion ?? null,
      },
      activites,
      at: new Date().toISOString(),
    };
  }

  // ============================================
  // Différence entre deux versions (L5-11)
  // GET /versions/{id}/diff?against=
  // ============================================

  async getDiff(
    versionId: string,
    againstId: string,
  ): Promise<VersionDiffResponseDto> {
    const [version, against] = await Promise.all([
      this.prisma.versionEdt.findUnique({
        where: { id: versionId },
        select: { id: true, numero: true, semestreId: true },
      }),
      this.prisma.versionEdt.findUnique({
        where: { id: againstId },
        select: { id: true, numero: true, semestreId: true },
      }),
    ]);

    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }
    if (!against) {
      throw new NotFoundException(`Version "${againstId}" introuvable`);
    }
    if (version.semestreId !== against.semestreId) {
      throw new ConflictException({
        code: 'DIFF_DIFFERENT_SEMESTRE',
        message:
          'Le diff entre deux versions nécessite qu elles appartiennent au même semestre',
      });
    }

    const [seancesGauche, seancesDroite, conflitsGauche, conflitsDroite, verrousGauche, verrousDroite] =
      await Promise.all([
        this.prisma.seance.findMany({
          where: { versionId },
          select: {
            affectationKey: true,
            rang: true,
            jour: true,
            creneauDebutId: true,
            salleId: true,
            enseignantId: true,
            statut: true,
          },
        }),
        this.prisma.seance.findMany({
          where: { versionId: againstId },
          select: {
            affectationKey: true,
            rang: true,
            jour: true,
            creneauDebutId: true,
            salleId: true,
            enseignantId: true,
            statut: true,
          },
        }),
        this.prisma.conflit.findMany({
          where: { versionId },
          select: { signature: true, resoluLe: true },
        }),
        this.prisma.conflit.findMany({
          where: { versionId: againstId },
          select: { signature: true, resoluLe: true },
        }),
        this.prisma.verrouSeance.count({
          where: { versionId, leveLe: null },
        }),
        this.prisma.verrouSeance.count({
          where: { versionId: againstId, leveLe: null },
        }),
      ]);

    const cle = (s: { affectationKey: string; rang: number }) =>
      `${s.affectationKey}#${s.rang}`;

    const mapGauche = new Map<string, typeof seancesGauche[number]>();
    for (const s of seancesGauche) {
      mapGauche.set(cle(s), s);
    }
    const mapDroite = new Map<string, typeof seancesDroite[number]>();
    for (const s of seancesDroite) {
      mapDroite.set(cle(s), s);
    }

    const toutesCles = new Set([...mapGauche.keys(), ...mapDroite.keys()]);

    const changements: ChangementSeanceDto[] = [];
    const seulesAGauche: string[] = [];
    const seulesADroite: string[] = [];
    let seancesIdentiques = 0;
    let seancesDifferentes = 0;

    for (const key of toutesCles) {
      const g = mapGauche.get(key);
      const d = mapDroite.get(key);

      if (!g) {
        seulesADroite.push(key);
        continue;
      }
      if (!d) {
        seulesAGauche.push(key);
        continue;
      }

      const identique =
        g.jour === d.jour &&
        g.creneauDebutId === d.creneauDebutId &&
        g.salleId === d.salleId &&
        g.enseignantId === d.enseignantId &&
        g.statut === d.statut;

      if (identique) {
        seancesIdentiques += 1;
      } else {
        seancesDifferentes += 1;
        let type: ChangementSeanceDto['type'];
        if (g.jour !== d.jour || g.creneauDebutId !== d.creneauDebutId) {
          type = 'DEPLACE';
        } else if (g.salleId !== d.salleId) {
          type = 'SALLE_MODIFIEE';
        } else if (g.enseignantId !== d.enseignantId) {
          type = 'ENSEIGNANT_MODIFIE';
        } else {
          type = 'STATUT_MODIFIE';
        }
        changements.push({
          cle: key,
          type,
          gauche: {
            jour: g.jour ?? undefined,
            creneauDebutId: g.creneauDebutId ?? undefined,
            salleId: g.salleId ?? undefined,
            enseignantId: g.enseignantId ?? undefined,
            statut: g.statut ?? undefined,
          },
          droite: {
            jour: d.jour ?? undefined,
            creneauDebutId: d.creneauDebutId ?? undefined,
            salleId: d.salleId ?? undefined,
            enseignantId: d.enseignantId ?? undefined,
            statut: d.statut ?? undefined,
          },
        });
      }
    }

    const signaturesGauche = new Set(
      conflitsGauche.filter((c) => c.resoluLe === null).map((c) => c.signature),
    );
    const signaturesDroite = new Set(
      conflitsDroite.filter((c) => c.resoluLe === null).map((c) => c.signature),
    );

    const conflitsApparus = [...signaturesGauche].filter(
      (sig) => !signaturesDroite.has(sig),
    ).length;
    const conflitsDisparus = [...signaturesDroite].filter(
      (sig) => !signaturesGauche.has(sig),
    ).length;

    return {
      versionId: version.id,
      versionNumero: version.numero,
      againstId: against.id,
      againstNumero: against.numero,
      seancesIdentiques,
      seancesDifferentes,
      changements,
      seulesAGauche,
      seulesADroite,
      conflits: { apparus: conflitsApparus, disparus: conflitsDisparus },
      verrous: {
        respectesGauche: verrousGauche,
        respectesDroite: verrousDroite,
      },
    };
  }

  // ============================================
  // Chaîne de provenance d'une version (L5-12)
  // GET /versions/{id}/provenance
  // ============================================

  async getProvenance(
    versionId: string,
  ): Promise<VersionProvenanceResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        numero: true,
        statut: true,
        generationSourceId: true,
        generationSource: {
          select: {
            id: true,
            statut: true,
            mode: true,
            engine: true,
            engineVersion: true,
            perimetreHash: true,
            createdAt: true,
            profil: {
              select: {
                id: true,
                code: true,
                numero: true,
                libelle: true,
                engineVersion: true,
                builderVersion: true,
              },
            },
            fichierMoteur: {
              select: {
                id: true,
                engine: true,
                engineVersion: true,
                builderVersion: true,
                storageKey: true,
                sha256: true,
              },
            },
          },
        },
        snapshots: {
          select: {
            snapshot: {
              select: {
                id: true,
                repartitionId: true,
                revision: true,
                contentHash: true,
                parAdministrateur: true,
                validatedAt: true,
                chargeRuleSet: {
                  select: {
                    id: true,
                    code: true,
                    libelle: true,
                  },
                },
              },
            },
          },
        },
        seances: {
          select: {
            id: true,
            affectationKey: true,
            jour: true,
            creneauDebutId: true,
            salleId: true,
            enseignantId: true,
            statut: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version \"${versionId}\" introuvable`);
    }

    const v = version as any;
    const generationSource = v.generationSource;
    const origine =
      generationSource != null
        ? ('GENERATION' as const)
        : ('MANUELLE' as const);

    const generationDto =
      generationSource != null
        ? {
            id: generationSource.id,
            statut: generationSource.statut,
            mode: generationSource.mode,
            engine: generationSource.engine,
            engineVersion: generationSource.engineVersion,
            perimetreHash: generationSource.perimetreHash,
            creeLe: generationSource.createdAt.toISOString(),
            profil:
              generationSource.profil != null
                ? {
                    id: generationSource.profil.id,
                    code: generationSource.profil.code,
                    numero: generationSource.profil.numero,
                    libelle: generationSource.profil.libelle,
                    engineVersion: generationSource.profil.engineVersion,
                    builderVersion: generationSource.profil.builderVersion,
                  }
                : null,
          }
        : null;

    const snapshotsDto = v.snapshots.map((vs: any) => ({
      id: vs.snapshot.id,
      repartitionId: vs.snapshot.repartitionId,
      revision: vs.snapshot.revision,
      contentHash: vs.snapshot.contentHash,
      parAdministrateur: vs.snapshot.parAdministrateur ?? null,
      validatedAt: vs.snapshot.validatedAt.toISOString(),
      chargeRuleSet: {
        id: vs.snapshot.chargeRuleSet.id,
        code: vs.snapshot.chargeRuleSet.code,
        libelle: vs.snapshot.chargeRuleSet.libelle,
      },
    }));

    const chargeRuleSetMap = new Map<string, ChargeRuleSetProvenanceDto>();
    for (const s of snapshotsDto) {
      chargeRuleSetMap.set(s.chargeRuleSet.id, s.chargeRuleSet);
    }
    const chargeRuleSets = [...chargeRuleSetMap.values()];

    const seancesOrigineDto =
      origine === 'MANUELLE'
        ? v.seances.map((s: any) => ({
            id: s.id,
            affectationKey: s.affectationKey,
            jour: s.jour ?? null,
            creneauDebutId: s.creneauDebutId ?? null,
            salleId: s.salleId ?? null,
            enseignantId: s.enseignantId ?? null,
            statut: s.statut,
          }))
        : undefined;

    const adaptateurDto = generationSource?.fichierMoteur != null
      ? {
          nom: generationSource.fichierMoteur.engine,
          version: generationSource.fichierMoteur.engineVersion,
          params: undefined,
        }
      : undefined;

    return {
      versionId: v.id,
      versionNumero: String(v.numero),
      statut: v.statut,
      origine,
      generation: generationDto,
      snapshots: snapshotsDto,
      chargeRuleSet:
        origine === 'MANUELLE' && chargeRuleSets.length > 0
          ? chargeRuleSets[0]
          : undefined,
      chargeRuleSets,
      adaptateur: adaptateurDto,
      seancesOrigine: seancesOrigineDto,
      at: new Date().toISOString(),
    };
  }
}
