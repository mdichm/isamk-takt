// ============================================================
// @takt/engine-fet — Construction des entités du fichier FET (.fet)
// Déterministe : mêmes entrées, même fichier octet à octet.
// Aucune identité en clair : seuls les codes techniques sont écrits.
// ============================================================

import { create } from 'xmlbuilder2';
import type {
  EngineActivity,
  EngineActivityTag,
  EngineConstraint,
  EngineFile,
  EngineGroup,
  EngineInput,
  EngineRoom,
  EngineTeacher,
} from '@takt/contracts';
import { createHash } from 'crypto';

const BUILDER_VERSION = '0.0.1';
const FET_ENGINE_VERSION = '7.12.0';

/** Génère un identifiant technique FET court et déterministe à partir d'une chaîne d'entrée. */
function fetId(input: string): string {
  return createHash('sha256').update(input).digest('hex').substring(0, 8).toUpperCase();
}

/** Ordonne un tableau readonly par id pour garantir la déterminisme. */
function byId<T extends { readonly id: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

/** Construit le document XML FET à partir d'un EngineInput. */
export function buildFetDocument(input: EngineInput): string {
  const periods = byId(input.periods);
  const teachers = byId(input.teachers);
  const groups = byId(input.groups);
  const rooms = byId(input.rooms);
  const tags = byId(input.activityTags);
  const activities = byId(input.activities);

  // Nombre de jours distincts et de créneaux par jour (déterministe)
  const dayIndices = [...new Set(periods.map((p) => p.dayIndex))].sort((a, b) => a - b);
  const maxSlotsPerDay = Math.max(
    0,
    ...periods.map((p) => p.slotIndex + 1)
  );

  const root = create({
    fet: {
      instruction: 'TAKT — ISAMK emploi du temps',
      comments: `Généré par @takt/engine-fet v${BUILDER_VERSION} avec FET ${FET_ENGINE_VERSION}`,
      days: dayIndices.length.toString(),
      hours_per_day: maxSlotsPerDay.toString(),

      teachers: {
        teacher: teachers.map((t) => ({
          name: fetId(t.code),
        })),
      },

      students: {
        students_set: groups.map((g) => ({
          name: fetId(g.code),
        })),
      },

      rooms: {
        room: rooms.map((r) => ({
          name: fetId(r.code),
        })),
      },

      activity_tags: {
        activity_tag: tags.map((tag) => ({
          name: fetId(tag.code),
        })),
      },

      activities: {
        activity: activities.map((a) => buildActivityXml(a, teachers, groups, rooms, tags)),
      },

      constraints: {
        // Les contraintes dures seront ajoutées dans L4-04
        // Les verrous seront ajoutés dans L4-05
      },
    },
  }, { version: '1.0', encoding: 'UTF-8', standalone: null });

  return root.end({ prettyPrint: true, indent: '  ', newline: '\n' });
}

function buildActivityXml(
  activity: EngineActivity,
  teachers: readonly EngineTeacher[],
  groups: readonly EngineGroup[],
  rooms: readonly EngineRoom[],
  tags: readonly EngineActivityTag[]
): Record<string, unknown> {
  const activityTags = activity.activityTagIds
    .map((tagId) => fetId(tags.find((t) => t.id === tagId)?.code ?? tagId))
    .filter(Boolean);

  return {
    id: fetId(activity.id),
    teacher: activity.teacherIds.map((tid) => fetId(teachers.find((t) => t.id === tid)?.code ?? tid)).filter(Boolean),
    students: activity.groupIds.map((gid) => fetId(groups.find((g) => g.id === gid)?.code ?? gid)).filter(Boolean),
    subject: activity.code,
    activity_tag: activityTags.length > 0 ? activityTags : [tags[0]?.code].filter(Boolean),
    duration: activity.durationInSlots.toString(),
    min_hours: activity.minRooms.toString(),
    max_hours: activity.maxRooms.toString(),
  };
}

/**
 * Construit un EngineFile à partir d'un EngineInput.
 * C'est l'implémentation de SchedulingEngine.buildProfile().
 *
 * Déterministe : mêmes entrées → même fichier octet à octet.
 * Aucune identité en clair : seuls les codes techniques apparaissent dans le XML.
 */
export function buildProfile(input: EngineInput): EngineFile {
  const xml = buildFetDocument(input);
  const payload = Buffer.from(xml, 'utf-8');
  const sha256 = createHash('sha256').update(payload).digest('hex');

  // Rapport de traduction : toutes les contraintes sont marquées NON_TRADUITE à ce stade
  // (les contraintes dures seront traduites dans L4-04, les verrous dans L4-05)
  const mappingReport = input.constraints.map((c: EngineConstraint) => ({
    ruleId: c.id,
    status: 'NON_TRADUITE' as const,
    reason: 'Contrainte non encore traduite vers FET (L4-04)',
  }));

  // Les verrous sont également non traduits à ce stade (L4-05)
  for (const lock of input.locks) {
    mappingReport.push({
      ruleId: lock.id,
      status: 'NON_TRADUITE' as const,
      reason: 'Verrou non encore traduit vers FET (L4-05)',
    });
  }

  return {
    engineVersion: FET_ENGINE_VERSION,
    builderVersion: BUILDER_VERSION,
    payload,
    sha256,
    mappingReport,
  };
}