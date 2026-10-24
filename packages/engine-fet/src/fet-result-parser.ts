// SPDX-License-Identifier: AGPL-3.0-only
// @takt/engine-fet — Parseur du résultat FET (activities_timetable.xml)
// Format FET : <Activity><Id>…</Id><Day>…</Day><Hour>…</Hour><Room>…</Room></Activity>
// Aucun attribut, aucun namespace : parseur regex dédié, sans nouvelle dépendance.

export interface FetActivityPlacement {
  readonly activityId: string; // ID technique FET (fetId de l'activité EngineInput)
  readonly day: string;        // Nom du jour FET (ex: "Lundi", "Monday")
  readonly hour: string;       // Nom du créneau FET (ex: "H1", "Hour 1")
  readonly room: string | null; // Nom de la salle FET (fetId du code salle), null si aucune
}

/**
 * Parse le contenu d'un fichier activities_timetable.xml produit par fet-cl.
 * Retourne une entrée par activité placée.
 */
export function parseActivitiesTimetableXml(xml: string): FetActivityPlacement[] {
  const placements: FetActivityPlacement[] = [];

  // Le XML FET est simple et prévisible : une balise <Activity> par placement.
  // On utilise un regex dédié plutôt qu'un parseur DOM pour éviter une nouvelle dépendance.
  const activityRegex =
    /<Activity>\s*<Id>([^<]+)<\/Id>\s*<Day>([^<]+)<\/Day>\s*<Hour>([^<]+)<\/Hour>\s*<Room>([^<]*)<\/Room>/g;

  let match: RegExpExecArray | null;
  while ((match = activityRegex.exec(xml)) !== null) {
    placements.push({
      activityId: match[1].trim(),
      day: match[2].trim(),
      hour: match[3].trim(),
      room: match[4].trim() || null,
    });
  }

  return placements;
}

/**
 * Construit un mapping nom-jour-FET → index de jour (0-based) à partir des placements.
 * Les jours sont triés par ordre d'apparition pour correspondre à l'affectation
 * séquentielle faite par buildFetDocument (tri par dayIndex).
 */
export function buildDayIndexMap(placements: readonly FetActivityPlacement[]): Map<string, number> {
  const dayIndexMap = new Map<string, number>();
  const seenDays = new Set<string>();
  let idx = 0;
  for (const p of placements) {
    if (!seenDays.has(p.day)) {
      seenDays.add(p.day);
      dayIndexMap.set(p.day, idx);
      idx += 1;
    }
  }
  return dayIndexMap;
}

/**
 * Construit un mapping nom-heure-FET → index de créneau (0-based) à partir des placements.
 */
export function buildHourIndexMap(placements: readonly FetActivityPlacement[]): Map<string, number> {
  const hourIndexMap = new Map<string, number>();
  const seenHours = new Set<string>();
  let idx = 0;
  for (const p of placements) {
    if (!seenHours.has(p.hour)) {
      seenHours.add(p.hour);
      hourIndexMap.set(p.hour, idx);
      idx += 1;
    }
  }
  return hourIndexMap;
}

/**
 * Ordre canonique des jours de la semaine (index 0 = LUNDI).
 */
const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'] as const;

/**
 * Mappe un index de jour (0-based) vers l'énumération JourSemaine de Prisma.
 * Retourne undefined si l'index est hors bornes.
 */
export function jourIndexToJourSemaine(index: number): string | undefined {
  return JOURS_SEMAINE[index];
}
