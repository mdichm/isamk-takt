import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildProfile, buildFetDocument } from './fet-entities.js';
import type { EngineInput } from '@takt/contracts';

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