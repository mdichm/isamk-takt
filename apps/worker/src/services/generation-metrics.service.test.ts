// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires du moteur de métriques et score 0-100 (L4-17)
// @takt/worker

import { describe, it, expect } from 'vitest';
import {
  GenerationMetricsService,
  type GenerationMetricsInput,
} from './generation-metrics.service.js';
import { GenerationStatut } from '@takt/db';
import type { Conflit } from '@takt/conflict-engine';

function conflit(
  overrides: Partial<{
    type: Conflit['type'];
    severite: Conflit['severite'];
    regleCode: string;
  }> = {},
): Conflit {
  return {
    regleCode: overrides.regleCode ?? 'R1',
    type: (overrides.type ?? 'ENSEIGNANT') as Conflit['type'],
    severite: (overrides.severite ?? 'BLOQUANT') as Conflit['severite'],
    objetType: 'seance',
    objetId: 's1',
    seanceIds: ['s1'],
    message: 'msg',
    signature: 'sig',
  };
}

function periode(id: string, dayIndex: number, slotIndex: number) {
  return { id, dayIndex, slotIndex, startTime: '08:00', endTime: '08:30' };
}

function salle(id: string, capacity: number) {
  return { id, code: `S${id}`, capacity, tagIds: [] as string[] };
}

function groupe(id: string, size: number) {
  return { id, code: `G${id}`, size };
}

function enseignant(id: string) {
  return { id, code: `T${id}` };
}

function activite(
  id: string,
  overrides: Partial<{
    groupIds: string[];
    teacherIds: string[];
    durationInSlots: number;
  }> = {},
) {
  return {
    id,
    code: `ACT${id}`,
    subject: 'S',
    activityTagIds: [],
    teacherIds: overrides.teacherIds ?? ['T1'],
    groupIds: overrides.groupIds ?? ['G1'],
    roomTagIds: [],
    durationInSlots: overrides.durationInSlots ?? 2,
    minRooms: 1,
    maxRooms: 1,
  };
}

function placed(activityId: string, periodId: string, roomId: string | null) {
  return { activityId, periodId, roomId };
}

function makeInput(overrides: Partial<{
  activities: any[];
  periods: any[];
  rooms: any[];
  teachers: any[];
  groups: any[];
  placedActivities: any[];
  unplacedActivities: any[];
  poidsScore: Record<string, number> | null;
  statut: GenerationStatut;
  dureeMs: number;
  conflits: Conflit[];
  totalSoftConflicts: number;
}> = {}): GenerationMetricsInput {
  const activities = overrides.activities ?? [
    activite('A1', { groupIds: ['G1'], teacherIds: ['T1'] }),
    activite('A2', { groupIds: ['G1'], teacherIds: ['T1'] }),
  ];
  const periods = overrides.periods ?? [
    periode('P1', 0, 0),
    periode('P2', 0, 1),
    periode('P3', 1, 0),
  ];
  const rooms = overrides.rooms ?? [salle('R1', 30)];
  const teachers = overrides.teachers ?? [enseignant('T1')];
  const groups = overrides.groups ?? [groupe('G1', 20)];
  const engineInput: any = {
    semesterId: 'sem-1',
    activities,
    periods,
    rooms,
    teachers,
    groups,
    activityTags: [],
    constraints: [],
    locks: [],
  };
  const engineSolution: any = {
    input: engineInput,
    rawResult: {},
    placedActivities: overrides.placedActivities ?? [
      placed('A1', 'P1', 'R1'),
      placed('A2', 'P2', 'R1'),
    ],
    unplacedActivities: overrides.unplacedActivities ?? [],
    totalSoftConflicts: overrides.totalSoftConflicts ?? 0,
    hardConflicts: [],
  };
  return {
    engineInput,
    engineSolution,
    conflits: overrides.conflits ?? [],
    poidsScore: overrides.poidsScore ?? null,
    statut: overrides.statut ?? GenerationStatut.SUCCEEDED,
    dureeMs: overrides.dureeMs ?? 100,
    totalSoftConflicts: overrides.totalSoftConflicts ?? 0,
  } as GenerationMetricsInput;
}

describe('GenerationMetricsService — score et renormalisation', () => {
  it('calcule le score moyen pondéré sur les critères évalués', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { creuxGroupes: 2, creuxEnseignants: 3 },
      statut: GenerationStatut.SUCCEEDED,
    });
    const { score, scoreCriteres } = svc.compute(input);
    expect(score).not.toBeNull();
    const evalues = scoreCriteres.filter((c) => c.statut === 'EVALUE');
    expect(evalues.length).toBeGreaterThan(0);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('renormalise les poids quand certains critères sont NON_EVALUE', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { creuxGroupes: 2, creuxEnseignants: 3, covoiturage: 5 },
      statut: GenerationStatut.SUCCEEDED,
    });
    const { score, scoreCriteres } = svc.compute(input);
    const covoiturage = scoreCriteres.find((c) => c.code === 'covoiturage');
    expect(covoiturage?.statut).toBe('NON_EVALUE');
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("retourne null quand aucun critère n'est évaluable ou poidsTotal = 0", () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: {},
      statut: GenerationStatut.SUCCEEDED,
    });
    const { score } = svc.compute(input);
    expect(score).toBeNull();
  });

  it('score = somme des contributions', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { creuxGroupes: 1, creuxEnseignants: 1 },
      statut: GenerationStatut.SUCCEEDED,
    });
    const { score, scoreCriteres } = svc.compute(input);
    const somme = scoreCriteres.reduce(
      (acc, c) => acc + (c.contribution ?? 0),
      0,
    );
    expect(score).toBeCloseTo(Math.round(somme * 100) / 100, 1);
  });
});

describe('GenerationMetricsService — classee / motifNonClassee', () => {
  it('classee = true pour SUCCEEDED sans séance non placée et sans conflit bloquant', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      statut: GenerationStatut.SUCCEEDED,
      placedActivities: [placed('A1', 'P1', 'R1')],
      unplacedActivities: [],
      conflits: [],
    });
    const { classee, motifNonClassee } = svc.compute(input);
    expect(classee).toBe(true);
    expect(motifNonClassee).toBeNull();
  });

  it('classee = false avec séance non placée', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      statut: GenerationStatut.SUCCEEDED_WITH_WARNINGS,
      placedActivities: [placed('A1', 'P1', 'R1')],
      unplacedActivities: [{ activityId: 'A2', reason: 'non placée' }],
      conflits: [],
    });
    const { classee, motifNonClassee } = svc.compute(input);
    expect(classee).toBe(false);
    expect(motifNonClassee).toBe('SEANCES_NON_PLACEES');
  });

  it('classee = false avec conflit bloquant', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      statut: GenerationStatut.SUCCEEDED,
      placedActivities: [placed('A1', 'P1', 'R1')],
      unplacedActivities: [],
      conflits: [conflit({ severite: 'BLOQUANT' })],
    });
    const { classee, motifNonClassee } = svc.compute(input);
    expect(classee).toBe(false);
    expect(motifNonClassee).toBe('CONFLIT_BLOQUANT');
  });

  it('classee = false pour génération en échec', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      statut: GenerationStatut.FAILED,
      placedActivities: [],
      unplacedActivities: [
        { activityId: 'A1', reason: 'r' },
        { activityId: 'A2', reason: 'r' },
      ],
      conflits: [],
    });
    const { classee, motifNonClassee } = svc.compute(input);
    expect(classee).toBe(false);
    expect(motifNonClassee).toBe('GENERATION_ECHEC');
  });
});

describe('GenerationMetricsService — critères NON_EVALUE', () => {
  it('covoiturage toujours NON_EVALUE (pas de donnée worker)', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { covoiturage: 5 },
      statut: GenerationStatut.SUCCEEDED,
    });
    const { scoreCriteres } = svc.compute(input);
    const covoiturage = scoreCriteres.find((c) => c.code === 'covoiturage');
    expect(covoiturage?.statut).toBe('NON_EVALUE');
    expect(covoiturage?.sousScore).toBeNull();
  });

  it('creuxGroupes NON_EVALUE sans groupe', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { creuxGroupes: 3 },
      groups: [],
      placedActivities: [],
      statut: GenerationStatut.SUCCEEDED,
    });
    const { scoreCriteres } = svc.compute(input);
    const cg = scoreCriteres.find((c) => c.code === 'creuxGroupes');
    expect(cg?.statut).toBe('NON_EVALUE');
  });

  it('capaciteRecommandee NON_EVALUE sans salle', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: { capaciteRecommandee: 3 },
      rooms: [],
      placedActivities: [],
      statut: GenerationStatut.SUCCEEDED,
    });
    const { scoreCriteres } = svc.compute(input);
    const cr = scoreCriteres.find((c) => c.code === 'capaciteRecommandee');
    expect(cr?.statut).toBe('NON_EVALUE');
  });
});

describe('GenerationMetricsService — sous-scores bornes 0-100', () => {
  it('sousScore toujours entre 0 et 100', () => {
    const svc = new GenerationMetricsService();
    const input = makeInput({
      poidsScore: {
        creuxGroupes: 1,
        creuxEnseignants: 1,
        heuresConsecutives: 1,
        equilibre: 1,
        utilisationSalles: 1,
        capaciteRecommandee: 1,
      },
      statut: GenerationStatut.SUCCEEDED,
    });
    const { scoreCriteres, score } = svc.compute(input);
    for (const c of scoreCriteres) {
      if (c.statut === 'EVALUE') {
        expect(c.sousScore).toBeGreaterThanOrEqual(0);
        expect(c.sousScore).toBeLessThanOrEqual(100);
      }
    }
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
