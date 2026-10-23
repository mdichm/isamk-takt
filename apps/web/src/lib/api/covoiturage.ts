import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de covoiturage.dto.ts (L3-41)
   ============================================================================ */

export interface CovoiturageGroupe {
  id: string;
  semestreId: string;
  enseignantIds: string[];
  margeMinutes: number;
  joursCommunsMin: number;
  strict: boolean;
  createdAt: string;
}

export interface CreateCovoiturageInput {
  semestreId: string;
  enseignantIds: string[];
  margeMinutes?: number;
  joursCommunsMin?: number;
  strict?: boolean;
}

export interface UpdateCovoiturageInput {
  enseignantIds?: string[];
  margeMinutes?: number;
  joursCommunsMin?: number;
  strict?: boolean;
}

export interface CovoiturageQuery {
  semestreId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCovoiturageGroupes {
  data: CovoiturageGroupe[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================================================================
   Groupes de covoiturage
   ============================================================================ */

export async function listCovoiturageGroupes(
  query?: CovoiturageQuery,
): Promise<PaginatedCovoiturageGroupes> {
  const params = new URLSearchParams();
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const res = await apiFetch(`/covoiturage?${params.toString()}`);
  return res.json();
}

export async function getCovoiturageGroupe(id: string): Promise<CovoiturageGroupe> {
  const res = await apiFetch(`/covoiturage/${id}`);
  return res.json();
}

export async function createCovoiturageGroupe(
  input: CreateCovoiturageInput,
): Promise<CovoiturageGroupe> {
  const res = await apiFetch('/covoiturage', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateCovoiturageGroupe(
  id: string,
  input: UpdateCovoiturageInput,
): Promise<CovoiturageGroupe> {
  const res = await apiFetch(`/covoiturage/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteCovoiturageGroupe(id: string): Promise<void> {
  await apiFetch(`/covoiturage/${id}`, {
    method: 'DELETE',
  });
}
