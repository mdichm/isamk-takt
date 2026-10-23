import { apiFetch } from './client';

/* ============================================================================
   Versions (aligné sur VersionResponseDto du backend L3-09)
   ============================================================================ */

export interface Version {
  id: string;
  semestreId: string;
  numero: string;
  statut: string;
  motif?: string;
  createdAt: string;
  updatedAt: string;
}

export async function findVersions(): Promise<Version[]> {
  const res = await apiFetch('/versions');
  return res.json();
}

export async function findVersionById(id: string): Promise<Version> {
  const res = await apiFetch(`/versions/${id}`);
  return res.json();
}