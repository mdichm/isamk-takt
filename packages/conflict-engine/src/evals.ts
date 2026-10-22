// SPDX-License-Identifier: AGPL-3.0-only
// evals.ts — Évaluateurs de contraintes souples (ST §4.7, §0.3 RC-07).
// Paquet pur, sans dépendance NestJS ni Prisma.

import {
  type ConflictContext,
  type SeanceInput,
  type PlacementCandidat,
} from './validate-placement.js';

// ============================================================================
// Types
// ============================================================================

export type EvalStatut = 'EVALUÉ' | 'NON_EVALUE';

export interface EvalDetail {
  critere: string;
  sousScore: number | null;
  statut: EvalStatut;
  message: string;
  poids: number;
}

export interface EvalResult {
  score: number; // 0-100, NaN si aucun critère évaluable
  details: EvalDetail[];
}

export interface SoftConstraints {
  heuresMinParJour?: number;
  heuresMaxParJour?: number;
  heuresConsecutivesMin?: number;
  heuresConsecutivesMax?: number;
  plagesAEviter?: string[];
  poidsHeuresConsecutives?: number;
  poidsCreuxGroupes?: number;
  poidsCreuxEnseignants?: number;
  poidsEquilibre?: number;
  poidsPlagesAEviter?: number;
}

export interface SoftDelta {
  delta: number;
  avant: EvalResult;
  apres: EvalResult;
  details: EvalDetail[];
}

// ============================================================================
// Constantes et helpers
// ============================================================================

const POIDS_DEFAUT = 1;

function poids(c: SoftConstraints, cle: string, def = POIDS_DEFAUT): number {
  return (c as Record<string, number | undefined>)[cle] ?? def;
}

function clamp0100(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

function slotJour(slotKey: string): string {
  return slotKey.split('|')[0];
}

function slotCreneau(slotKey: string): string {
  return slotKey.split('|')[1] ?? '';
}

function creneauxEnseignant(ctx: ConflictContext, enseignantId: string): string[] {
  const res: string[] = [];
  for (const sk of ctx.occ.keys()) {
    const slot = ctx.occ.get(sk);
    if (slot?.ens.has(enseignantId)) res.push(sk);
  }
  return res.sort();
}

function creneauxGroupe(ctx: ConflictContext, groupeId: string): string[] {
  const res: string[] = [];
  for (const sk of ctx.occ.keys()) {
    const slot = ctx.occ.get(sk);
    if (slot?.groupe.has(groupeId)) res.push(sk);
  }
  return res.sort();
}

function parJour(slots: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const sk of slots) {
    const j = slotJour(sk);
    const arr = m.get(j) ?? [];
    arr.push(sk);
    m.set(j, arr);
  }
  return m;
}

function compterTrous(creneaux: Set<string>): number {
  if (creneaux.size === 0) return 0;
  const ordonnes = Array.from(creneaux).sort();
  let trous = 0;
  for (let i = 1; i < ordonnes.length; i++) {
    const prev = parseInt(ordonnes[i - 1], 10);
    const curr = parseInt(ordonnes[i], 10);
    if (
      !Number.isNaN(prev) &&
      !Number.isNaN(curr) &&
      curr > prev + 1
    ) {
      trous += curr - prev - 1;
    }
  }
  return trous;
}

// ============================================================================
// Évaluateur : Plages à éviter
// ============================================================================

function evalPlagesAEviter(
  ctx: ConflictContext,
  placement: PlacementCandidat,
  nbCreneaux: number,
  c: SoftConstraints,
): EvalDetail {
  const poidsC = poids(c, 'poidsPlagesAEviter');
  if (!c.plagesAEviter || c.plagesAEviter.length === 0) {
    return {
      critere: 'plagesAEviter',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Aucune plage à éviter configurée',
      poids: poidsC,
    };
  }

  const slots = ctx.grille.consecutifs(
    placement.jour,
    placement.creneauDebut,
    nbCreneaux,
  );
  if (!slots) {
    return {
      critere: 'plagesAEviter',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Créneaux indisponibles pour ce placement',
      poids: poidsC,
    };
  }

  const plageTouchee = slots.find((sk) => c.plagesAEviter!.includes(sk));
  if (plageTouchee) {
    return {
      critere: 'plagesAEviter',
      sousScore: 0,
      statut: 'EVALUÉ',
      message: `Placement dans une plage à éviter (${plageTouchee})`,
      poids: poidsC,
    };
  }

  return {
    critere: 'plagesAEviter',
    sousScore: 100,
    statut: 'EVALUÉ',
    message: 'Aucune plage à éviter impactée',
    poids: poidsC,
  };
}

// ============================================================================
// Évaluateur : Heures consécutives
// ============================================================================

function evalHeuresConsecutives(
  ctx: ConflictContext,
  seance: SeanceInput,
  placement: PlacementCandidat,
  c: SoftConstraints,
): EvalDetail {
  const poidsC = poids(c, 'poidsHeuresConsecutives');
  const min = c.heuresConsecutivesMin;
  const max = c.heuresConsecutivesMax;

  if (min === undefined && max === undefined) {
    return {
      critere: 'heuresConsecutives',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Aucune borne heures consécutives configurée',
      poids: poidsC,
    };
  }

  const slots = ctx.grille.consecutifs(
    placement.jour,
    placement.creneauDebut,
    seance.nbCreneaux,
  );
  if (!slots) {
    return {
      critere: 'heuresConsecutives',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Créneaux indisponibles',
      poids: poidsC,
    };
  }

  const slotsConsecutifs = slots.length === seance.nbCreneaux;
  let score = 100;
  const messages: string[] = [];

  if (!slotsConsecutifs) {
    score = 0;
    messages.push('Créneaux non consécutifs');
  }

  const nbHeures = seance.nbCreneaux * 0.5;
  if (min !== undefined && nbHeures < min) {
    score = Math.min(score, (nbHeures / min) * 100);
    messages.push(`Séquence ${nbHeures}h < minimum ${min}h`);
  }
  if (max !== undefined && nbHeures > max) {
    score = Math.min(score, (max / nbHeures) * 100);
    messages.push(`Séquence ${nbHeures}h > maximum ${max}h`);
  }

  return {
    critere: 'heuresConsecutives',
    sousScore: clamp0100(score),
    statut: 'EVALUÉ',
    message: messages.length === 0 ? 'Bornes respectées' : messages.join('; '),
    poids: poidsC,
  };
}

// ============================================================================
// Évaluateur : Creux (groupes et enseignants)
// ============================================================================

function evalCreux(
  ctx: ConflictContext,
  seance: SeanceInput,
  placement: PlacementCandidat,
  c: SoftConstraints,
): EvalDetail {
  const poidsGroupes = poids(c, 'poidsCreuxGroupes');
  const poidsEns = poids(c, 'poidsCreuxEnseignants');

  const aCreuxGroupes =
    c.heuresMinParJour !== undefined || c.heuresMaxParJour !== undefined;
  const aCreuxEns =
    c.heuresMinParJour !== undefined || c.heuresMaxParJour !== undefined;

  if (!aCreuxGroupes && !aCreuxEns) {
    return {
      critere: 'creux',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Aucune contrainte de creux configurée',
      poids: (poidsGroupes + poidsEns) / 2,
    };
  }

  const slots = ctx.grille.consecutifs(
    placement.jour,
    placement.creneauDebut,
    seance.nbCreneaux,
  );
  if (!slots) {
    return {
      critere: 'creux',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Créneaux indisponibles',
      poids: (poidsGroupes + poidsEns) / 2,
    };
  }

  const jour = placement.jour;

  let creuxGroupesTotal = 0;
  let creuxGroupesMax = 0;
  for (const gId of seance.groupes) {
    const creneauxG = creneauxGroupe(ctx, gId);
    const parJ = parJour(creneauxG);
    const creneauxJour = parJ.get(jour) ?? [];
    const creneauxAvecNouveau = new Set(
      creneauxJour.map((sk) => slotCreneau(sk)),
    );
    for (const sk of slots) {
      creneauxAvecNouveau.add(slotCreneau(sk));
    }

    const trous = compterTrous(creneauxAvecNouveau);
    creuxGroupesTotal += trous;
    const creneauxJourDispo = ctx.creneaux
      ? Array.from(ctx.creneaux.values()).filter(
          (creneau) => creneau.jour === jour && !creneau.estPause,
        ).length
      : slots.length;
    creuxGroupesMax += Math.max(
      0,
      creneauxJourDispo - creneauxAvecNouveau.size,
    );
  }

  let creuxEnsTotal = 0;
  let creuxEnsMax = 0;
  if (seance.enseignantId) {
    const creneauxE = creneauxEnseignant(ctx, seance.enseignantId);
    const parJ = parJour(creneauxE);
    const creneauxJour = parJ.get(jour) ?? [];
    const creneauxAvecNouveau = new Set(
      creneauxJour.map((sk) => slotCreneau(sk)),
    );
    for (const sk of slots) {
      creneauxAvecNouveau.add(slotCreneau(sk));
    }

    const trous = compterTrous(creneauxAvecNouveau);
    creuxEnsTotal += trous;
    const creneauxJourDispo = ctx.creneaux
      ? Array.from(ctx.creneaux.values()).filter(
          (creneau) => creneau.jour === jour && !creneau.estPause,
        ).length
      : slots.length;
    creuxEnsMax += Math.max(
      0,
      creneauxJourDispo - creneauxAvecNouveau.size,
    );
  }

  const scoreGroupes =
    creuxGroupesMax === 0
      ? 100
      : clamp0100(100 * (1 - creuxGroupesTotal / creuxGroupesMax));
  const scoreEns =
    creuxEnsMax === 0
      ? 100
      : clamp0100(100 * (1 - creuxEnsTotal / creuxEnsMax));

  const nbCriteres =
    (aCreuxGroupes ? 1 : 0) +
    (aCreuxEns && seance.enseignantId ? 1 : 0);
  const score =
    nbCriteres === 0
      ? null
      : ((aCreuxGroupes ? scoreGroupes : 0) +
          (aCreuxEns && seance.enseignantId ? scoreEns : 0)) /
        nbCriteres;

  return {
    critere: 'creux',
    sousScore: score ?? null,
    statut: score === null ? 'NON_EVALUE' : 'EVALUÉ',
    message: `Creux groupes=${creuxGroupesTotal}, enseignant=${creuxEnsTotal}`,
    poids: (poidsGroupes + poidsEns) / 2,
  };
}

// ============================================================================
// Évaluateur : Équilibre journalier
// ============================================================================

function evalEquilibre(
  ctx: ConflictContext,
  seance: SeanceInput,
  placement: PlacementCandidat,
  c: SoftConstraints,
): EvalDetail {
  const poidsC = poids(c, 'poidsEquilibre');

  const slots = ctx.grille.consecutifs(
    placement.jour,
    placement.creneauDebut,
    seance.nbCreneaux,
  );
  if (!slots) {
    return {
      critere: 'equilibre',
      sousScore: null,
      statut: 'NON_EVALUE',
      message: 'Créneaux indisponibles',
      poids: poidsC,
    };
  }

  const jour = placement.jour;
  const nbHeures = seance.nbCreneaux * 0.5;

  const heuresEnsParJour = new Map<string, number>();
  const heuresGroupesParJour = new Map<string, Map<string, number>>();

  for (const sk of ctx.occ.keys()) {
    const skJour = slotJour(sk);
    const slot = ctx.occ.get(sk);
    if (!slot) continue;

    slot.ens.forEach((occ) => {
      if (occ.seanceId === seance.id && skJour === jour) return;
      heuresEnsParJour.set(
        skJour,
        (heuresEnsParJour.get(skJour) ?? 0) + 0.5,
      );
    });
    slot.groupe.forEach((occ) => {
      if (occ.seanceId === seance.id && skJour === jour) return;
      for (const gId of seance.groupes) {
        if (!heuresGroupesParJour.has(gId)) {
          heuresGroupesParJour.set(gId, new Map());
        }
        heuresGroupesParJour.get(gId)!.set(
          skJour,
          (heuresGroupesParJour.get(gId)!.get(skJour) ?? 0) + 0.5,
        );
      }
    });
  }

  heuresEnsParJour.set(jour, (heuresEnsParJour.get(jour) ?? 0) + nbHeures);
  for (const gId of seance.groupes) {
    if (!heuresGroupesParJour.has(gId)) {
      heuresGroupesParJour.set(gId, new Map());
    }
    heuresGroupesParJour.get(gId)!.set(
      jour,
      (heuresGroupesParJour.get(gId)!.get(jour) ?? 0) + nbHeures,
    );
  }

  let scoreEns = 100;
  let evalEns = false;
  const valsEns = Array.from(heuresEnsParJour.values());
  if (valsEns.length > 1) {
    evalEns = true;
    const moyEns = valsEns.reduce((a, b) => a + b, 0) / valsEns.length;
    const ecartTypeEns = Math.sqrt(
      valsEns.reduce((a, b) => a + (b - moyEns) ** 2, 0) / valsEns.length,
    );
    const seuilEns = Math.max(moyEns * 0.25, 0.5);
    scoreEns = clamp0100(100 * (1 - ecartTypeEns / seuilEns));
  }

  let scoreGroupes = 100;
  let nbGroupesEvalues = 0;
  let evalGroupes = false;
  for (const gId of seance.groupes) {
    const m = heuresGroupesParJour.get(gId);
    if (!m) continue;
    const vals = Array.from(m.values());
    if (vals.length <= 1) continue;
    evalGroupes = true;
    nbGroupesEvalues++;
    const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
    const ecartType = Math.sqrt(
      vals.reduce((a, b) => a + (b - moy) ** 2, 0) / vals.length,
    );
    const seuil = Math.max(moy * 0.25, 0.5);
    scoreGroupes += clamp0100(100 * (1 - ecartType / seuil));
  }
  if (nbGroupesEvalues > 0) {
    scoreGroupes /= nbGroupesEvalues;
  }

  const aEval = evalEns || evalGroupes;
  const score = aEval ? (scoreEns + scoreGroupes) / 2 : null;

  return {
    critere: 'equilibre',
    sousScore: score ?? null,
    statut: aEval ? 'EVALUÉ' : 'NON_EVALUE',
    message: aEval
      ? `Écart-type E=${scoreEns.toFixed(0)}, G=${scoreGroupes.toFixed(0)}`
      : 'Pas assez de jours pour calculer l\'équilibre',
    poids: poidsC,
  };
}

// ============================================================================
// Score souple pour un placement
// ============================================================================

export function computeSoftScore(
  ctx: ConflictContext,
  seance: SeanceInput,
  placement: PlacementCandidat,
  c: SoftConstraints,
): EvalResult {
  const details: EvalDetail[] = [
    evalPlagesAEviter(ctx, placement, seance.nbCreneaux, c),
    evalHeuresConsecutives(ctx, seance, placement, c),
    evalCreux(ctx, seance, placement, c),
    evalEquilibre(ctx, seance, placement, c),
  ];

  const evalues = details.filter((d) => d.statut === 'EVALUÉ');
  let score: number;
  if (evalues.length === 0) {
    score = NaN;
  } else {
    const sommePonderee = evalues.reduce(
      (acc, d) => acc + (d.sousScore ?? 0) * d.poids,
      0,
    );
    const sommePoids = evalues.reduce((acc, d) => acc + d.poids, 0);
    score = clamp0100(sommePonderee / sommePoids);
  }

  return { score, details };
}

// ============================================================================
// Delta de score entre ancien et nouveau placement
// ============================================================================

export function computeSoftDelta(
  ctx: ConflictContext,
  seance: SeanceInput,
  oldPlacement: PlacementCandidat,
  newPlacement: PlacementCandidat,
  c: SoftConstraints,
): SoftDelta {
  const avant = computeSoftScore(ctx, seance, oldPlacement, c);
  const apres = computeSoftScore(ctx, seance, newPlacement, c);

  let delta: number;
  if (Number.isNaN(avant.score) && Number.isNaN(apres.score)) {
    delta = NaN;
  } else if (Number.isNaN(avant.score)) {
    delta = apres.score;
  } else if (Number.isNaN(apres.score)) {
    delta = -avant.score;
  } else {
    delta = apres.score - avant.score;
  }

  return { delta, avant, apres, details: apres.details };
}