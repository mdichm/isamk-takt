// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires pour le parsing de logs/result.txt (classifyOutcome)
// @takt/engine-fet — L4-08

import { describe, it, expect } from 'vitest';
import {
  classifyOutcome,
  FetAdapter,
  type FetOutcome,
} from './index.js';
import type {
  EngineInput,
  EngineActivity,
  EngineRoom,
  EnginePeriod,
  EngineRawResult,
} from '@takt/contracts';
import { fetId } from './fet-entities.js';

function isSuccess(o: FetOutcome): o is { kind: 'SUCCESS' } {
  return o.kind === 'SUCCESS';
}
function isImpossible(o: FetOutcome): o is { kind: 'IMPOSSIBLE' } {
  return o.kind === 'IMPOSSIBLE';
}
function isTimeExceeded(o: FetOutcome): o is { kind: 'TIME_EXCEEDED' } {
  return o.kind === 'TIME_EXCEEDED';
}
function isInterrupted(o: FetOutcome): o is { kind: 'INTERRUPTED' } {
  return o.kind === 'INTERRUPTED';
}
function isFailed(o: FetOutcome): o is { kind: 'FAILED'; reason: string } {
  return o.kind === 'FAILED';
}

describe('classifyOutcome — parsing de logs/result.txt', () => {
  it('rc 0 + "Generation successful" → SUCCESS', () => {
    const result = classifyOutcome(0, 'Generation successful\n');
    expect(isSuccess(result)).toBe(true);
  });

  it('rc 0 + "Generation successful" avec texte autour → SUCCESS', () => {
    const result = classifyOutcome(0, 'Some logs... Generation successful ...');
    expect(isSuccess(result)).toBe(true);
  });

  it('rc 0 + "Impossible" → IMPOSSIBLE', () => {
    const result = classifyOutcome(0, 'Impossible\n');
    expect(isImpossible(result)).toBe(true);
  });

  it('rc 0 + "Time exceeded" → TIME_EXCEEDED', () => {
    const result = classifyOutcome(0, 'Time exceeded\n');
    expect(isTimeExceeded(result)).toBe(true);
  });

  it('rc 0 + "Generation interrupted" → INTERRUPTED', () => {
    const result = classifyOutcome(0, 'Generation interrupted\n');
    expect(isInterrupted(result)).toBe(true);
  });

  it('rc 1 → FAILED', () => {
    const result = classifyOutcome(1, 'Error: the specified input file ... is not existing');
    expect(isFailed(result)).toBe(true);
    if (isFailed(result)) {
      expect(result.reason).toContain('code 1');
    }
  });

  it('rc < 0 (SIGKILL) → FAILED, prioritaire sur result.txt', () => {
    // Même si result.txt dit "Generation successful", un processus tué prime
    const result = classifyOutcome(-9, 'Generation successful');
    expect(isFailed(result)).toBe(true);
    if (isFailed(result)) {
      expect(result.reason).toContain('tué ou planté');
    }
  });

  it('rc > 128 (SIGKILL shell) → FAILED', () => {
    const result = classifyOutcome(137, '');
    expect(isFailed(result)).toBe(true);
  });

  it('rc 0 + texte non reconnu → FAILED', () => {
    const result = classifyOutcome(0, 'Statut inconnu');
    expect(isFailed(result)).toBe(true);
  });

  it('rc 0 + chaîne vide → FAILED', () => {
    const result = classifyOutcome(0, '');
    expect(isFailed(result)).toBe(true);
  });
});

describe('importResult — conversion des résultats FET en EngineSolution', () => {
  const makePeriod = (id: string, dayIndex: number, slotIndex: number): any => ({
    id,
    dayIndex,
    slotIndex,
    startTime: '08:00',
    endTime: '08:30',
  });

  const makeActivity = (id: string): any => ({
    id,
    code: 'ACT',
    subject: 'Subject',
    activityTagIds: [],
    teacherIds: ['T1'],
    groupIds: ['G1'],
    roomTagIds: [],
    durationInSlots: 2,
    minRooms: 1,
    maxRooms: 1,
  });

  const makeRoom = (code: string, id: string): any => ({
    id,
    code,
    capacity: 30,
    tagIds: [],
  });

  const makeInput = (
    activities: any[],
    rooms: any[],
    periods: any[],
  ): any => ({
    semesterId: 'S1',
    activities,
    rooms,
    periods,
    teachers: [],
    groups: [],
    activityTags: [],
    constraints: [],
    locks: [],
  });

  const makeRawResult = (activitiesTimetableXml?: string): EngineRawResult => ({
    exitCode: 0,
    resultText: 'Generation successful',
    activitiesTimetableXml,
    highestXml: activitiesTimetableXml,
    currentXml: activitiesTimetableXml,
    stdout: '',
    stderr: '',
    durationMs: 100,
  });

  it('vide si pas de XML → toutes les activités non placées', async () => {
    const input = makeInput(
      [makeActivity('A1'), makeActivity('A2')],
      [makeRoom('R1', 'R1')],
      [makePeriod('P1', 0, 0)],
    );
    const raw = makeRawResult();

    const adapter = new FetAdapter();
    const solution = await adapter.importResult(raw, input);

    expect(solution.placedActivities).toEqual([]);
    expect(solution.unplacedActivities).toEqual([
      { activityId: 'A1', reason: 'Non placée par le moteur' },
      { activityId: 'A2', reason: 'Non placée par le moteur' },
    ]);
    expect(solution.hardConflicts).toEqual([]);
    expect(solution.totalSoftConflicts).toBe(0);
  });

  it('matche une activité placée avec sa salle', async () => {
    const input = makeInput(
      [makeActivity('ACT00001')],
      [makeRoom('R101', 'R101')],
      [makePeriod('P-LUNI-08', 0, 0)],
    );
    const raw = makeRawResult(`
      <Activities_Timetable>
        <Activity><Id>${fetId('ACT00001')}</Id><Day>Lundi</Day><Hour>H1</Hour><Room>${fetId('R101')}</Room></Activity>
      </Activities_Timetable>
    `);

    const adapter = new FetAdapter();
    const solution = await adapter.importResult(raw, input);

    expect(solution.placedActivities).toEqual([
      { activityId: 'ACT00001', periodId: 'P-LUNI-08', roomId: 'R101' },
    ]);
    expect(solution.unplacedActivities).toEqual([]);
  });

  it('ignore une activité inconnue (absente de l input)', async () => {
    const input = makeInput(
      [makeActivity('ACT00001')],
      [makeRoom('R101', 'R101')],
      [makePeriod('P-LUNI-08', 0, 0)],
    );
    const raw = makeRawResult(`
      <Activities_Timetable>
        <Activity><Id>UNKNOWN_ACTIVITY</Id><Day>Lundi</Day><Hour>H1</Hour><Room>R101</Room></Activity>
      </Activities_Timetable>
    `);

    const adapter = new FetAdapter();
    const solution = await adapter.importResult(raw, input);

    expect(solution.placedActivities).toEqual([]);
    expect(solution.unplacedActivities).toEqual([
      { activityId: 'ACT00001', reason: 'Non placée par le moteur' },
    ]);
  });

  it('gère une salle absente (room null)', async () => {
    const input = makeInput(
      [makeActivity('ACT00001')],
      [],
      [makePeriod('P-LUNI-08', 0, 0)],
    );
    const raw = makeRawResult(`
      <Activities_Timetable>
        <Activity><Id>${fetId('ACT00001')}</Id><Day>Lundi</Day><Hour>H1</Hour><Room>${fetId('R999')}</Room></Activity>
      </Activities_Timetable>
    `);

    const adapter = new FetAdapter();
    const solution = await adapter.importResult(raw, input);

    expect(solution.placedActivities).toEqual([
      { activityId: 'ACT00001', periodId: 'P-LUNI-08', roomId: null },
    ]);
  });
});