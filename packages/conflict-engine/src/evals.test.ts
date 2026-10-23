// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires des évaluateurs de contraintes souples (L3-27).
import { describe, it, expect } from 'vitest';
import {
  computeSoftScore,
  computeSoftDelta,
  type ConflictContext,
  type SeanceInput,
  type PlacementCandidat,
  type SoftConstraints,
} from './index.js';
import { OccupancyIndex } from './occupancy-index.js';
import { IndispoSet } from './indispo-set.js';
import { Reqs } from './reqs.js';
import { SnapshotIndex } from './snapshot-index.js';
import { VerrouIndex } from './verrou-index.js';

function makeCtx(
  overrides: Partial<ConflictContext> = {},
): ConflictContext {
  const salles = new Map<string, { id: string; capaciteMax: number }>([
    ['r1', { id: 'r1', capaciteMax: 30 }],
    ['r2', { id: 'r2', capaciteMax: 100 }],
  ]);
  const creneaux = new Map<string, { estPause: boolean; ordre: number; jour: string; heureDebutMinutes: number }>([
    ['c1', { estPause: false, ordre: 1, jour: 'LUNDI', heureDebutMinutes: 480 }],
    ['c2', { estPause: false, ordre: 2, jour: 'LUNDI', heureDebutMinutes: 540 }],
    ['c3', { estPause: false, ordre: 3, jour: 'LUNDI', heureDebutMinutes: 600 }],
    ['c4', { estPause: false, ordre: 4, jour: 'LUNDI', heureDebutMinutes: 660 }],
    ['c5', { estPause: false, ordre: 5, jour: 'LUNDI', heureDebutMinutes: 720 }],
    ['c6', { estPause: false, ordre: 6, jour: 'LUNDI', heureDebutMinutes: 780 }],
  ]);
  const grille = {
    consecutifs: (
      jour: string,
      creneauDebut: string,
      nb: number,
    ): string[] | null => {
      const start = parseInt(creneauDebut.replace('c', ''), 10);
      const slots: string[] = [];
      for (let i = 0; i < nb; i++) {
        slots.push(`${jour}|c${start + i}`);
      }
      return slots;
    },
  };
  return {
    versionId: 'v1',
    grille,
    occ: new OccupancyIndex(),
    indispo: new IndispoSet(),
    reqs: new Reqs(),
    snapshot: new SnapshotIndex(),
    verrous: new VerrouIndex(),
    salles,
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux,
    groupeEffectifs: new Map([['g1', 20], ['g2', 20]]),
    covoiturageGroupes: new Map(),
    ...overrides,
  };
}

function makeSeance(
  overrides: Partial<SeanceInput> = {},
): SeanceInput {
  return {
    id: 's1',
    enseignantId: 'e1',
    salleId: 'r1',
    groupes: ['g1'],
    nbCreneaux: 2,
    tag: 'CM',
    moduleId: 'm1',
    typeEnseignementId: 't1',
    statut: 'PLACEE',
    versionId: 'v1',
    ...overrides,
  };
}

function makePlacement(
  overrides: Partial<PlacementCandidat> = {},
): PlacementCandidat {
  return {
    jour: 'LUNDI',
    creneauDebut: 'c1',
    salle: 'r1',
    ...overrides,
  };
}

function contraintesCompletes(): SoftConstraints {
  return {
    heuresConsecutivesMin: 1,
    heuresConsecutivesMax: 4,
    plagesAEviter: ['LUNDI|c6'],
    poidsPlagesAEviter: 2,
    poidsHeuresConsecutives: 2,
    poidsCreuxGroupes: 1,
    poidsCreuxEnseignants: 1,
    poidsEquilibre: 1,
  };
}

// ============================================================================
// computeSoftScore
// ============================================================================

describe('computeSoftScore', () => {
  it('tous les critères NON_EVALUE quand aucune contrainte configurée', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const placement = makePlacement();
    const c: SoftConstraints = {};

    const r = computeSoftScore(ctx, seance, placement, c);

    expect(r.details.every((d) => d.statut === 'NON_EVALUE')).toBe(true);
    expect(Number.isNaN(r.score)).toBe(true);
  });

  it('plages à éviter : score 0 si placement dans une plage', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const placement = makePlacement({ creneauDebut: 'c5' });
    const c = contraintesCompletes();

    const r = computeSoftScore(ctx, seance, placement, c);
    const plage = r.details.find((d) => d.critere === 'plagesAEviter');
    expect(plage?.statut).toBe('EVALUÉ');
    expect(plage?.sousScore).toBe(0);
  });

  it('plages à éviter : score 100 si pas de plage touchée', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const placement = makePlacement({ creneauDebut: 'c1' });
    const c = contraintesCompletes();

    const r = computeSoftScore(ctx, seance, placement, c);
    const plage = r.details.find((d) => d.critere === 'plagesAEviter');
    expect(plage?.sousScore).toBe(100);
  });

  it('heures consécutives : bornes respectées', () => {
    const ctx = makeCtx();
    const seance = makeSeance({ nbCreneaux: 2 });
    const placement = makePlacement({ creneauDebut: 'c1' });
    const c = {
      heuresConsecutivesMin: 1,
      heuresConsecutivesMax: 4,
    };

    const r = computeSoftScore(ctx, seance, placement, c);
    const hc = r.details.find((d) => d.critere === 'heuresConsecutives');
    expect(hc?.statut).toBe('EVALUÉ');
    expect(hc?.sousScore).toBe(100);
  });

  it('heures consécutives : NON_EVALUE si aucune borne', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const placement = makePlacement();
    const c: SoftConstraints = {};

    const r = computeSoftScore(ctx, seance, placement, c);
    const hc = r.details.find((d) => d.critere === 'heuresConsecutives');
    expect(hc?.statut).toBe('NON_EVALUE');
  });

  it('score global : moyenne pondérée des critères évalués', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const placement = makePlacement({ creneauDebut: 'c1' });
    const c = contraintesCompletes();

    const r = computeSoftScore(ctx, seance, placement, c);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.details.length).toBe(4);
  });
});

// ============================================================================
// computeSoftDelta
// ============================================================================

describe('computeSoftDelta', () => {
  it('delta positif quand le nouveau placement est meilleur', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const oldPlacement = makePlacement({ creneauDebut: 'c5' });
    const newPlacement = makePlacement({ creneauDebut: 'c1' });
    const c = contraintesCompletes();

    const d = computeSoftDelta(ctx, seance, oldPlacement, newPlacement, c);
    expect(d.delta).toBeGreaterThan(0);
    expect(d.avant.score).toBeLessThan(d.apres.score);
  });

  it('delta NaN quand aucun critère évaluable', () => {
    const ctx = makeCtx();
    const seance = makeSeance();
    const c: SoftConstraints = {};

    const d = computeSoftDelta(
      ctx,
      seance,
      makePlacement(),
      makePlacement(),
      c,
    );
    expect(Number.isNaN(d.delta)).toBe(true);
  });
});