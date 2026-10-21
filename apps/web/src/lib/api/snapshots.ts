import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de repartition.dto.ts (L2-14)
   ============================================================================ */

export type RepartitionStatut = 'BROUILLON' | 'VALIDEE' | 'ROUVERTE';

export interface SnapshotList {
  id: string;
  tag: string;
  hash: string;
  valideParId: string;
  valideLe: string;
  parAdministrateur: boolean;
  statut: RepartitionStatut;
  createdAt: string;
}

export interface SnapshotAffectation {
  enseignantId: string;
  groupeId: string | null;
  moduleId: string;
  typeEnseignementId: string;
  activityTagId: string | null;
  volumeHebdoMinutes: number;
  seancesParSemaine: number;
  dureeMinutes: number;
  estCmCommun: boolean;
  workingRevision: number;
}

export interface SnapshotCharge {
  enseignantId: string;
  volumeBrut: number;
  chargeCalculee: number;
  chargeReference: number;
  decharges: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
}

export interface SnapshotDetail {
  snapshotId: string;
  repartitionId: string;
  tag: string;
  hash: string;
  statut: RepartitionStatut;
  valideParId: string;
  valideLe: string;
  parAdministrateur: boolean;
  affectations: SnapshotAffectation[];
  charges: SnapshotCharge[];
}

/* ============================================================================
   Appel API
   ============================================================================ */

/**
 * Récupère la liste des snapshots (révisions) d'une répartition, triés par date de validation desc.
 */
export async function findSnapshots(
  repartitionId: string,
): Promise<SnapshotList[]> {
  const res = await apiFetch(`/repartitions/${repartitionId}/snapshots`);
  return res.json();
}

/**
 * Récupère un snapshot en lecture seule (affectations et charges figées).
 */
export async function findSnapshot(
  repartitionId: string,
  snapshotId: string,
): Promise<SnapshotDetail> {
  const res = await apiFetch(
    `/repartitions/${repartitionId}/snapshots/${snapshotId}`,
  );
  return res.json();
}
