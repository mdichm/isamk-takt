// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires du parseur du résultat FET (L4-09)

import { describe, it, expect } from 'vitest';
import {
  parseActivitiesTimetableXml,
  buildDayIndexMap,
  buildHourIndexMap,
  jourIndexToJourSemaine,
  type FetActivityPlacement,
} from './fet-result-parser.js';

describe('parseActivitiesTimetableXml', () => {
  it('parse un placement simple', () => {
    const xml = `
      <Activities_Timetable>
        <Activity><Id>ABC12345</Id><Day>Lundi</Day><Hour>H1</Hour><Room>R1</Room></Activity>
        <Activity><Id>DEF67890</Id><Day>Mardi</Day><Hour>H2</Hour><Room></Room></Activity>
      </Activities_Timetable>
    `;
    const result = parseActivitiesTimetableXml(xml);
    expect(result).toEqual([
      { activityId: 'ABC12345', day: 'Lundi', hour: 'H1', room: 'R1' },
      { activityId: 'DEF67890', day: 'Mardi', hour: 'H2', room: null },
    ]);
  });

  it('ignore les activités hors balise Activity', () => {
    const xml = `
      <Activities_Timetable>
        <Activity><Id>X1</Id><Day>Lundi</Day><Hour>H1</Hour><Room>R1</Room></Activity>
        <NotAnActivity><Id>X2</Id><Day>Mardi</Day><Hour>H2</Hour><Room>R2</Room></NotAnActivity>
      </Activities_Timetable>
    `;
    const result = parseActivitiesTimetableXml(xml);
    expect(result).toHaveLength(1);
    expect(result[0].activityId).toBe('X1');
  });

  it('retourne un tableau vide pour un XML sans activités', () => {
    const result = parseActivitiesTimetableXml('<Activities_Timetable></Activities_Timetable>');
    expect(result).toEqual([]);
  });
});

describe('buildDayIndexMap', () => {
  it('attribue des indices séquentiels par jour', () => {
    const placements: FetActivityPlacement[] = [
      { activityId: 'a1', day: 'Lundi', hour: 'H1', room: 'R1' },
      { activityId: 'a2', day: 'Mardi', hour: 'H1', room: 'R2' },
      { activityId: 'a3', day: 'Lundi', hour: 'H2', room: 'R1' },
    ];
    const map = buildDayIndexMap(placements);
    expect(map.get('Lundi')).toBe(0);
    expect(map.get('Mardi')).toBe(1);
  });
});

describe('buildHourIndexMap', () => {
  it('attribue des indices séquentiels par heure', () => {
    const placements: FetActivityPlacement[] = [
      { activityId: 'a1', day: 'Lundi', hour: 'H1', room: 'R1' },
      { activityId: 'a2', day: 'Lundi', hour: 'H2', room: 'R2' },
      { activityId: 'a3', day: 'Lundi', hour: 'H1', room: 'R1' },
    ];
    const map = buildHourIndexMap(placements);
    expect(map.get('H1')).toBe(0);
    expect(map.get('H2')).toBe(1);
  });
});

describe('jourIndexToJourSemaine', () => {
  it('mappe les index 0-5 vers les jours', () => {
    expect(jourIndexToJourSemaine(0)).toBe('LUNDI');
    expect(jourIndexToJourSemaine(1)).toBe('MARDI');
    expect(jourIndexToJourSemaine(4)).toBe('VENDREDI');
    expect(jourIndexToJourSemaine(5)).toBe('SAMEDI');
  });

  it('retourne undefined pour un index hors bornes', () => {
    expect(jourIndexToJourSemaine(6)).toBeUndefined();
    expect(jourIndexToJourSemaine(-1)).toBeUndefined();
  });
});
