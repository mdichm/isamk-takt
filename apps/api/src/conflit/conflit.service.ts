// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de recalcul et de consultation des conflits (L3-17)
// Construit le ConflictContext depuis la base, appelle le conflict-engine pur,
// et persiste les résultats dans la table Conflit.

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  computeConflicts,
  impactedSeances,
  type ConflictContext,
  type Conflit,
  type SeanceInput,
  type SeancePlacement,
} from '@takt/conflict-engine';
import {
  OccupancyIndex,
  GroupeClosure,
  IndispoSet,
  Reqs,
  SnapshotIndex,
  VerrouIndex,
} from '@takt/conflict-engine';
import { ConflitType, ConflitSeverite } from '@takt/db';
import { ConflitResponseDto } from './dto/conflit-response.dto.js';
import { OccupancyCacheService } from './occupancy-cache.service.js';

interface SeanceAvecDonnees {
  id: string;
  versionId: string;
  semestreId: string;
  enseignantId: string | null;
  salleId: string | null;
  jour: string | null;
  creneauDebutId: string | null;
  nbCreneaux: number;
  statut: string;
  tag: string | null;
  moduleId: string | null;
  typeEnseignementId: string | null;
  volumePlace: number | null;
  groupes: { groupeId: string }[];
  occupations: {
    jour: string;
    creneauId: string;
    ressourceType: string;
    ressourceId: string;
  }[];
}

function toSeanceInput(s: SeanceAvecDonnees): SeanceInput {
  return {
    id: s.id,
    enseignantId: s.enseignantId ?? '',
    salleId: s.salleId ?? '',
    groupes: s.groupes.map((g) => g.groupeId),
    nbCreneaux: s.nbCreneaux,
    tag: s.tag ?? '',
    moduleId: s.moduleId ?? '',
    typeEnseignementId: s.typeEnseignementId ?? '',
    statut: s.statut as 'PLACEE' | 'NON_PLACEE',
    versionId: s.versionId,
    volumePlace: s.volumePlace ?? 0,
  };
}

function buildGrille(
  creneaux: Map<string, { estPause: boolean; ordre: number; jour: string }>,
) {
  return {
    consecutifs: (
      jour: string,
      creneauDebut: string,
      nb: number,
    ): string[] | null => {
      const debut = creneaux.get(creneauDebut);
      if (!debut || debut.jour !== jour) return null;

      const slots: string[] = [];
      let ordreCourant = debut.ordre;
      for (let i = 0; i < nb; i++) {
        let trouve:
          | { estPause: boolean; ordre: number; jour: string }
          | undefined;
        for (const [, c] of creneaux) {
          if (c.jour === jour && c.ordre === ordreCourant) {
            trouve = c;
            break;
          }
        }
        if (!trouve) return null;
        if (trouve.estPause) return null;
        slots.push(`${jour}|${trouve.ordre}`);
        ordreCourant++;
      }
      return slots;
    },
  };
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class ConflitService {
  private readonly logger = new Logger(ConflitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly occupancyCache: OccupancyCacheService,
  ) {}

  async recomputeConflits(versionId: string): Promise<ConflitResponseDto[]> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, semestreId: true, revision: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const seancesRaw = await this.prisma.seance.findMany({
      where: { versionId },
      include: {
        seanceGroupes: { select: { groupeId: true } },
        occupations: {
          select: {
            jour: true,
            creneauId: true,
            ressourceType: true,
            ressourceId: true,
          },
        },
      },
    });

    const ctx = await this.buildConflictContext(seancesRaw, version);

    const seancesAvecPlacement: SeancePlacement[] = seancesRaw.map((s) => {
      const seance = toSeanceInput(s as unknown as SeanceAvecDonnees);
      let jour = 'LUNDI';
      let creneauDebut = 'c1';
      const salle = s.salleId ?? '';

      const occ = (s as unknown as SeanceAvecDonnees).occupations.find(
        (o) => o.ressourceType === 'SALLE',
      );
      if (occ) {
        jour = occ.jour;
        creneauDebut = occ.creneauId;
      }

      return { seance, jour, creneauDebut, salle };
    });

    const nouveauxConflits = computeConflicts(seancesAvecPlacement, ctx);

    const existants = await this.prisma.conflit.findMany({
      where: { versionId },
      select: { id: true, signature: true, resoluLe: true },
    });

    const nouvellesSignatures = new Set(
      nouveauxConflits.map((c) => c.signature),
    );
    const existantesSignatures = new Set(
      existants.map((c) => c.signature),
    );

    const aResoudre = existants.filter(
      (c) =>
        !nouvellesSignatures.has(c.signature) && c.resoluLe === null,
    );
    if (aResoudre.length > 0) {
      await this.prisma.conflit.updateMany({
        where: { id: { in: aResoudre.map((c) => c.id) } },
        data: { resoluLe: new Date() },
      });
    }

    const aInserer = nouveauxConflits.filter(
      (c) => !existantesSignatures.has(c.signature),
    );
    if (aInserer.length > 0) {
      await this.prisma.conflit.createMany({
        data: aInserer.map((c) => ({
          id: c.signature,
          versionId,
          regleCode: c.regleCode,
          type: c.type as ConflitType,
          severite: c.severite as ConflitSeverite,
          objetType: c.objetType,
          objetId: c.objetId,
          seanceIds: c.seanceIds,
          message: c.message,
          signature: c.signature,
          details: c.details as any,
          resoluLe: null,
        })),
        skipDuplicates: true,
      });
    }

    // --- L3-35 : avertissements vœux (type VOEU, severite AVERTISSEMENT) ---
    const vœuxViolations = await this.detectVoeuxViolations(versionId, version.semestreId);
    if (vœuxViolations.length > 0) {
      const existants = await this.prisma.conflit.findMany({
        where: { versionId, type: 'VOEU' },
        select: { id: true, signature: true },
      });
      const existantesSignatures = new Set(existants.map((c) => c.signature));
      const aInserer = vœuxViolations.filter((c) => !existantesSignatures.has(c.signature));
      if (aInserer.length > 0) {
        await this.prisma.conflit.createMany({
          data: aInserer.map((c) => ({
            id: c.signature,
            versionId,
            regleCode: c.regleCode,
            type: c.type as ConflitType,
            severite: c.severite as ConflitSeverite,
            objetType: c.objetType,
            objetId: c.objetId,
            seanceIds: c.seanceIds,
            message: c.message,
            signature: c.signature,
            details: c.details as any,
            resoluLe: null,
          })),
          skipDuplicates: true,
        });
      }
      // Marquer resoluLe pour les violations disparues
      const nouvellesSignatures = new Set(vœuxViolations.map((c) => c.signature));
      const aResoudre = existants.filter((c) => !nouvellesSignatures.has(c.signature));
      if (aResoudre.length > 0) {
        await this.prisma.conflit.updateMany({
          where: { id: { in: aResoudre.map((c) => c.id) } },
          data: { resoluLe: new Date() },
        });
      }
    }

    return this.getConflits(versionId);
  }

  /** L3-35 : detecte les vœux non respectes et renvoie des enregistrements Conflit. */
  private async detectVoeuxViolations(
    versionId: string,
    semestreId: string,
  ): Promise<Array<{
    regleCode: string;
    type: ConflitType;
    severite: ConflitSeverite;
    objetType: string;
    objetId: string;
    seanceIds: string[];
    message: string;
    signature: string;
    details?: Record<string, unknown>;
  }>> {
    const violations: Array<{
      regleCode: string;
      type: ConflitType;
      severite: ConflitSeverite;
      objetType: string;
      objetId: string;
      seanceIds: string[];
      message: string;
      signature: string;
      details?: Record<string, unknown>;
    }> = [];

    const voeux = await this.prisma.contrainteInstance.findMany({
      where: { semestreId, nature: 'VOEU', actif: true },
      include: { definition: true },
    });

    if (voeux.length === 0) return violations;

    // Recuperer les occupations de l'edition pour verifier les affectations enseignant
    const occupations = await this.prisma.occupation.findMany({
      where: { versionId },
      select: { jour: true, creneauId: true, ressourceType: true, ressourceId: true, seanceId: true },
    });

    // Indexer les occupations par enseignant (ressourceType = ENSEIGNANT)
    const occByEns = new Map<string, { jour: string; creneauId: string; seanceId: string }[]>();
    for (const o of occupations) {
      if (o.ressourceType === 'ENSEIGNANT') {
        const list = occByEns.get(o.ressourceId) ?? [];
        list.push({ jour: o.jour, creneauId: o.creneauId, seanceId: o.seanceId });
        occByEns.set(o.ressourceId, list);
      }
    }

    // Recuperer les creneaux pour connaitre le jour de chaque creneau
    const creneaux = await this.prisma.creneau.findMany({
      where: { semestreId },
      select: { id: true, jour: true, ordre: true },
    });
    const creneauJour = new Map<string, string>();
    for (const c of creneaux) {
      creneauJour.set(c.id, c.jour);
    }

    for (const v of voeux) {
      if (!v.enseignantId) continue;
      const code = v.definition.code as string;
      const params = v.params as Record<string, unknown>;
      const enseignantOccs = occByEns.get(v.enseignantId) ?? [];

      if (code === 'TEACHER_AVOID_SLOT') {
        const slotKey = params.slotKey as string | undefined;
        if (slotKey) {
          const [jour, creneau] = slotKey.split('|');
          const hit = enseignantOccs.find(
            (o) => o.jour === jour && o.creneauId === creneau,
          );
          if (hit) {
            violations.push({
              regleCode: 'VOEU_AVOID_SLOT',
              type: 'VOEU',
              severite: 'AVERTISSEMENT',
              objetType: 'ENSEIGNANT',
              objetId: v.enseignantId,
              seanceIds: [hit.seanceId],
              message: `Vœu non respecté : l'enseignant est affecté au créneau à éviter ${slotKey}`,
              signature: `voeu|${versionId}|${v.enseignantId}|TEACHER_AVOID_SLOT|${slotKey}`,
              details: { vowId: v.id, code, slotKey },
            });
          }
        }
      } else if (code === 'TEACHER_DAY_OFF_WISH') {
        const jourWish = params.jour as string | undefined;
        if (jourWish) {
          const hit = enseignantOccs.find((o) => o.jour === jourWish);
          if (hit) {
            violations.push({
              regleCode: 'VOEU_DAY_OFF',
              type: 'VOEU',
              severite: 'AVERTISSEMENT',
              objetType: 'ENSEIGNANT',
              objetId: v.enseignantId,
              seanceIds: [hit.seanceId],
              message: `Vœu non respecté : l'enseignant est affecté le jour de congé souhaité ${jourWish}`,
              signature: `voeu|${versionId}|${v.enseignantId}|TEACHER_DAY_OFF_WISH|${jourWish}`,
              details: { vowId: v.id, code, jour: jourWish },
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Recalcule les conflits de toutes les versions non publiées (ni PUBLIE, ni ARCHIVE).
   * Si semestreId est fourni, seules les versions de ce semestre sont traitées.
   * Appelé après modification d'un référentiel (indisponibilité, capacité de salle, effectif de groupe).
   */
  async recalculerConflitsSemestre(semestreId?: string): Promise<void> {
    const where: Record<string, unknown> = {
      statut: { notIn: ['PUBLIE', 'ARCHIVE'] },
    };
    if (semestreId) {
      where.semestreId = semestreId;
    }

    const versions = await this.prisma.versionEdt.findMany({
      where,
      select: { id: true },
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const version of versions) {
      await this.recomputeConflits(version.id);
    }
  }

  async getConflits(versionId: string): Promise<ConflitResponseDto[]> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const conflits = await this.prisma.conflit.findMany({
      where: { versionId, resoluLe: null },
      orderBy: { createdAt: 'desc' },
    });

    return conflits.map((c) => ({
      id: c.id,
      regleCode: c.regleCode,
      type: c.type,
      severite: c.severite,
      objetType: c.objetType,
      objetId: c.objetId,
      seanceIds: c.seanceIds,
      message: c.message,
      signature: c.signature,
      details: c.details as unknown as Record<string, unknown> | undefined,
      resoluLe: c.resoluLe ?? undefined,
      createdAt: c.createdAt,
    }));
  }

  async getConflictContext(versionId: string): Promise<ConflictContext> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, semestreId: true, revision: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const seancesRaw = await this.prisma.seance.findMany({
      where: { versionId },
      include: {
        seanceGroupes: { select: { groupeId: true } },
        occupations: {
          select: {
            jour: true,
            creneauId: true,
            ressourceType: true,
            ressourceId: true,
          },
        },
      },
    });

    return this.buildConflictContext(seancesRaw, version);
  }

  private async buildConflictContext(
    seancesRaw: any[],
    version: { id: string; semestreId: string; revision: number },
  ): Promise<ConflictContext> {
    const semestreId = version.semestreId;

    const occupations = await this.prisma.occupation.findMany({
      where: { versionId: version.id },
    });
    const creneauxRaw = await this.prisma.creneau.findMany({
      where: { semestreId },
    });
    const indisponibilites = await this.prisma.indisponibilite.findMany({
      where: { semestreId },
    });
    const salles = await this.prisma.salle.findMany();
    const groupes = await this.prisma.groupe.findMany({
      where: { semestreId },
      include: { enfants: { select: { id: true } } },
    });

    const occ = this.occupancyCache.getOrBuild(
      version.id,
      version.revision,
      () => {
        const idx = new OccupancyIndex();
        idx.build(
          occupations.map((o) => ({
            seanceId: o.seanceId,
            jour: o.jour,
            creneauId: o.creneauId,
            ressourceType: o.ressourceType,
            ressourceId: o.ressourceId,
          })),
        );
        return idx;
      },
    );

    const creneauxMap = new Map<
      string,
      {
        estPause: boolean;
        ordre: number;
        jour: string;
        heureDebutMinutes: number;
      }
    >();
    for (const c of creneauxRaw) {
      const h = c.heureDebut ? c.heureDebut.getHours() * 60 + c.heureDebut.getMinutes() : 0;
      creneauxMap.set(c.id, {
        estPause: c.estPause,
        ordre: c.ordre,
        jour: c.jour,
        heureDebutMinutes: h,
      });
    }

    const indispo = new IndispoSet();
    for (const ind of indisponibilites) {
      if (ind.enseignantId) {
        indispo.add('ENSEIGNANT', ind.enseignantId, ind.jour, ind.ordre);
      }
      if (ind.salleId) {
        indispo.add('SALLE', ind.salleId, ind.jour, ind.ordre);
      }
    }

    const sallesMap = new Map<
      string,
      { id: string; capaciteMax: number; capaciteRecommandee?: number }
    >();
    const salleEquipements = new Map<string, string[]>();
    const salleTags = new Map<string, string[]>();

    for (const s of salles) {
      sallesMap.set(s.id, {
        id: s.id,
        capaciteMax: s.capaciteMax,
        capaciteRecommandee: s.capaciteRecommandee ?? undefined,
      });
      salleEquipements.set(s.id, []);
      salleTags.set(s.id, []);
    }

    const reqs = new Reqs();
    const moduleTypePairs = new Set<string>();
    for (const s of seancesRaw) {
      if (s.moduleId && s.typeEnseignementId) {
        moduleTypePairs.add(`${s.moduleId}|${s.typeEnseignementId}`);
      }
    }
    const exigencesMap = new Map<string, {
      equipementsObligatoires: string[];
      equipementsSouhaites: string[];
    }>();
    for (const pair of moduleTypePairs) {
      const [moduleId, typeEnseignementId] = pair.split('|');
      const exigences = await this.prisma.exigenceEquipement.findMany({
        where: { moduleId, typeEnseignementId },
      });
      const equipementsObligatoires: string[] = [];
      const equipementsSouhaites: string[] = [];
      for (const e of exigences) {
        if (e.niveau === 'OBLIGATOIRE') {
          equipementsObligatoires.push(e.equipementId);
        } else {
          equipementsSouhaites.push(e.equipementId);
        }
      }
      exigencesMap.set(pair, {
        equipementsObligatoires,
        equipementsSouhaites,
      });
    }
    for (const s of seancesRaw) {
      if (s.moduleId && s.typeEnseignementId) {
        const pair = `${s.moduleId}|${s.typeEnseignementId}`;
        const ex = exigencesMap.get(pair);
        if (ex) {
          reqs.set(s.id, {
            equipementsObligatoires: ex.equipementsObligatoires,
            equipementsSouhaites: ex.equipementsSouhaites,
          });
        }
      }
    }

    const versionSnapshots = await this.prisma.versionSnapshot.findMany({
      where: { versionId: version.id },
      select: { snapshotId: true },
    });
    const snapshotIds = versionSnapshots.map((vs) => vs.snapshotId);
    const snapshotAffectations =
      snapshotIds.length > 0
        ? await this.prisma.snapshotAffectation.findMany({
            where: { snapshotId: { in: snapshotIds } },
          })
        : [];

    const snapshot = new SnapshotIndex();
    for (const sa of snapshotAffectations) {
      if (!sa.groupeId) continue;
      const existing = snapshot.get(
        sa.groupeId,
        sa.moduleId,
        sa.typeEnseignementId,
      );
      if (existing) {
        existing.enseignantsAutorises.push(sa.enseignantId);
      } else {
        snapshot.set(sa.groupeId, sa.moduleId, sa.typeEnseignementId, {
          enseignantsAutorises: [sa.enseignantId],
          volumeAttendu: sa.volumeHebdoMinutes,
          dureeCreneaux: sa.dureeMinutes,
        });
      }
    }

    const verrous = new VerrouIndex();

    const groupeEffectifs = new Map<string, number>();
    for (const g of groupes) {
      groupeEffectifs.set(g.id, g.effectif);
    }

    const groupeClosure = new GroupeClosure(
      groupes.map((g) => ({
        id: g.id,
        parentId: g.parentId ?? null,
        enfants: Array.isArray(g.enfants)
          ? (g.enfants as any[]).map((e: any) => e.id)
          : [],
      })),
    );

    const groupesCovoiturageRaw = await this.prisma.groupeCovoiturage.findMany({
      where: { semestreId },
    });
    const covoiturageGroupes = new Map<string, {
      membres: string[];
      margeMinutes: number;
      joursCommunsMin: number;
      strict: boolean;
    }>();
    for (const g of groupesCovoiturageRaw) {
      covoiturageGroupes.set(g.id, {
        membres: g.enseignantIds,
        margeMinutes: g.margeMinutes,
        joursCommunsMin: g.joursCommunsMin,
        strict: g.strict,
      });
    }

    return {
      versionId: version.id,
      grille: buildGrille(creneauxMap),
      occ,
      indispo,
      reqs,
      snapshot,
      verrous,
      salles: sallesMap,
      salleEquipements,
      salleTags,
      creneaux: creneauxMap,
      groupeEffectifs,
      covoiturageGroupes,
      groupeClosure,
    };
  }
}
