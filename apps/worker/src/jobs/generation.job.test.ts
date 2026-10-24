// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import type { EngineLock } from '@takt/contracts';
import { buildLocksFromVerrous } from './generation.job.js';

function makeVerrou(
  id: string,
  type: 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE',
  affectationKey: string,
  creneauDebutId: string | null = 'creneau-1',
  salleId: string | null = 'salle-1',
): { id: string; type: typeof type; seance: { affectationKey: string; creneauDebutId: string | null; salleId: string | null } | null } {
  return {
    id,
    type,
    seance: { affectationKey, creneauDebutId, salleId },
  };
}

const affectationByKey = new Map<string, string>([
  ['INFO:MATH:CM:ENSEIGNANT-1', 'activite-1'],
  ['PHYS:MATH:TD:ENSEIGNANT-2', 'activite-2'],
]);

describe('buildLocksFromVerrous (L4-22 régénération partielle)', () => {
  it('retourne un tableau vide sans verrous', () => {
    const result = buildLocksFromVerrous([], affectationByKey);
    expect(result).toEqual([]);
  });

  it('ignore les verrous ENSEIGNANT (pas d\'EngineLock FET)', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'ENSEIGNANT', 'INFO:MATH:CM:ENSEIGNANT-1'),
    ], affectationByKey);
    expect(result).toEqual([]);
  });

  it('ignore les verrous sans créneau ni salle', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'CRENEAU', 'INFO:MATH:CM:ENSEIGNANT-1', null, null),
    ], affectationByKey);
    expect(result).toEqual([]);
  });

  it('ignore les séances sans affectation résolue', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'CRENEAU', 'INCONNUE:MATH:CM:ENSEIGNANT-1'),
    ], affectationByKey);
    expect(result).toEqual([]);
  });

  it('traduit un verrou CRENEAU en periodId uniquement', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'CRENEAU', 'INFO:MATH:CM:ENSEIGNANT-1', 'creneau-5', null),
    ], affectationByKey);
    expect(result).toEqual([{
      id: 'v1',
      activityId: 'activite-1',
      periodId: 'creneau-5',
      roomId: undefined,
      weight: 100,
    } as EngineLock]);
  });

  it('traduit un verrou SALLE en roomId uniquement', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'SALLE', 'INFO:MATH:CM:ENSEIGNANT-1', null, 'salle-9'),
    ], affectationByKey);
    expect(result).toEqual([{
      id: 'v1',
      activityId: 'activite-1',
      periodId: undefined,
      roomId: 'salle-9',
      weight: 100,
    } as EngineLock]);
  });

  it('traduit un verrou ACTIVITE en periodId + roomId', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v1', 'ACTIVITE', 'INFO:MATH:CM:ENSEIGNANT-1', 'creneau-5', 'salle-9'),
    ], affectationByKey);
    expect(result).toEqual([{
      id: 'v1',
      activityId: 'activite-1',
      periodId: 'creneau-5',
      roomId: 'salle-9',
      weight: 100,
    } as EngineLock]);
  });

  it('trie les locks par id (déterministe)', () => {
    const result = buildLocksFromVerrous([
      makeVerrou('v3', 'CRENEAU', 'INFO:MATH:CM:ENSEIGNANT-1', 'creneau-5', null),
      makeVerrou('v1', 'SALLE', 'PHYS:MATH:TD:ENSEIGNANT-2', null, 'salle-9'),
      makeVerrou('v2', 'CRENEAU', 'INFO:MATH:CM:ENSEIGNANT-1', 'creneau-3', null),
    ], affectationByKey);
    expect(result.map((l) => l.id)).toEqual(['v1', 'v2', 'v3']);
  });

  it('ignore les verrous sans seance (leveLe non null filtré en amont)', () => {
    const result = buildLocksFromVerrous([
      { id: 'v1', type: 'CRENEAU', seance: null },
    ], affectationByKey);
    expect(result).toEqual([]);
  });
});
