// validatePlacement — moteur de détection de conflits (ST §4.3).
// Paquet pur, sans dépendance NestJS ni Prisma.
// Complexité : O(n × g × h) par contrôle (n ≤ 4 créneaux, g groupes, h taille de fermeture).

import { computeSignature, type SlotKey } from './signature.js';
import { OccupancyIndex } from './occupancy-index.js';
import { GroupeClosure } from './groupe-closure.js';
import { IndispoSet } from './indispo-set.js';
import { Reqs } from './reqs.js';
import { SnapshotIndex } from './snapshot-index.js';
import { VerrouIndex } from './verrou-index.js';

// ============================================================================
// Types
// ============================================================================

export type ConflitType =
  | 'ENSEIGNANT' | 'SALLE' | 'GROUPE' | 'CAPACITE' | 'DISPONIBILITE'
  | 'COMPATIBILITE' | 'PEDAGOGIQUE' | 'COMPLETUDE' | 'VERROU'
  | 'COVOITURAGE' | 'VOEU';

export type ConflitSeverite = 'BLOQUANT' | 'AVERTISSEMENT' | 'INFORMATION';

export interface Conflit {
  regleCode: string;
  type: ConflitType;
  severite: ConflitSeverite;
  objetType: string;
  objetId: string;
  seanceIds: string[];
  message: string;
  signature: string;
  details?: Record<string, unknown>;
}

export interface SeanceInput {
  id: string;
  enseignantId: string;
  salleId: string;
  groupes: string[];
  nbCreneaux: number;
  tag: string;
  moduleId: string;
  typeEnseignementId: string;
  statut: 'PLACEE' | 'NON_PLACEE';
  versionId: string;
  volumePlace?: number; // minutes déjà placées (défaut 0)
}

export interface PlacementCandidat {
  jour: string;
  creneauDebut: string;
  salle: string;
}

export interface SalleData {
  id: string;
  capaciteMax: number;
  capaciteRecommandee?: number;
  typeSalleId?: string;
  departementId?: string;
}

export interface ConflictContext {
  versionId: string;
  grille: {
    consecutifs(jour: string, creneauDebut: string, nbCreneaux: number): SlotKey[] | null;
  };
  occ: OccupancyIndex;
  indispo: IndispoSet;
  reqs: Reqs;
  snapshot: SnapshotIndex;
  verrous: VerrouIndex;
  salles: Map<string, SalleData>;
  salleEquipements: Map<string, string[]>;
  salleTags: Map<string, string[]>;
  creneaux: Map<string, { estPause: boolean; ordre: number; jour: string }>;
  groupeEffectifs: Map<string, number>;
  covoiturageGroupes: Map<string, { membres: string[]; margeMinutes: number; joursCommunsMin: number; strict: boolean }>;
  groupeClosure?: GroupeClosure;
}

// ============================================================================
// Helpers
// ============================================================================

function conflit(
  regleCode: string,
  type: ConflitType,
  severite: ConflitSeverite,
  objetType: string,
  objetId: string,
  seanceIds: string[],
  message: string,
  slotKeys: SlotKey[],
  details?: Record<string, unknown>,
): Conflit {
  return {
    regleCode,
    type,
    severite,
    objetType,
    objetId,
    seanceIds: [...seanceIds].sort(),
    message,
    signature: computeSignature(regleCode, seanceIds, objetType, objetId, slotKeys),
    details,
  };
}

function getSlotJourCreneau(slotKey: SlotKey): { jour: string; creneauId: string } {
  const sep = slotKey.indexOf('|');
  return { jour: slotKey.slice(0, sep), creneauId: slotKey.slice(sep + 1) };
}
// ============================================================================
// validatePlacement
// ============================================================================

export function validatePlacement(seance: SeanceInput, candidat: PlacementCandidat, ctx: ConflictContext): Conflit[] {
  const conflits: Conflit[] = [];
  const slots = ctx.grille.consecutifs(candidat.jour, candidat.creneauDebut, seance.nbCreneaux);
  if (slots === null) {
    conflits.push(conflit('SLOT_SPANS_BREAK','COMPATIBILITE','BLOQUANT','seance',seance.id,[seance.id],`Pause/fin de journée`,[],{jour:candidat.jour,creneauDebut:candidat.creneauDebut,nbCreneaux:seance.nbCreneaux}));
    return conflits;
  }
  const slotKeys = slots;

  // --- 1. Double réservation enseignant / salle ---
  for (const slotKey of slotKeys) {
    const slot = ctx.occ.get(slotKey);
    if (!slot) continue;
    const ensOcc = slot.ens.get(seance.enseignantId);
    if (ensOcc && ensOcc.seanceId !== seance.id) {
      conflits.push(conflit('TEACHER_DOUBLE_BOOKING','ENSEIGNANT','BLOQUANT','enseignant',seance.enseignantId,[seance.id,ensOcc.seanceId],`Ens occupé par ${ensOcc.seanceId} à ${slotKey}`,[slotKey]));
    }
    const salleOcc = slot.salle.get(candidat.salle);
    if (salleOcc && salleOcc.seanceId !== seance.id) {
      conflits.push(conflit('ROOM_DOUBLE_BOOKING','SALLE','BLOQUANT','salle',candidat.salle,[seance.id,salleOcc.seanceId],`Salle occupée par ${salleOcc.seanceId} à ${slotKey}`,[slotKey]));
    }
  }

  // --- 2. Indisponibilités enseignant / salle ---
  for (const slotKey of slotKeys) {
    const { jour, creneauId } = getSlotJourCreneau(slotKey);
    const creneau = ctx.creneaux.get(creneauId);
    const ordre = creneau ? creneau.ordre : 0;
    if (ctx.indispo.has('ENSEIGNANT',seance.enseignantId,jour,ordre)) {
      conflits.push(conflit('TEACHER_UNAVAILABLE','DISPONIBILITE','BLOQUANT','enseignant',seance.enseignantId,[seance.id],`Ens indispo ${jour}/${ordre}`,[slotKey]));
    }
    if (ctx.indispo.has('SALLE',candidat.salle,jour,ordre)) {
      conflits.push(conflit('ROOM_UNAVAILABLE','DISPONIBILITE','BLOQUANT','salle',candidat.salle,[seance.id],`Salle indispo ${jour}/${ordre}`,[slotKey]));
    }
  }

  // --- 4. Capacité de salle ---
  const salle = ctx.salles.get(candidat.salle);
  if (salle) {
    // Déduplication des groupes : l'ancêtre prime sur le descendant
    // (un groupe et son ancêtre ne sont pas comptés deux fois)
    const representants = new Set<string>();
    for (const gId of seance.groupes) {
      let rep = gId;
      if (ctx.groupeClosure) {
        const closure = ctx.groupeClosure.get(gId);
        if (closure && closure.ancetres.length > 0) {
          rep = closure.ancetres[closure.ancetres.length - 1]; // ancêtre le plus haut
        }
      }
      representants.add(rep);
    }
    let effectifTotal = 0;
    for (const rep of representants) effectifTotal += ctx.groupeEffectifs.get(rep) ?? 0;
    if (effectifTotal > salle.capaciteMax) {
      conflits.push(conflit('ROOM_CAPACITY','CAPACITE','BLOQUANT','salle',candidat.salle,[seance.id],`Eff ${effectifTotal} > capMax ${salle.capaciteMax}`,slotKeys));
    } else if (salle.capaciteRecommandee != null && effectifTotal > salle.capaciteRecommandee) {
      conflits.push(conflit('ROOM_CAPACITY_RECOMMENDED','CAPACITE','AVERTISSEMENT','salle',candidat.salle,[seance.id],`Eff ${effectifTotal} > capRec ${salle.capaciteRecommandee}`,slotKeys));
    }
  }

  // --- 5. Compatibilités salle (tag, équipement, salle imposée / liste autorisée) ---
  const reqs = ctx.reqs.get(seance.id);
  const salleTags = ctx.salleTags.get(candidat.salle) ?? [];
  const salleEquipements = ctx.salleEquipements.get(candidat.salle) ?? [];
  if (reqs?.activityTag && !salleTags.includes(reqs.activityTag)) {
    conflits.push(conflit('ROOM_TAG_INCOMPATIBLE','COMPATIBILITE','BLOQUANT','salle',candidat.salle,[seance.id],`Tag ${reqs.activityTag} non autorisé`,slotKeys));
  }
  if (reqs) {
    for (const equip of reqs.equipementsObligatoires) {
      if (!salleEquipements.includes(equip)) {
        conflits.push(conflit('ROOM_EQUIPMENT_MISSING','COMPATIBILITE','BLOQUANT','salle',candidat.salle,[seance.id],`Équipement obligatoire ${equip} absent`,slotKeys,{niveau:'OBLIGATOIRE'}));
      }
    }
    for (const equip of reqs.equipementsSouhaites) {
      if (!salleEquipements.includes(equip)) {
        conflits.push(conflit('ROOM_EQUIPMENT_MISSING','COMPATIBILITE','AVERTISSEMENT','salle',candidat.salle,[seance.id],`Équipement souhaité ${equip} absent`,slotKeys,{niveau:'SOUHAITE'}));
      }
    }
  }
  if (reqs?.salleImposee && reqs.salleImposee !== candidat.salle) {
    conflits.push(conflit('ROOM_NOT_ALLOWED','COMPATIBILITE','BLOQUANT','salle',candidat.salle,[seance.id],`Salle imposée ${reqs.salleImposee} ≠ ${candidat.salle}`,slotKeys));
  }
  if (reqs?.sallesAutorisees && !reqs.sallesAutorisees.includes(candidat.salle)) {
    conflits.push(conflit('ROOM_NOT_ALLOWED','COMPATIBILITE','BLOQUANT','salle',candidat.salle,[seance.id],`Salle hors liste autorisée`,slotKeys));
  }

  // --- 6. Pédagogique ---
  const volumePlace = seance.volumePlace ?? 0;
  for (const gId of seance.groupes) {
    const snap = ctx.snapshot.get(gId, seance.moduleId, seance.typeEnseignementId);
    if (snap && !snap.enseignantsAutorises.includes(seance.enseignantId)) {
      conflits.push(conflit('TEACHER_NOT_IN_SNAPSHOT','PEDAGOGIQUE','BLOQUANT','enseignant',seance.enseignantId,[seance.id],`Ens non dans snapshot groupe ${gId}`,slotKeys));
    }
    const snap2 = ctx.snapshot.get(gId, seance.moduleId, seance.typeEnseignementId);
    if (snap2 && seance.nbCreneaux * 30 !== snap2.dureeCreneaux) {
      conflits.push(conflit('SESSION_DURATION_MISMATCH','PEDAGOGIQUE','BLOQUANT','seance',seance.id,[seance.id],`Durée ${seance.nbCreneaux} ≠ ${snap2.dureeCreneaux}min`,slotKeys));
    }
    if (snap2) {
      if (volumePlace > snap2.volumeAttendu) {
        conflits.push(conflit('SESSION_OVERPLANNED','PEDAGOGIQUE','BLOQUANT','seance',seance.id,[seance.id],`Volume ${volumePlace} > attendu ${snap2.volumeAttendu}`,slotKeys));
      } else if (volumePlace < snap2.volumeAttendu) {
        conflits.push(conflit('COVERAGE_INCOMPLETE','COMPLETUDE','BLOQUANT','seance',seance.id,[seance.id],`Volume ${volumePlace} < attendu ${snap2.volumeAttendu}`,slotKeys));
      }
    }
  }

  // --- 7. Complétude ---
  if (seance.statut === 'NON_PLACEE') {
    conflits.push(conflit('SESSION_UNPLACED','COMPLETUDE','BLOQUANT','seance',seance.id,[seance.id],`Séance non placée`,slotKeys));
  }

  // --- 8. Verrous ---
  for (const type of ['CRENEAU','SALLE','ENSEIGNANT','ACTIVITE']) {
    if (ctx.verrous.has(seance.id, type)) {
      conflits.push(conflit('LOCK_VIOLATED','VERROU','BLOQUANT','seance',seance.id,[seance.id],`Séance verrouillée (${type})`,slotKeys));
    }
  }

  return conflits;
}

// ============================================================================
// Wrapper avec GroupeClosure
// ============================================================================

export interface ValidatePlacementCtx extends ConflictContext {
  groupeClosure: GroupeClosure;
}

export function validatePlacementWithGroups(seance: SeanceInput, candidat: PlacementCandidat, ctx: ValidatePlacementCtx): Conflit[] {
  const conflits = validatePlacement(seance, candidat, ctx);
  const slots = ctx.grille.consecutifs(candidat.jour, candidat.creneauDebut, seance.nbCreneaux) ?? [];
  for (const slotKey of slots) {
    const slot = ctx.occ.get(slotKey);
    if (!slot) continue;
    for (const gId of seance.groupes) {
      const closure = ctx.groupeClosure.get(gId);
      if (!closure) continue;
      const groupesConcernes = new Set([closure.soi, ...closure.ancetres, ...closure.descendants]);
      for (const h of groupesConcernes) {
        const autre = slot.groupe.get(h);
        if (autre && autre.seanceId !== seance.id) {
          conflits.push(conflit('GROUP_DOUBLE_BOOKING','GROUPE','BLOQUANT','groupe',h,[seance.id,autre.seanceId],`Groupe ${h} (fermeture ${gId}) occupé par ${autre.seanceId}`,[slotKey]));
        }
      }
    }
  }
  return conflits;
}

