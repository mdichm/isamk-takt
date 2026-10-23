import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de verrou-seance (L3-36, L3-37)
   ============================================================================ */

export type VerrouType = 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE';

export type CibleType = 'GROUPE' | 'ENSEIGNANT' | 'SALLE';

export interface VerrouSeance {
  id: string;
  versionId: string;
  seanceId: string;
  type: VerrouType;
  auteurId: string;
  justification?: string;
  creeLe: string;
  leveLe?: string;
  levePar?: string;
}

export interface PoseVerrouInput {
  type: VerrouType;
  justification?: string;
}

export interface BulkCible {
  type: CibleType;
  id: string;
}

export interface BulkPoseVerrouInput {
  cible: BulkCible;
  type: VerrouType;
  justification?: string;
}

export interface BulkPoseDetail {
  seanceId: string;
  status: 'POSED' | 'SKIPPED_EXISTING';
}

export interface BulkPoseResponse {
  poses: number;
  ignores: number;
  details: BulkPoseDetail[];
}

export interface VerrouPreview {
  seancesConcernees: number;
  avertissement: string;
  verrouId: string;
}

/* ============================================================================
   Verrous par séance
   ============================================================================ */

export async function listVerrousSeance(
  versionId: string,
  seanceId: string,
): Promise<VerrouSeance[]> {
  const res = await apiFetch(
    `/versions/${versionId}/seances/${seanceId}/verrous`,
  );
  return res.json();
}

export async function poseVerrou(
  versionId: string,
  seanceId: string,
  input: PoseVerrouInput,
): Promise<VerrouSeance> {
  const res = await apiFetch(
    `/versions/${versionId}/seances/${seanceId}/verrous`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.json();
}

export async function leveVerrou(
  versionId: string,
  seanceId: string,
  type: VerrouType,
): Promise<VerrouSeance> {
  const params = new URLSearchParams({ type });
  const res = await apiFetch(
    `/versions/${versionId}/seances/${seanceId}/verrous?${params.toString()}`,
    { method: 'DELETE' },
  );
  return res.json();
}

/* ============================================================================
   Pose en masse (bulk)
   ============================================================================ */

export async function bulkPoseVerrou(
  versionId: string,
  input: BulkPoseVerrouInput,
): Promise<BulkPoseResponse> {
  const res = await apiFetch(
    `/versions/${versionId}/verrous:bulk`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.json();
}

/* ============================================================================
   Levée d'un verrou par ID (avec preview optionnel)
   ============================================================================ */

export async function previewLeveVerrou(
  verrouId: string,
): Promise<VerrouPreview> {
  const params = new URLSearchParams({ preview: 'true' });
  const res = await apiFetch(
    `/verrous/${verrouId}?${params.toString()}`,
    { method: 'DELETE' },
  );
  return res.json();
}

export async function leveVerrouById(verrouId: string): Promise<VerrouSeance> {
  const res = await apiFetch(`/verrous/${verrouId}`, {
    method: 'DELETE',
  });
  return res.json();
}
