import { apiFetch } from './client';

/* ============================================================================
   Séances (aligné sur SeanceResponseDto du backend L3-11)
   ============================================================================ */

export interface Seance {
  id: string;
  versionId: string;
  semestreId: string;
  affectationKey: string;
  rang: number;
  tag?: string;
  statut: string;
  origine: string;
  revision: number;
  jour?: string;
  creneauDebutId?: string;
  nbCreneaux: number;
  enseignantId?: string;
  salleId?: string;
  groupes: string[];
}

interface PaginatedSeances {
  data: Seance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function findSeancesByVersion(
  versionId: string,
  query?: { page?: number; limit?: number; affectationKey?: string },
): Promise<PaginatedSeances> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.affectationKey) params.set('affectationKey', query.affectationKey);
  const res = await apiFetch(
    `/versions/${versionId}/seances?${params.toString()}`,
  );
  return res.json();
}