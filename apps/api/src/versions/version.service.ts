// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de création de version (L3-09)
import { Injectable, NotFoundException, BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { Inject } from '@nestjs/common';
import type { PgBoss as PgBossType } from 'pg-boss';
import type { VersionStatut, GenerationStatut, GenerationMode } from '@takt/db';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import type { VersionResponseDto } from './dto/version-response.dto.js';
import type { CompletudeResponseDto } from './dto/completude-response.dto.js';
import type { PerimetreResponseDto } from './dto/perimetre-response.dto.js';
import type { CreateGenerationDto } from './dto/create-generation.dto.js';
import type { GenerationResponseDto } from './dto/generation-response.dto.js';
import type { ImportGenerationResponseDto } from './dto/import-generation-response.dto.js';
import { Prisma as PrismaValue } from '@takt/db';
import { mkdtemp, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

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

    const seances = await this.prisma.seance.findMany({
      where: { versionId },
      select: { affectationKey: true, statut: true },
    });

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
      select: { id: true, semestreId: true, numero: true, nom: true },
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
          id: randomUUID(),
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

    // 11. Enfiler le job de génération sur pg-boss (L4-15)
    await this.boss.send('generation', {
      generationId: generation.id,
      semestreId: generation.semestreId,
    }, {
      retryDelay: 30_000,
      retryBackoff: true,
      expireInSeconds: 600,
    });

    // 12. Retour DTO
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
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // 2. La version doit être en statut EDITION pour accepter une importation
    if (version.statut !== 'EDITION') {
      throw new BadRequestException({
        code: 'VERSION_NOT_EDITION',
        message: `La version "${versionId}" n'est pas en statut EDITION (actuel: ${version.statut})`,
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
        message: `Une génération est déjà en cours sur la version "${versionId}" (id: ${generationEnCours.id}, statut: ${generationEnCours.statut})`,
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
}
