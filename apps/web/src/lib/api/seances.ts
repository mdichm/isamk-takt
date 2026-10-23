import { apiFetch } from './client';
import { ApiError } from './errors';

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

export interface PaginatedSeances {
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

export interface MoveSeanceDto {
  jour: string;
  creneauDebutId: string;
  salleId: string;
}

export async function moveSeance(
  seanceId: string,
  dto: MoveSeanceDto,
  ifMatch: string,
): Promise<void> {
  const res = await apiFetch(`/seances/${seanceId}/placement`, {
    method: 'PATCH',
    headers: { 'If-Match': ifMatch },
    body: JSON.stringify(dto),
  });
  if (res.status >= 400) {
    let detail: string | undefined;
    try {
      const body = await res.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail ?? 'Erreur API');
  }
}