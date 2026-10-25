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

/* ============================================================================
   Couverture / Complétude (L3-30 / L3-31)
   GET /versions/{id}/completude
   ============================================================================ */

export interface CompletudeAffectation {
  affectationKey: string;
  attendu: number;
  place: number;
  ecart: number;
}

export interface CompletudeResponse {
  attenduTotal: number;
  placeTotal: number;
  ecartTotal: number;
  couvertureTotale: number;
  couvertureExacte: boolean;
  parAffectation: CompletudeAffectation[];
}

export async function fetchCompletude(versionId: string): Promise<CompletudeResponse> {
  const res = await apiFetch(`/versions/${versionId}/completude`);
  return res.json();
}

/* ============================================================================
   Historique de version (L5-09)
   GET /versions/{id}/history
   ============================================================================ */

export interface HistoryEntry {
  id: string;
  de: string;
  vers: string;
  action: string;
  userId: string;
  userName: string;
  automatique: boolean;
  commentaire: string | null;
  at: string;
}

export interface HistoryResponse {
  versionId: string;
  entries: HistoryEntry[];
}

export async function fetchHistory(versionId: string): Promise<HistoryResponse> {
  const res = await apiFetch(`/versions/${versionId}/history`);
  return res.json();
}