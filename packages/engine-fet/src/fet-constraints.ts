// ============================================================
// @takt/engine-fet — Traduction des contraintes dures vers XML FET
// Déterministe : mêmes entrées, même XML octet à octet.
// Aucune identité en clair : seuls les codes techniques hachés apparaissent.
// ============================================================

import type {
  EngineActivity,
  EngineConstraint,
  EngineGroup,
  EngineLock,
  EnginePeriod,
  EngineRoom,
  EngineTeacher,
} from '@takt/contracts';
import { createHash } from 'crypto';

const WEIGHT_HARD = 100;

function fetId(input: string): string {
  return createHash('sha256').update(input).digest('hex').substring(0, 8).toUpperCase();
}

function byId<T extends { readonly id: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

interface ConstraintTranslation {
  readonly element: Record<string, unknown> | null;
  readonly status: 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';
  readonly reason?: string;
}

function translateConstraint(
  constraint: EngineConstraint,
  activities: readonly EngineActivity[],
  teachers: readonly EngineTeacher[],
  groups: readonly EngineGroup[],
  rooms: readonly EngineRoom[],
): ConstraintTranslation {
  const { type, entityIds, parameters, weight } = constraint;
  if (weight === 0) {
    return { element: null, status: 'NON_TRADUITE', reason: 'Contrainte inactivée (poids = 0)' };
  }
  const params = parameters as Record<string, unknown>;
  switch (type) {
    case 'TEACHER_AVAILABILITY': {
      const teacherId = entityIds[0];
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Enseignant introuvable' };
      }
      const dayIndex = params['dayIndex'];
      const slotIndex = params['slotIndex'];
      const duration = (params['durationInSlots'] as number) ?? 1;
      if (dayIndex === undefined || slotIndex === undefined) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Paramètres dayIndex/slotIndex manquants' };
      }
      return {
        element: {
          ConstraintTeacherNotAvailableTimes: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Teacher: fetId(teacher.code),
            Day: String(dayIndex),
            Hour: String(slotIndex),
            Duration: String(duration),
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'GROUP_AVAILABILITY': {
      const groupId = entityIds[0];
      const group = groups.find((g) => g.id === groupId);
      if (!group) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Groupe introuvable' };
      }
      const dayIndex = params['dayIndex'];
      const slotIndex = params['slotIndex'];
      const duration = (params['durationInSlots'] as number) ?? 1;
      if (dayIndex === undefined || slotIndex === undefined) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Paramètres dayIndex/slotIndex manquants' };
      }
      return {
        element: {
          ConstraintStudentsNotAvailableTimes: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Students: fetId(group.code),
            Day: String(dayIndex),
            Hour: String(slotIndex),
            Duration: String(duration),
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'ROOM_CAPACITY':
    case 'ROOM_AVAILABILITY': {
      const roomId = entityIds[0];
      const room = rooms.find((r) => r.id === roomId);
      if (!room) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Salle introuvable' };
      }
      const dayIndex = params['dayIndex'];
      const slotIndex = params['slotIndex'];
      const duration = (params['durationInSlots'] as number) ?? 1;
      if (dayIndex === undefined || slotIndex === undefined) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Paramètres dayIndex/slotIndex manquants' };
      }
      return {
        element: {
          ConstraintRoomNotAvailableTimes: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Room: fetId(room.code),
            Day: String(dayIndex),
            Hour: String(slotIndex),
            Duration: String(duration),
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'SALLE_IMPOSEE': {
      const activityId = entityIds[0];
      const roomId = entityIds[1];
      const activity = activities.find((a) => a.id === activityId);
      const room = rooms.find((r) => r.id === roomId);
      if (!activity || !room) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Activité ou salle introuvable' };
      }
      return {
        element: {
          ConstraintActivityPreferredRoom: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Activity: fetId(activity.id),
            Room: fetId(room.code),
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'SALLE_AUTORISEES': {
      const activityId = entityIds[0];
      const roomIds = entityIds.slice(1);
      const activity = activities.find((a) => a.id === activityId);
      if (!activity || roomIds.length === 0) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Activité ou salles introuvables' };
      }
      const roomHashes = roomIds
        .map((rid) => {
          const r = rooms.find((room) => room.id === rid);
          return r ? fetId(r.code) : null;
        })
        .filter((r): r is string => r !== null);
      return {
        element: {
          ConstraintActivityPreferredRooms: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Activity: fetId(activity.id),
            Room: roomHashes.length > 0 ? roomHashes : [],
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'MIN_GAP_BETWEEN_ACTIVITIES': {
      const activityIds = entityIds;
      const minDays = (params['minDays'] as number) ?? 1;
      const foundActivities = activityIds.map((aid) => activities.find((a) => a.id === aid));
      if (foundActivities.some((a) => !a)) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Une ou plusieurs activités introuvables' };
      }
      return {
        element: null,
        status: 'PARTIELLE',
        reason: `Contrainte d'espacement (min ${minDays} jours) — partiellement supportée`,
      };
    }
    case 'NO_CONFLICT_TEACHER':
    case 'NO_CONFLICT_ROOM':
      return {
        element: null,
        status: 'PARTIELLE',
        reason: 'Conflit implicite géré par l\'application, pas de contrainte FET générée',
      };
    case 'PAUSE': {
      const dayIndex = params['dayIndex'];
      const slotIndex = params['slotIndex'];
      const duration = (params['durationInSlots'] as number) ?? 1;
      if (dayIndex === undefined || slotIndex === undefined) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Paramètres dayIndex/slotIndex manquants' };
      }
      return {
        element: {
          ConstraintBasicCompulsoryTime: {
            Weight_Percentage: WEIGHT_HARD.toString(),
            Active: 'true',
            Name: 'Pause',
            Day: String(dayIndex),
            Hour: String(slotIndex),
            Duration: String(duration),
          },
        },
        status: 'TRADUITE',
      };
    }
    case 'ACTIVITY_TIME_PREFERENCE': {
      const activityId = entityIds[0];
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Activité introuvable' };
      }
      const dayIndex = params['dayIndex'];
      const slotIndex = params['slotIndex'];
      const duration = (params['durationInSlots'] as number) ?? 1;
      if (dayIndex === undefined || slotIndex === undefined) {
        return { element: null, status: 'NON_TRADUITE', reason: 'Paramètres dayIndex/slotIndex manquants' };
      }
      return {
        element: {
          ConstraintActivityPreferredTime: {
            Weight_Percentage: String(weight),
            Active: 'true',
            Activity: fetId(activity.id),
            Day: String(dayIndex),
            Hour: String(slotIndex),
            Duration: String(duration),
          },
        },
        status: 'TRADUITE',
      };
    }
    default:
      return {
        element: null,
        status: 'NON_TRADUITE',
        reason: `Type de contrainte non supporté: ${type}`,
      };
  }
}

/**
 * Construit le bloc <constraints> du document FET à partir des contraintes dures.
 *
 * Retourne les éléments XML à intégrer dans le document et le mappingReport
 * avec le statut de traduction de chaque contrainte.
 */
export function buildConstraintsXml(input: {
  readonly constraints: readonly EngineConstraint[];
  readonly activities: readonly EngineActivity[];
  readonly teachers: readonly EngineTeacher[];
  readonly groups: readonly EngineGroup[];
  readonly rooms: readonly EngineRoom[];
}): {
  readonly constraintsElements: readonly Record<string, unknown>[];
  readonly mappingReport: readonly {
    readonly ruleId: string;
    readonly status: 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';
    readonly reason?: string;
  }[];
} {
  const { constraints, activities, teachers, groups, rooms } = input;
  const sortedConstraints = byId(constraints);

  const mappingReport: {
    ruleId: string;
    status: 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';
    reason?: string;
  }[] = [];

  const constraintElements: Record<string, unknown>[] = [];

  for (const constraint of sortedConstraints) {
    const translation = translateConstraint(constraint, activities, teachers, groups, rooms);
    mappingReport.push({
      ruleId: constraint.id,
      status: translation.status,
      reason: translation.reason,
    });

    if (translation.element) {
      constraintElements.push(translation.element);
    }
  }

  return {
    constraintsElements: constraintElements,
    mappingReport,
  };
}

/** Résultat de traduction d'un verrou : 0, 1 ou 2 éléments XML selon les champs remplis. */
interface LockTranslation {
  readonly elements: readonly Record<string, unknown>[];
  readonly status: 'TRADUITE' | 'NON_TRADUITE';
  readonly reason?: string;
}

/**
 * Traduit un EngineLock en éléments XML FET.
 * - periodId uniquement → ConstraintActivityPreferredTime (100 %)
 * - roomId uniquement → ConstraintActivityPreferredRoom (100 %)
 * - les deux → les deux contraintes (100 % chacune)
 * - aucun des deux → NON_TRADUITE "Aucun créneau ni salle spécifiés"
 * - activité introuvable → NON_TRADUITE "Activité introuvable"
 */
function translateLock(
  lock: EngineLock,
  activities: readonly EngineActivity[],
  periods: readonly EnginePeriod[],
  rooms: readonly EngineRoom[],
): LockTranslation {
  const activity = activities.find((a) => a.id === lock.activityId);
  if (!activity) {
    return { elements: [], status: 'NON_TRADUITE', reason: 'Activité introuvable' };
  }

  if (!lock.periodId && !lock.roomId) {
    return { elements: [], status: 'NON_TRADUITE', reason: 'Aucun créneau ni salle spécifiés' };
  }

  const elements: Record<string, unknown>[] = [];

  if (lock.periodId) {
    const period = periods.find((p) => p.id === lock.periodId);
    if (!period) {
      return { elements: [], status: 'NON_TRADUITE', reason: 'Période introuvable' };
    }
    elements.push({
      ConstraintActivityPreferredTime: {
        Weight_Percentage: WEIGHT_HARD.toString(),
        Active: 'true',
        Activity: fetId(activity.id),
        Day: String(period.dayIndex),
        Hour: String(period.slotIndex),
        Duration: '1',
      },
    });
  }

  if (lock.roomId) {
    const room = rooms.find((r) => r.id === lock.roomId);
    if (!room) {
      return { elements: [], status: 'NON_TRADUITE', reason: 'Salle introuvable' };
    }
    elements.push({
      ConstraintActivityPreferredRoom: {
        Weight_Percentage: WEIGHT_HARD.toString(),
        Active: 'true',
        Activity: fetId(activity.id),
        Room: fetId(room.code),
      },
    });
  }

  return { elements, status: 'TRADUITE' };
}

/**
 * Construit les éléments XML FET et le mappingReport pour les verrous.
 * Les verrous sont triés par id pour garantir la déterminisme.
 */
export function buildLocksXml(input: {
  readonly locks: readonly EngineLock[];
  readonly activities: readonly EngineActivity[];
  readonly periods: readonly EnginePeriod[];
  readonly rooms: readonly EngineRoom[];
}): {
  readonly lockElements: readonly Record<string, unknown>[];
  readonly mappingReport: readonly {
    readonly ruleId: string;
    readonly status: 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';
    readonly reason?: string;
  }[];
} {
  const { locks, activities, periods, rooms } = input;
  const sortedLocks = byId(locks);

  const mappingReport: {
    ruleId: string;
    status: 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';
    reason?: string;
  }[] = [];

  const lockElements: Record<string, unknown>[] = [];

  for (const lock of sortedLocks) {
    const translation = translateLock(lock, activities, periods, rooms);
    mappingReport.push({
      ruleId: lock.id,
      status: translation.status,
      reason: translation.reason,
    });

    for (const element of translation.elements) {
      lockElements.push(element);
    }
  }

  return {
    lockElements,
    mappingReport,
  };
}