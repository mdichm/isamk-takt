import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildProfile, buildFetDocument } from './fet-entities.js';
import { buildConstraintsXml, buildLocksXml } from './fet-constraints.js';
import type { EngineConstraint, EngineInput, EngineLock } from '@takt/contracts';

function makePeriod(id: string, dayIndex: number, slotIndex: number, start: string, end: string): any {
  return { id, dayIndex, slotIndex, startTime: start, endTime: end };
}

function makeTeacher(id: string, code: string): any {
  return { id, code };
}

function makeGroup(id: string, code: string, size: number): any {
  return { id, code, size };
}

function makeRoom(id: string, code: string, capacity: number, tags: string[] = []): any {
  return { id, code, capacity, tagIds: tags };
}

function makeTag(id: string, code: string): any {
  return { id, code };
}

function makeActivity(
  id: string,
  code: string,
  subject: string,
  tagIds: string[] = [],
  teacherIds: string[] = [],
  groupIds: string[] = [],
  roomTagIds: string[] = [],
  durationInSlots: number = 2,
  minRooms: number = 1,
  maxRooms: number = 1
): any {
  return {
    id,
    code,
    subject,
    activityTagIds: tagIds,
    teacherIds,
    groupIds,
    roomTagIds,
    durationInSlots,
    minRooms,
    maxRooms,
  };
}

function makeInput(overrides: Partial<EngineInput> = {}): EngineInput {
  const periods = [
    makePeriod('p1', 0, 0, '08:00', '08:30'),
    makePeriod('p2', 0, 1, '08:30', '09:00'),
    makePeriod('p3', 1, 0, '08:00', '08:30'),
  ];
  const teachers = [makeTeacher('t1', 'T001'), makeTeacher('t2', 'T002')];
  const groups = [makeGroup('g1', 'G001', 30), makeGroup('g2', 'G002', 25)];
  const rooms = [makeRoom('r1', 'S001', 40), makeRoom('r2', 'S002', 35)];
  const tags = [makeTag('tag1', 'CM'), makeTag('tag2', 'TD')];
  const activities = [
    makeActivity('a1', 'MATH101', 'Mathématiques', ['tag1'], ['t1'], ['g1'], [], 2, 1, 1),
    makeActivity('a2', 'PHYS101', 'Physique', ['tag2'], ['t2'], ['g2'], [], 2, 1, 1),
  ];

  return {
    semesterId: 'S1-2026',
    periods,
    activities,
    teachers,
    groups,
    rooms,
    activityTags: tags,
    constraints: [],
    locks: [],
    ...overrides,
  };
}

function makeConstraint(
  id: string,
  type: string,
  weight: number = 100,
  entityIds: string[] = [],
  parameters: Record<string, unknown> = {}
): EngineConstraint {
  return { id, type, weight, entityIds, parameters };
}

function makeLock(
  id: string,
  activityId: string,
  periodId?: string,
  roomId?: string,
  weight: number = 100
): EngineLock {
  return { id, activityId, periodId, roomId, weight };
}

describe('HardConstraints', () => {
  it('traduit TEACHER_AVAILABILITY en ConstraintTeacherNotAvailableTimes', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 2, durationInSlots: 1 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintTeacherNotAvailableTimes: {
        Weight_Percentage: '100',
        Active: 'true',
        Teacher: expect.stringMatching(/^[0-9A-F]{8}$/),
        Day: '0',
        Hour: '2',
        Duration: '1',
      },
    });
    expect(mappingReport).toHaveLength(1);
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('traduit GROUP_AVAILABILITY en ConstraintStudentsNotAvailableTimes', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'GROUP_AVAILABILITY', 100, ['g1'], { dayIndex: 1, slotIndex: 3, durationInSlots: 2 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintStudentsNotAvailableTimes: {
        Weight_Percentage: '100',
        Active: 'true',
        Students: expect.stringMatching(/^[0-9A-F]{8}$/),
        Day: '1',
        Hour: '3',
        Duration: '2',
      },
    });
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('traduit ROOM_CAPACITY en ConstraintRoomNotAvailableTimes', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'ROOM_CAPACITY', 100, ['r1'], { dayIndex: 0, slotIndex: 1, durationInSlots: 1 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintRoomNotAvailableTimes: {
        Weight_Percentage: '100',
        Active: 'true',
        Room: expect.stringMatching(/^[0-9A-F]{8}$/),
        Day: '0',
        Hour: '1',
        Duration: '1',
      },
    });
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('traduit SALLE_IMPOSEE en ConstraintActivityPreferredRoom', () => {
    const input = makeInput({
      constraints: [makeConstraint('c1', 'SALLE_IMPOSEE', 100, ['a1', 'r1'])],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintActivityPreferredRoom: {
        Weight_Percentage: '100',
        Active: 'true',
        Activity: 'F55FF16F',
        Room: expect.stringMatching(/^[0-9A-F]{8}$/),
      },
    });
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('traduit SALLE_AUTORISEES en ConstraintActivityPreferredRooms', () => {
    const input = makeInput({
      constraints: [makeConstraint('c1', 'SALLE_AUTORISEES', 100, ['a1', 'r1', 'r2'])],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintActivityPreferredRooms: {
        Weight_Percentage: '100',
        Active: 'true',
        Activity: 'F55FF16F',
        Room: expect.arrayContaining([expect.stringMatching(/^[0-9A-F]{8}$/)]),
      },
    });
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('marque PAUSE comme TRADUITE avec ConstraintBasicCompulsoryTime', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'PAUSE', 100, [], { dayIndex: 0, slotIndex: 4, durationInSlots: 2 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintBasicCompulsoryTime: {
        Weight_Percentage: '100',
        Active: 'true',
        Name: 'Pause',
        Day: '0',
        Hour: '4',
        Duration: '2',
      },
    });
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'TRADUITE' });
  });

  it('marque MIN_GAP_BETWEEN_ACTIVITIES comme PARTIELLE', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'MIN_GAP_BETWEEN_ACTIVITIES', 100, ['a1', 'a2'], { minDays: 1 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'PARTIELLE' });
    expect(mappingReport[0].reason).toContain('partiellement');
  });

  it('marque NO_CONFLICT_TEACHER comme PARTIELLE', () => {
    const input = makeInput({
      constraints: [makeConstraint('c1', 'NO_CONFLICT_TEACHER', 100, ['t1', 't2'])],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'PARTIELLE' });
  });

  it('marque une contrainte inactivée (poids = 0) comme NON_TRADUITE', () => {
    const input = makeInput({
      constraints: [makeConstraint('c1', 'TEACHER_AVAILABILITY', 0, ['t1'], { dayIndex: 0, slotIndex: 1 })],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'NON_TRADUITE' });
  });

  it('marque un type inconnu comme NON_TRADUITE', () => {
    const input = makeInput({
      constraints: [makeConstraint('c1', 'TYPE_INCONNU', 100, ['t1'], {})],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({ ruleId: 'c1', status: 'NON_TRADUITE' });
  });

  it('tri les contraintes par id pour garantir la déterminisme', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c2', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 1 }),
        makeConstraint('c1', 'GROUP_AVAILABILITY', 100, ['g1'], { dayIndex: 1, slotIndex: 2 }),
      ],
    });

    const { mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(mappingReport).toHaveLength(2);
    expect(mappingReport[0].ruleId).toBe('c1');
    expect(mappingReport[1].ruleId).toBe('c2');
  });

  it('mappingReport inclut TRADUITE/PARTIELLE/NON_TRADUITE selon le type', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 1 }),
        makeConstraint('c2', 'MIN_GAP_BETWEEN_ACTIVITIES', 100, ['a1', 'a2'], { minDays: 1 }),
        makeConstraint('c3', 'TYPE_INCONNU', 100, [], {}),
      ],
    });

    const file = buildProfile(input);
    const statuses = file.mappingReport.map((m) => m.status);

    expect(statuses).toContain('TRADUITE');
    expect(statuses).toContain('PARTIELLE');
    expect(statuses).toContain('NON_TRADUITE');
  });

  it('buildProfile mappingReport est déterministe', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 1 }),
        makeConstraint('c2', 'GROUP_AVAILABILITY', 100, ['g1'], { dayIndex: 1, slotIndex: 2 }),
      ],
    });

    const file1 = buildProfile(input);
    const file2 = buildProfile(input);

    expect(file1.mappingReport).toEqual(file2.mappingReport);
  });

  it('inclut les contraintes dans le XML généré', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 1, durationInSlots: 1 }),
      ],
    });

    const xml = buildFetDocument(input);
    expect(xml).toContain('ConstraintTeacherNotAvailableTimes');
    expect(xml).toContain('<constraints>');
  });
});

describe('SoftConstraintsAndLocks', () => {
  it('traduit ACTIVITY_TIME_PREFERENCE en ConstraintActivityPreferredTime avec poids < 100 %', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'ACTIVITY_TIME_PREFERENCE', 50, ['a1'], { dayIndex: 0, slotIndex: 2, durationInSlots: 2 }),
      ],
    });

    const { constraintsElements, mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(constraintsElements).toHaveLength(1);
    expect(constraintsElements[0]).toMatchObject({
      ConstraintActivityPreferredTime: {
        Weight_Percentage: '50',
        Active: 'true',
        Activity: 'F55FF16F',
        Day: '0',
        Hour: '2',
        Duration: '2',
      },
    });
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'c1',
      status: 'TRADUITE',
    });
  });

  it('marque ACTIVITY_TIME_PREFERENCE comme NON_TRADUITE si activité introuvable', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'ACTIVITY_TIME_PREFERENCE', 50, ['inexistant'], { dayIndex: 0, slotIndex: 2 }),
      ],
    });

    const { mappingReport } = buildConstraintsXml({
      constraints: input.constraints,
      activities: input.activities,
      teachers: input.teachers,
      groups: input.groups,
      rooms: input.rooms,
    });

    expect(mappingReport[0]).toMatchObject({
      ruleId: 'c1',
      status: 'NON_TRADUITE',
      reason: 'Activité introuvable',
    });
  });

  it('traduit un verrou periodId seul en ConstraintActivityPreferredTime à 100 %', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'a1', 'p2')],
    });

    const { lockElements, mappingReport } = buildLocksXml({
      locks: input.locks,
      activities: input.activities,
      periods: input.periods,
      rooms: input.rooms,
    });

    expect(lockElements).toHaveLength(1);
    expect(lockElements[0]).toMatchObject({
      ConstraintActivityPreferredTime: {
        Weight_Percentage: '100',
        Active: 'true',
        Activity: 'F55FF16F',
        Day: '0',
        Hour: '1',
        Duration: '1',
      },
    });
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'l1',
      status: 'TRADUITE',
    });
  });

  it('traduit un verrou roomId seul en ConstraintActivityPreferredRoom à 100 %', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'a1', undefined, 'r2')],
    });

    const { lockElements, mappingReport } = buildLocksXml({
      locks: input.locks,
      activities: input.activities,
      periods: input.periods,
      rooms: input.rooms,
    });

    expect(lockElements).toHaveLength(1);
    expect(lockElements[0]).toMatchObject({
      ConstraintActivityPreferredRoom: {
        Weight_Percentage: '100',
        Active: 'true',
        Activity: 'F55FF16F',
        Room: 'C842F8AF',
      },
    });
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'l1',
      status: 'TRADUITE',
    });
  });
});

describe('SoftConstraintsAndLocks suite 2', () => {
  it('traduit un verrou periodId + roomId en deux contraintes à 100 % chacune', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'a1', 'p2', 'r1')],
    });

    const { lockElements, mappingReport } = buildLocksXml({
      locks: input.locks,
      activities: input.activities,
      periods: input.periods,
      rooms: input.rooms,
    });

    expect(lockElements).toHaveLength(2);
    expect(lockElements[0]).toMatchObject({
      ConstraintActivityPreferredTime: {
        Weight_Percentage: '100',
        Activity: 'F55FF16F',
      },
    });
    expect(lockElements[1]).toMatchObject({
      ConstraintActivityPreferredRoom: {
        Weight_Percentage: '100',
        Activity: 'F55FF16F',
        Room: 'C5E0E70C',
      },
    });
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'l1',
      status: 'TRADUITE',
    });
  });

  it('marque un verrou sans periodId ni roomId (enseignant) comme NON_TRADUITE', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'a1')],
    });

    const { lockElements, mappingReport } = buildLocksXml({
      locks: input.locks,
      activities: input.activities,
      periods: input.periods,
      rooms: input.rooms,
    });

    expect(lockElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'l1',
      status: 'NON_TRADUITE',
      reason: 'Aucun créneau ni salle spécifiés',
    });
  });

  it('marque un verrou avec activité introuvable comme NON_TRADUITE', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'inexistant', 'p1')],
    });

    const { lockElements, mappingReport } = buildLocksXml({
      locks: input.locks,
      activities: input.activities,
      periods: input.periods,
      rooms: input.rooms,
    });

    expect(lockElements).toHaveLength(0);
    expect(mappingReport[0]).toMatchObject({
      ruleId: 'l1',
      status: 'NON_TRADUITE',
      reason: 'Activité introuvable',
    });
  });

  it('trie les locks par id pour garantir la déterminisme', () => {
    const inputUnsorted = makeInput({
      locks: [
        makeLock('l2', 'a1', 'p1'),
        makeLock('l1', 'a2', undefined, 'r2'),
      ],
    });
    const inputSorted = makeInput({
      locks: [
        makeLock('l1', 'a2', undefined, 'r2'),
        makeLock('l2', 'a1', 'p1'),
      ],
    });

    const xml1 = buildFetDocument(inputUnsorted);
    const xml2 = buildFetDocument(inputSorted);

    expect(xml1).toBe(xml2);
  });

  it('intègre les locks dans le mappingReport de buildProfile', () => {
    const input = makeInput({
      locks: [makeLock('l1', 'a1', 'p1')],
    });

    const file = buildProfile(input);

    const lockEntry = file.mappingReport.find((m) => m.ruleId === 'l1');
    expect(lockEntry).toMatchObject({
      status: 'TRADUITE',
    });
  });

  it('intègre ACTIVITY_TIME_PREFERENCE dans le mappingReport de buildProfile', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'ACTIVITY_TIME_PREFERENCE', 30, ['a1'], { dayIndex: 0, slotIndex: 1 }),
      ],
    });

    const file = buildProfile(input);

    const entry = file.mappingReport.find((m) => m.ruleId === 'c1');
    expect(entry).toMatchObject({
      status: 'TRADUITE',
    });
  });

  it('génère du XML avec contraintes et verrous', () => {
    const input = makeInput({
      constraints: [
        makeConstraint('c1', 'TEACHER_AVAILABILITY', 100, ['t1'], { dayIndex: 0, slotIndex: 1, durationInSlots: 1 }),
      ],
      locks: [makeLock('l1', 'a1', 'p2')],
    });

    const xml = buildFetDocument(input);

    expect(xml).toContain('ConstraintTeacherNotAvailableTimes');
    expect(xml).toContain('ConstraintActivityPreferredTime');
    expect(xml).toContain('<constraints>');
  });
});

describe('FetEntityBuilder', () => {
  it('construit un document XML FET valide', () => {
    const input = makeInput();
    const xml = buildFetDocument(input);

    expect(xml).toContain('<?xml');
    expect(xml).toContain('<fet');
    expect(xml).toContain('TAKT');
    expect(xml).toContain('7.12.0');
    expect(xml).toContain('MATH101');
    expect(xml).toContain('<teacher>');
    expect(xml).toContain('<students_set>');
    expect(xml).toContain('<room>');
    expect(xml).toContain('<activity_tag>');
    expect(xml).toContain('<activity>');
    expect(xml).toContain('<id>');
    expect(xml).toContain('<duration>');
  });

  it('est déterministe : mêmes entrées, même octet à octet', () => {
    const input = makeInput();
    const xml1 = buildFetDocument(input);
    const xml2 = buildFetDocument(input);

    expect(xml1).toBe(xml2);
  });

  it('buildProfile retourne un payload et un sha256 cohérents', () => {
    const input = makeInput();
    const file1 = buildProfile(input);
    const file2 = buildProfile(input);

    expect(file1.payload).toEqual(file2.payload);
    expect(file1.sha256).toBe(file2.sha256);
    expect(file1.engineVersion).toBe('7.12.0');
    expect(file1.builderVersion).toBe('0.0.1');
    expect(file1.payload).toBeInstanceOf(Buffer);
    expect(file1.sha256.length).toBe(64);
  });

  it('ne contient aucune identité en clair (noms propres)', () => {
    const input = makeInput({
      teachers: [makeTeacher('t1', 'Jean Dupont'), makeTeacher('t2', 'Marie Curie')],
      groups: [makeGroup('g1', 'Licence Info', 30)],
      rooms: [makeRoom('r1', 'Salle Principale', 40)],
    });

    const xml = buildFetDocument(input);

    // Aucun nom propre ne doit apparaître
    expect(xml).not.toContain('Jean Dupont');
    expect(xml).not.toContain('Marie Curie');
    expect(xml).not.toContain('Licence Info');
    expect(xml).not.toContain('Salle Principale');

    // Seuls des identifiants techniques hachés (8 caractères hexadécimaux)
    const teacherNames = xml.matchAll(/<name>([^<]+)<\/name>/g);
    const names = Array.from(teacherNames, (m) => m[1]);
    for (const name of names) {
      expect(/^[0-9A-F]{8}$/.test(name)).toBe(true);
    }
  });

  it('construit les périodes depuis les créneaux de 30 minutes', () => {
    const input = makeInput({
      periods: [
        makePeriod('p1', 0, 0, '08:00', '08:30'),
        makePeriod('p2', 0, 1, '08:30', '09:00'),
        makePeriod('p3', 1, 0, '08:00', '08:30'),
      ],
    });

    const xml = buildFetDocument(input);

    expect(xml).toContain('<days>2</days>');
    expect(xml).toContain('<hours_per_day>2</hours_per_day>');
  });

  it('sérialise les activités avec durée en nombre de créneaux', () => {
    const input = makeInput({
      activities: [
        makeActivity('a1', 'MATH101', 'Mathématiques', [], ['t1'], ['g1'], [], 4, 1, 1),
      ],
    });

    const xml = buildFetDocument(input);
    expect(xml).toContain('<duration>4</duration>');
  });

  it('inclut les activity tags dans le XML (hachés)', () => {
    const input = makeInput({
      activities: [
        makeActivity('a1', 'MATH101', 'Mathématiques', ['tag1', 'tag2'], ['t1'], ['g1'], [], 2, 1, 1),
      ],
    });

    const xml = buildFetDocument(input);
    // Les tags sont hachés, donc on ne trouve pas 'CM' en clair
    expect(xml).not.toContain('CM');
    expect(xml).not.toContain('TD');
    // Mais l'activité contient bien un activity_tag
    expect(xml).toContain('<activity_tag>');
  });

  it('gère une entrée vide (pas d\'activités)', () => {
    const input = makeInput({ activities: [], teachers: [], groups: [], rooms: [], activityTags: [] });

    const file = buildProfile(input);
    expect(file.payload).toBeInstanceOf(Buffer);
    expect(file.mappingReport).toEqual([]);
  });

  it('construit un mappingReport avec statut NON_TRADUITE pour chaque contrainte', () => {
    const input = makeInput({
      constraints: [
        { id: 'c1', type: 'ROOM_CAPACITY', weight: 100, entityIds: ['r1'], parameters: {} },
        { id: 'c2', type: 'TEACHER_AVAILABILITY', weight: 50, entityIds: ['t1'], parameters: {} },
      ],
    });

    const file = buildProfile(input);
    expect(file.mappingReport).toHaveLength(2);
    expect(file.mappingReport[0]).toMatchObject({
      ruleId: 'c1',
      status: 'NON_TRADUITE',
    });
    expect(file.mappingReport[1]).toMatchObject({
      ruleId: 'c2',
      status: 'NON_TRADUITE',
    });
  });

  it('trie les collections pour garantir la déterminisme même si l\'entrée n\'est pas triée', () => {
    const inputUnsorted = makeInput({
      teachers: [makeTeacher('t2', 'T002'), makeTeacher('t1', 'T001')],
      groups: [makeGroup('g2', 'G002', 25), makeGroup('g1', 'G001', 30)],
    });
    const inputSorted = makeInput({
      teachers: [makeTeacher('t1', 'T001'), makeTeacher('t2', 'T002')],
      groups: [makeGroup('g1', 'G001', 30), makeGroup('g2', 'G002', 25)],
    });

    const xml1 = buildFetDocument(inputUnsorted);
    const xml2 = buildFetDocument(inputSorted);

    expect(xml1).toBe(xml2);
  });

  it('correspond au fichier golden ISAMK minimal', () => {
    const input = makeInput();
    const xml = buildFetDocument(input);
    const expectedPath = join(__dirname, '..', 'test', 'fixtures', 'isamk-minimal.fet.expected');
    const expected = readFileSync(expectedPath, 'utf-8');

    expect(xml).toBe(expected);
  });
});