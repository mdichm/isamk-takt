// recompute.ts — Recalcul complet et incrémental des conflits (ST §4.3).
// Paquet pur, sans dépendance NestJS ni Prisma.
//
// - computeConflicts : recalcul complet de toutes les séances d'une version
// - impactedSeances  : séences impactées par un déplacement (ancien + nouvel emplacement)

import { computeSignature, type SlotKey } from './signature.js';
import {
  validatePlacement,
  type Conflit,
  type ConflitType,
  type ConflitSeverite,
  type SeanceInput,
  type ConflictContext,
} from './validate-placement.js';

// ============================================================================
// Types
// ============================================================================

export interface SeancePlacement {
  seance: SeanceInput;
  jour: string;
  creneauDebut: string;
  salle: string;
}

export interface Placement {
  jour: string;
  creneauDebut: string;
  salle: string;
}

// ============================================================================
// Recalcul complet
// ============================================================================

/**
 * Calcule l'ensemble des conflits d'un lot de séances avec leur placement actuel.
 *
 * - Séances PLACEE : validation de leur placement actuel via validatePlacement
 * - Séances NON_PLACEE : conflit SESSION_UNPLACED
 *
 * Complexité : O(S × n × g × h) où S = nombre de séances, n ≤ 4 créneaux,
 * g = groupes par séance, h = taille de fermeture de groupe.
 */
export function computeConflicts(
  seancesAvecPlacement: SeancePlacement[],
  ctx: ConflictContext,
): Conflit[] {
  const conflits: Conflit[] = [];

  for (const { seance, jour, creneauDebut, salle } of seancesAvecPlacement) {
    if (seance.statut === 'NON_PLACEE') {
      const signature = computeSignature(
        'SESSION_UNPLACED',
        [seance.id],
        'seance',
        seance.id,
        [],
      );
      conflits.push({
        regleCode: 'SESSION_UNPLACED',
        type: 'COMPLETUDE' as ConflitType,
        severite: 'BLOQUANT' as ConflitSeverite,
        objetType: 'seance',
        objetId: seance.id,
        seanceIds: [seance.id],
        message: 'Séance non placée',
        signature,
      });
      continue;
    }

    const c = validatePlacement(seance, { jour, creneauDebut, salle }, ctx);
    conflits.push(...c);
  }

  return conflits;
}

// ============================================================================
// Recalcul incrémental : séances impactées par un déplacement
// ============================================================================

/**
 * Retourne les IDs des séances qui partageaient une ressource (enseignant,
 * salle ou groupe via la fermeture hiérarchique) avec l'ancien ou le nouvel
 * emplacement de la séance déplacée.
 *
 * Ces séances sont les seules dont les conflits peuvent changer : seul leur
 * recalcul est nécessaire (recalcul incrémental, ST §4.3).
 */
export function impactedSeances(
  seance: SeanceInput,
  oldPlacement: Placement,
  newPlacement: Placement,
  ctx: ConflictContext,
): string[] {
  const impacted = new Set<string>();

  // Créneaux couverts par l'ancien et le nouvel emplacement
  const oldSlots = ctx.grille.consecutifs(
    oldPlacement.jour,
    oldPlacement.creneauDebut,
    seance.nbCreneaux,
  ) ?? [];
  const newSlots = ctx.grille.consecutifs(
    newPlacement.jour,
    newPlacement.creneauDebut,
    seance.nbCreneaux,
  ) ?? [];
  const slotsToCheck = new Set<SlotKey>([...oldSlots, ...newSlots]);

  const sallesToCheck = new Set([oldPlacement.salle, newPlacement.salle]);

  for (const slotKey of slotsToCheck) {
    const slot = ctx.occ.get(slotKey);
    if (!slot) continue;

    // --- Enseignant (identique sur ancien et nouvel emplacement) ---
    const ensOcc = slot.ens.get(seance.enseignantId);
    if (ensOcc) impacted.add(ensOcc.seanceId);

    // --- Salle (ancienne et nouvelle) ---
    for (const salle of sallesToCheck) {
      const salleOcc = slot.salle.get(salle);
      if (salleOcc) impacted.add(salleOcc.seanceId);
    }

    // --- Groupes (avec fermeture hiérarchique : ancêtres + descendants) ---
    for (const gId of seance.groupes) {
      const groupesConcernes = new Set<string>([gId]);
      const closure = ctx.groupeClosure?.get(gId);
      if (closure) {
        for (const a of closure.ancetres) groupesConcernes.add(a);
        for (const d of closure.descendants) groupesConcernes.add(d);
      }
      for (const h of groupesConcernes) {
        const autre = slot.groupe.get(h);
        if (autre) impacted.add(autre.seanceId);
      }
    }
  }

  // La séance déplacée elle-même n'est pas "impactée" par son propre mouvement
  impacted.delete(seance.id);

  return Array.from(impacted);
}
