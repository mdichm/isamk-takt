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
  placeInitiale?: { salleId?: string }; // salle initialement assignée, pour détecter un déplacement de salle
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
  creneaux: Map<string, { estPause: boolean; ordre: number; jour: string; heureDebutMinutes: number }>;
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
      const estOverridable = ctx.verrous.getOverride(seance.id, type);
      const placeInitiale = seance.placeInitiale;
      const deplacementSalle = Boolean(placeInitiale?.salleId && placeInitiale.salleId !== candidat.salle);
      if (estOverridable) {
        if (deplacementSalle) {
          conflits.push(conflit('LOCK_OVERRIDDEN','VERROU','AVERTISSEMENT','seance',seance.id,[seance.id],`Verrou overridable ${type} et déplacement effectué`,slotKeys));
        } else {
          conflits.push(conflit('LOCK_OVERRIDABLE','VERROU','AVERTISSEMENT','seance',seance.id,[seance.id],`Verrou overridable (${type})`,slotKeys));
        }
      } else {
        conflits.push(conflit('LOCK_VIOLATED','VERROU','BLOQUANT','seance',seance.id,[seance.id],`Séance verrouillée (${type})`,slotKeys));
      }
    }
  }

  // --- 9. Déplacement de salle (ROOM_MOVE_FORBIDDEN) ---
  if (seance.placeInitiale?.salleId && seance.placeInitiale.salleId !== candidat.salle) {
    // Vérifier qu'il existe un précédent : une séance du même groupe au même créneau dans la salle cible
    const slotKey = `${candidat.jour}|${candidat.creneauDebut}`;
    const slot = ctx.occ.get(slotKey);
    let precedentExiste = false;
    if (slot) {
      for (const gId of seance.groupes) {
        const salleCibleOccupee = slot.salle.get(candidat.salle);
        const groupeDansSalleCible = slot.groupe.get(gId);
        if (salleCibleOccupee && salleCibleOccupee.seanceId !== seance.id && groupeDansSalleCible) {
          precedentExiste = true;
          break;
        }
      }
    }
    if (!precedentExiste) {
      conflits.push(conflit('ROOM_MOVE_FORBIDDEN','SALLE','BLOQUANT','salle',candidat.salle,[seance.id],`Déplacement de salle sans précédent pédagogique`,slotKeys));
    }
  }

  // --- 10. Covoiturage (EX-CTR-05 : APPLICATION_ONLY, évaluée après import et en édition) ---
  evaluerCovoiturage(seance, candidat, ctx, conflits);

  return conflits;
}

// ============================================================================
// Covoiturage (EX-CTR-05)
// Règle d'application uniquement : un groupe d'enseignants d'un même semestre
// doit partager assez de jours communs et ses séances d'un jour donné doivent
// rester dans la marge horaire pour pouvoir se déplacer ensemble.
// ============================================================================

function creneauPourSlot(
  ctx: ConflictContext,
  slotKey: string,
): { jour: string; debutMin: number } | undefined {
  const [jour, suffix] = slotKey.split('|');
  // La map creneaux est indexee par id : essayer d'abord par id (slots occ).
  const byId = ctx.creneaux.get(suffix ?? '');
  if (byId && byId.jour === jour) {
    return { jour, debutMin: byId.heureDebutMinutes };
  }
  // Sinon le suffix est un ordre (slots grille) : chercher par (jour, ordre).
  const ordre = Number(suffix);
  if (!Number.isNaN(ordre)) {
    for (const c of ctx.creneaux.values()) {
      if (c.jour === jour && c.ordre === ordre) {
        return { jour, debutMin: c.heureDebutMinutes };
      }
    }
  }
  return undefined;
}

function evaluerCovoiturage(
  seance: SeanceInput,
  _candidat: PlacementCandidat,
  ctx: ConflictContext,
  conflits: Conflit[],
): void {
  const enseignantId = seance.enseignantId;
  if (!enseignantId) return;

  const groupes = Array.from(ctx.covoiturageGroupes.values()).filter((g) =>
    g.membres.includes(enseignantId),
  );
  if (groupes.length === 0) return;

  // Jours et heures de début des sessions déjà placées de l'enseignant.
  const enseignantJours = new Set<string>();
  const enseignantSessions: { jour: string; debutMin: number }[] = [];
  for (const slotKey of ctx.occ.keys()) {
    const [jour, creneauId] = slotKey.split('|');
    const slot = ctx.occ.get(slotKey);
    if (!slot?.ens.has(enseignantId)) continue;
    enseignantJours.add(jour);
    const c = ctx.creneaux.get(creneauId ?? '');
    if (c) enseignantSessions.push({ jour, debutMin: c.heureDebutMinutes });
  }

  // Sessions du candidat de l'enseignant (journée + heure de début).
  const candSlots = ctx.grille.consecutifs(
    _candidat.jour,
    _candidat.creneauDebut,
    seance.nbCreneaux,
  ) ?? [];
  const candJours = new Set<string>();
  const candSessions: { jour: string; debutMin: number }[] = [];
  for (const slotKey of candSlots) {
    const c = creneauPourSlot(ctx, slotKey);
    if (!c) continue;
    candJours.add(c.jour);
    candSessions.push(c);
  }

  const enseignantTousJours = new Set([...enseignantJours, ...candJours]);
  const enseignantToutesSessions = [...enseignantSessions, ...candSessions];

  for (const g of groupes) {
    const autres = g.membres.filter((m) => m !== enseignantId);
    if (autres.length === 0) continue;

    // Jours de presence de chaque membre (enseignant inclus).
    const membreJours = new Map<string, Set<string>>();
    membreJours.set(enseignantId, enseignantTousJours);
    for (const m of autres) {
      const jours = new Set<string>();
      for (const slotKey of ctx.occ.keys()) {
        const [jour] = slotKey.split('|');
        const slot = ctx.occ.get(slotKey);
        if (slot?.ens.has(m)) jours.add(jour);
      }
      membreJours.set(m, jours);
    }

    // Jours communs a tous les membres du groupe.
    let joursCommuns: string[] = [];
    for (const jour of enseignantTousJours) {
      if ([...membreJours.values()].every((j) => j.has(jour))) {
        joursCommuns.push(jour);
      }
    }
    if (joursCommuns.length < g.joursCommunsMin) {
      const severite = g.strict ? 'BLOQUANT' : 'AVERTISSEMENT';
      conflits.push(
        conflit(
          'CARPOOL_VIOLATION',
          'COVOITURAGE',
          severite,
          'groupe_covoiturage',
          g.membres.join(','),
          [seance.id],
          `Covoiturage : seulement ${joursCommuns.length} jour(s) commun(s) pour ${g.membres.length} enseignant(s) (minimum ${g.joursCommunsMin})`,
          [],
          { margeMinutes: g.margeMinutes, joursCommunsMin: g.joursCommunsMin, strict: g.strict, groupeId: g.membres.join(',') },
        ),
      );
      continue;
    }

    // Marge horaire : le jour commun, la session de l'enseignant doit rester
    // dans la marge d'au moins un autre membre present ce jour-la.
    for (const jour of joursCommuns) {
      const ensSessionsJour = enseignantToutesSessions.filter((s) => s.jour === jour);
      for (const ens of ensSessionsJour) {
        const proche = autres.some((m) => {
          const mSessions = [] as { debutMin: number }[];
          for (const slotKey of ctx.occ.keys()) {
            const [j] = slotKey.split('|');
            const slot = ctx.occ.get(slotKey);
            if (j !== jour || !slot?.ens.has(m)) continue;
            const c = ctx.creneaux.get(slotKey.split('|')[1] ?? '');
            if (c) mSessions.push({ debutMin: c.heureDebutMinutes });
          }
          return mSessions.some(
            (s) => Math.abs(ens.debutMin - s.debutMin) <= g.margeMinutes,
          );
        });
        if (!proche) {
          const severite = g.strict ? 'BLOQUANT' : 'AVERTISSEMENT';
          conflits.push(
            conflit(
              'CARPOOL_VIOLATION',
              'COVOITURAGE',
              severite,
              'groupe_covoiturage',
              g.membres.join(','),
              [seance.id],
              `Covoiturage : session isolee de l'enseignant le ${jour} (marge ${g.margeMinutes} min non respectee)`,
              [],
              { margeMinutes: g.margeMinutes, joursCommunsMin: g.joursCommunsMin, strict: g.strict, groupeId: g.membres.join(','), jour },
            ),
          );
        }
      }
    }
  }
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

