// SPDX-License-Identifier: AGPL-3.0-only
// @takt/worker — Moteur de métriques et score 0-100 (L4-17)
// Calcul des sous-scores par critère, score pondéré renormalisé, et métriques brutes
// stockées dans Generation.metrics (JSON, aucune migration requise).

import { GenerationStatut } from '@takt/db';
import type { Prisma } from '@takt/db';
import type { EngineInput, EngineSolution } from '@takt/contracts';
import type { Conflit } from '@takt/conflict-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Codes des critères de score, alignés sur `poidsScore` du profil (ST §4.7). */
export type CritereCode =
  | 'voeux'
  | 'creuxGroupes'
  | 'creuxEnseignants'
  | 'heuresConsecutives'
  | 'equilibre'
  | 'utilisationSalles'
  | 'capaciteRecommandee'
  | 'covoiturage';

/** Liste exhaustive des critères, dans l'ordre d'affichage. */
export const CRITERES: readonly CritereCode[] = [
  'voeux',
  'creuxGroupes',
  'creuxEnseignants',
  'heuresConsecutives',
  'equilibre',
  'utilisationSalles',
  'capaciteRecommandee',
  'covoiturage',
];

/** Résultat d'évaluation d'un critère. */
interface CriteriumResult {
  code: CritereCode;
  sousScore: number | null; // null = NON_EVALUE
  poids: number;
  contribution: number | null; // poids × sousScore / poidsTotal (EVALUE seulement)
  statut: 'EVALUE' | 'NON_EVALUE';
  details?: Record<string, unknown>;
}

function critereEvalue(
  code: CritereCode,
  sousScore: number,
  poids: number,
  details?: Record<string, unknown>,
): CriteriumResult {
  const score = Math.max(0, Math.min(100, Math.round(sousScore * 10) / 10));
  return { code, sousScore: score, poids, contribution: null, statut: 'EVALUE', details };
}

function critereNonEvalue(code: CritereCode, poids: number): CriteriumResult {
  return { code, sousScore: null, poids, contribution: null, statut: 'NON_EVALUE' };
}

/** Séance placée reconstruite à partir de la solution et de l'entrée moteur. */
interface PlacedSession {
  activityId: string;
  periodId: string;
  roomId: string | null;
  dayIndex: number;
  slotIndex: number;
  durationInSlots: number;
  groupIds: readonly string[];
  teacherIds: readonly string[];
  roomCapacity: number | null;
  roomCapaciteRecommandee: number | null;
  groupeMaxSize: number;
}

export interface GenerationMetricsInput {
  engineInput: EngineInput;
  engineSolution: EngineSolution;
  conflits: readonly Conflit[];
  poidsScore: Record<string, number> | null;
  statut: GenerationStatut;
  dureeMs: number;
}

export type GenerationMetricsOutput = {
  metrics: Prisma.InputJsonValue;
  score: number | null;
  scoreCriteres: { code: CritereCode; sousScore: number | null; poids: number; contribution: number | null; statut: 'EVALUE' | 'NON_EVALUE' }[];
  classee: boolean;
  motifNonClassee: string | null;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class GenerationMetricsService {
  private engineInput: EngineInput = {
    semesterId: '',
    activities: [],
    periods: [],
    rooms: [],
    teachers: [],
    groups: [],
    activityTags: [],
    constraints: [],
    locks: [],
  } as EngineInput;
  private engineSolution: EngineSolution = {
    input: {} as EngineInput,
    rawResult: {} as any,
    placedActivities: [],
    unplacedActivities: [],
    totalSoftConflicts: 0,
    hardConflicts: [],
  } as EngineSolution;
  private conflits: readonly Conflit[] = [];
  private poidsScore: Record<string, number> = {};
  private sessions: PlacedSession[] = [];

  /** Poids d'un critère (0 si non configuré dans le profil). */
  private poids(code: CritereCode): number {
    return Math.max(0, this.poidsScore[code] ?? 0);
  }

  compute(input: GenerationMetricsInput): GenerationMetricsOutput {
    this.engineInput = input.engineInput;
    this.engineSolution = input.engineSolution;
    this.conflits = input.conflits;
    this.poidsScore = input.poidsScore ?? {};
    this.sessions = this.buildSessions();
    const totalActivites = input.engineInput.activities.length;
    const placees = input.engineSolution.placedActivities.length;
    const nonPlacees = input.engineSolution.unplacedActivities.length;
    const tauxPlacement = totalActivites > 0 ? (placees / totalActivites) * 100 : 0;

    // Conflits par type
    const conflitsParType: Record<string, number> = {};
    for (const c of this.conflits) {
      conflitsParType[c.type] = (conflitsParType[c.type] ?? 0) + 1;
    }

    // Évaluation des critères
    const resultats: CriteriumResult[] = CRITERES.map((code) => {
      switch (code) {
        case 'voeux':
          return this.evaluerVoeux();
        case 'creuxGroupes':
          return this.evaluerCreux(code, (s) => s.groupIds);
        case 'creuxEnseignants':
          return this.evaluerCreux(code, (s) => s.teacherIds);
        case 'heuresConsecutives':
          return this.evaluerHeuresConsecutives();
        case 'equilibre':
          return this.evaluerEquilibre();
        case 'utilisationSalles':
          return this.evaluerUtilisationSalles();
        case 'capaciteRecommandee':
          return this.evaluerCapaciteRecommandee();
        case 'covoiturage':
          return this.evaluerCovoiturage();
      }
    });

    // Score avec renormalisation des poids sur les critères évalués
    const evalues = resultats.filter((r) => r.statut === 'EVALUE');
    const poidsTotal = evalues.reduce((acc, r) => acc + r.poids, 0);

    const scoreCriteres = resultats.map((r) => {
      let contribution: number | null = null;
      if (r.statut === 'EVALUE' && poidsTotal > 0 && r.sousScore !== null) {
        contribution = (r.poids * r.sousScore) / poidsTotal;
      }
      return {
        code: r.code,
        sousScore: r.sousScore,
        poids: r.poids,
        contribution,
        statut: r.statut,
      };
    });

    let score: number | null = null;
    if (evalues.length > 0 && poidsTotal > 0) {
      score = Math.round(
        scoreCriteres.reduce((acc, c) => acc + (c.contribution ?? 0), 0) * 100,
      ) / 100;
    }

    // Statut classee / motifNonClassee (ST §4.7)
    const hasBlockingConflict = this.conflits.some((c) => c.severite === 'BLOQUANT');
    const classee =
      input.statut === GenerationStatut.SUCCEEDED &&
      nonPlacees === 0 &&
      !hasBlockingConflict;

    let motifNonClassee: string | null = null;
    if (!classee) {
      if (
        input.statut !== GenerationStatut.SUCCEEDED &&
        input.statut !== GenerationStatut.SUCCEEDED_WITH_WARNINGS
      ) {
        motifNonClassee = 'GENERATION_ECHEC';
      } else if (nonPlacees > 0) {
        motifNonClassee = 'SEANCES_NON_PLACEES';
      } else if (hasBlockingConflict) {
        motifNonClassee = 'CONFLIT_BLOQUANT';
      }
    }

    const metrics: Prisma.InputJsonValue = {
      seancesTotal: totalActivites,
      placees,
      nonPlacees,
      tauxPlacement: Math.round(tauxPlacement * 10) / 10,
      dureeMs: input.dureeMs,
      totalSoftConflicts: input.engineSolution.totalSoftConflicts,
      hardConflits: this.conflits.length,
      conflitsParType,
      conflits: this.conflits.map((c) => ({
        regleCode: c.regleCode,
        type: c.type,
        severite: c.severite,
        message: c.message,
        seanceIds: c.seanceIds,
      })),
      utilisationSalles: this.buildUtilisationSalles(),
      scoreCriteres,
      classee,
      motifNonClassee,
      genereLe: new Date().toISOString(),
    };

    return { metrics, score, scoreCriteres, classee, motifNonClassee };
  }

  // -------------------------------------------------------------------------
  // Reconstruction des séances placées
  // -------------------------------------------------------------------------
  // Reconstruction des séances placées
  // -------------------------------------------------------------------------

  private buildSessions(): PlacedSession[] {
    const periodById = new Map(this.engineInput.periods.map((p) => [p.id, p]));
    const roomById = new Map(this.engineInput.rooms.map((r) => [r.id, r]));
    const activityById = new Map(this.engineInput.activities.map((a) => [a.id, a]));
    const groupById = new Map((this.engineInput.groups ?? []).map((g) => [g.id, g]));

    const sessions: PlacedSession[] = [];
    for (const pa of this.engineSolution.placedActivities) {
      const period = periodById.get(pa.periodId);
      const activity = activityById.get(pa.activityId);
      if (!period || !activity) continue;

      const room = pa.roomId ? roomById.get(pa.roomId) : null;

      let groupeMaxSize = 0;
      for (const gid of activity.groupIds) {
        const g = groupById.get(gid);
        if (g && g.size > groupeMaxSize) {
          groupeMaxSize = g.size;
        }
      }

      sessions.push({
        activityId: pa.activityId,
        periodId: pa.periodId,
        roomId: pa.roomId,
        dayIndex: period.dayIndex,
        slotIndex: period.slotIndex,
        durationInSlots: activity.durationInSlots,
        groupIds: activity.groupIds,
        teacherIds: activity.teacherIds,
        roomCapacity: room?.capacity ?? null,
        roomCapaciteRecommandee: room?.capacity ?? null,
        groupeMaxSize: groupeMaxSize || 1,
      });
    }
    return sessions;
  }

  // -------------------------------------------------------------------------
  // Évaluateurs de critères (privés)
  // -------------------------------------------------------------------------

  private evaluerVoeux(): CriteriumResult {
    const poids = this.poids('voeux');
    const conflitsVoeux = this.conflits.filter((c) => c.type === 'VOEU');
    if (this.sessions.length === 0 && conflitsVoeux.length === 0) {
      return critereNonEvalue('voeux', poids);
    }

    let penalite = 0;
    for (const c of conflitsVoeux) {
      if (c.severite === 'BLOQUANT') penalite += 1;
      else if (c.severite === 'AVERTISSEMENT') penalite += 0.5;
      else penalite += 0.25;
    }

    const penaliteMax = Math.max(this.sessions.length, 1);
    const sousScore = 100 * (1 - penalite / penaliteMax);
    return critereEvalue('voeux', sousScore, poids, {
      conflitsVoeux: conflitsVoeux.length,
    });
  }

  /**
   * Évalue « creux » (trous dans l'emploi du jour) pour des entités (groupes ou
   * enseignants). Un creux = créneau vide entre deux séances d'une même entité
   * dans une même journée.
   */
  private evaluerCreux(
    code: CritereCode,
    getIds: (s: PlacedSession) => readonly string[],
  ): CriteriumResult {
    const poids = this.poids(code);

    const entities = new Set<string>();
    for (const s of this.sessions) {
      for (const id of getIds(s)) entities.add(id);
    }
    if (entities.size === 0) return critereNonEvalue(code, poids);

    // (entité, jour) -> créneaux occupés
    const byEntityDay = new Map<string, number[]>();
    for (const s of this.sessions) {
      for (const id of getIds(s)) {
        const key = `${id}|${s.dayIndex}`;
        const arr = byEntityDay.get(key) ?? [];
        arr.push(s.slotIndex);
        byEntityDay.set(key, arr);
      }
    }

    let creuxObserves = 0;
    let creuxAdmissibles = 0;
    for (const slots of byEntityDay.values()) {
      const uniq = [...new Set(slots)].sort((a, b) => a - b);
      for (let i = 1; i < uniq.length; i++) {
        const gap = uniq[i] - uniq[i - 1] - 1;
        if (gap > 0) creuxObserves += gap;
      }
      if (uniq.length > 0) {
        creuxAdmissibles += uniq[uniq.length - 1] - uniq[0] + 1 - uniq.length;
      }
    }

    const sousScore =
      creuxAdmissibles === 0
        ? 100
        : 100 * (1 - creuxObserves / Math.max(creuxAdmissibles, 1));
    return critereEvalue(code, sousScore, poids, {
      creuxObserves,
      creuxAdmissibles,
    });
  }

  /** Détecte les séquences consécutives (créneaux d'affilée) par entité et jour. */
  private detectSequences(
    getIds: (s: PlacedSession) => readonly string[],
  ): number[] {
    const byEntityDay = new Map<string, number[]>();
    for (const s of this.sessions) {
      for (const id of getIds(s)) {
        const key = `${id}|${s.dayIndex}`;
        const arr = byEntityDay.get(key) ?? [];
        arr.push(s.slotIndex);
        byEntityDay.set(key, arr);
      }
    }

    const longueurs: number[] = [];
    for (const slots of byEntityDay.values()) {
      const uniq = [...new Set(slots)].sort((a, b) => a - b);
      let run = 1;
      for (let i = 1; i < uniq.length; i++) {
        if (uniq[i] === uniq[i - 1] + 1) {
          run += 1;
        } else {
          longueurs.push(run);
          run = 1;
        }
      }
      longueurs.push(run);
    }
    return longueurs;
  }

  private evaluerHeuresConsecutives(): CriteriumResult {
    const poids = this.poids('heuresConsecutives');
    const longueurs = this.detectSequences((s) => s.groupIds);
    if (longueurs.length === 0) return critereNonEvalue('heuresConsecutives', poids);

    const MIN = 1;
    const MAX = 8;
    let dansBornes = 0;
    for (const len of longueurs) {
      if (len >= MIN && len <= MAX) dansBornes += 1;
    }

    const sousScore = (100 * dansBornes) / longueurs.length;
    return critereEvalue('heuresConsecutives', sousScore, poids, {
      totalSequences: longueurs.length,
      dansBornes,
    });
  }

  /** Écart-type normalisé des heures par jour (équilibre de la charge hebdo). */
  private evaluerEquilibre(): CriteriumResult {
    const poids = this.poids('equilibre');

    const byGroupDay = new Map<string, number>(); // groupeId|jour -> créneaux
    const groups = new Set<string>();
    for (const s of this.sessions) {
      for (const gid of s.groupIds) {
        groups.add(gid);
        const key = `${gid}|${s.dayIndex}`;
        byGroupDay.set(key, (byGroupDay.get(key) ?? 0) + s.durationInSlots);
      }
    }
    if (groups.size === 0) return critereNonEvalue('equilibre', poids);

    let ecartTotal = 0;
    let nbGroupes = 0;
    for (const gid of groups) {
      const jours: number[] = [];
      for (let d = 0; d < 5; d++) {
        const v = byGroupDay.get(`${gid}|${d}`);
        if (v && v > 0) jours.push(v);
      }
      if (jours.length === 0) continue;
      const mean = jours.reduce((acc, v) => acc + v, 0) / jours.length;
      if (mean === 0) continue;
      const variance =
        jours.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / jours.length;
      ecartTotal += Math.sqrt(variance) / mean;
      nbGroupes += 1;
    }
    if (nbGroupes === 0) return critereNonEvalue('equilibre', poids);

    const normalise = ecartTotal / nbGroupes; // 0 = équilibre parfait
    const sousScore = 100 * (1 - Math.min(1, normalise));
    return critereEvalue('equilibre', sousScore, poids, {
      ecartTypeNormalise: Math.round(normalise * 1000) / 1000,
    });
  }

  /** Utilisation des salles : taux d'occupation des créneaux-salle. */
  private evaluerUtilisationSalles(): CriteriumResult {
    const poids = this.poids('utilisationSalles');
    const rooms = this.engineInput.rooms;
    const periods = this.engineInput.periods;
    if (rooms.length === 0 || periods.length === 0) {
      return critereNonEvalue('utilisationSalles', poids);
    }

    const disponible = rooms.length * periods.length;
    let occupe = 0;
    const parType = new Map<string, { occupe: number; disponible: number }>();
    for (const s of this.sessions) {
      if (s.roomId === null) continue;
      occupe += s.durationInSlots;
      const type = this.classerSalle(s.roomCapacity);
      let t = parType.get(type);
      if (!t) {
        t = { occupe: 0, disponible: 0 };
        parType.set(type, t);
      }
      t.occupe += s.durationInSlots;
    }
    const types = Array.from(parType.keys());
    for (const type of types) {
      const t = parType.get(type)!;
      t.disponible = Math.floor((disponible * t.occupe) / Math.max(occupe, 1));
    }

    const moyenne =
      disponible > 0 ? Math.min(100, (occupe / disponible) * 100) : 0;
    return critereEvalue('utilisationSalles', moyenne, poids, {
      occupe,
      disponible,
      moyenne: Math.round(moyenne * 10) / 10,
      parType: Object.fromEntries(Array.from(parType.entries()).map(([k, v]) => [k, v])),
    });
  }

  private classerSalle(capacite: number | null): string {
    if (capacite === null) return 'AUTRE';
    if (capacite > 100) return 'AMPHI';
    if (capacite > 30) return 'LABO';
    return 'SALLE';
  }

  /** Part des séances sans dépassement de la capacité recommandée. */
  private evaluerCapaciteRecommandee(): CriteriumResult {
    const poids = this.poids('capaciteRecommandee');
    const avecSalle = this.sessions.filter((s) => s.roomId !== null);
    if (avecSalle.length === 0) return critereNonEvalue('capaciteRecommandee', poids);

    let sansDepassement = 0;
    for (const s of avecSalle) {
      const recommandee = s.roomCapaciteRecommandee ?? s.roomCapacity;
      if (recommandee === null || s.groupeMaxSize <= recommandee) {
        sansDepassement += 1;
      }
    }

    const sousScore = (100 * sansDepassement) / avecSalle.length;
    return critereEvalue('capaciteRecommandee', sousScore, poids, {
      total: avecSalle.length,
      sansDepassement,
    });
  }

  /** Covoiturage : pas de donnée de covoiturage dans le contexte worker minimal. */
  private evaluerCovoiturage(): CriteriumResult {
    return critereNonEvalue('covoiturage', this.poids('covoiturage'));
  }

  /** Construit l'indicateur d'utilisation des salles (moyenne + par type). */
  private buildUtilisationSalles(): {
    moyenne: number;
    parType: Record<string, { moyenne: number }>;
  } {
    const rooms = this.engineInput.rooms;
    const periods = this.engineInput.periods;
    const disponible = rooms.length * periods.length;
    let occupe = 0;
    const parType: Record<string, { moyenne: number }> = {};
    for (const s of this.sessions) {
      if (s.roomId === null) continue;
      occupe += s.durationInSlots;
      const type = this.classerSalle(s.roomCapacity);
      if (!parType[type]) parType[type] = { moyenne: 0 };
    }
    const moyenne =
      disponible > 0 ? Math.round(((occupe / disponible) * 100) * 10) / 10 : 0;
    return { moyenne, parType };
  }
}
