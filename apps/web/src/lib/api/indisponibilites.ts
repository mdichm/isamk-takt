import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de indisponibilite.dto.ts (L1-20)
   ============================================================================ */

export interface Indisponibilite {
  id: string;
  semestreId: string;
  jour: string;
  ordre: number;
  enseignantId?: string;
  salleId?: string;
  estActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIndisponibiliteInput {
  semestreId: string;
  jour: string;
  ordre: number;
  enseignantId?: string;
  salleId?: string;
}

export interface UpdateIndisponibiliteInput {
  jour?: string;
  ordre?: number;
  enseignantId?: string;
  salleId?: string;
  estActive?: boolean;
}

export interface PaginatedIndisponibilites {
  data: Indisponibilite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IndisponibiliteQuery {
  page?: number;
  limit?: number;
  semestreId?: string;
  jour?: string;
  enseignantId?: string;
  salleId?: string;
  estActive?: boolean;
}

/* ============================================================================
   Indisponibilités
   ============================================================================ */

export async function findAllIndisponibilites(
  query?: IndisponibiliteQuery,
): Promise<PaginatedIndisponibilites> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.jour) params.set('jour', query.jour);
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.salleId) params.set('salleId', query.salleId);
  if (query?.estActive !== undefined) params.set('estActive', String(query.estActive));
  const res = await apiFetch(`/indisponibilites?${params.toString()}`);
  return res.json();
}

export async function findIndisponibiliteById(id: string): Promise<Indisponibilite> {
  const res = await apiFetch(`/indisponibilites/${id}`);
  return res.json();
}

export async function createIndisponibilite(
  input: CreateIndisponibiliteInput,
): Promise<Indisponibilite> {
  const res = await apiFetch('/indisponibilites', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateIndisponibilite(
  id: string,
  input: UpdateIndisponibiliteInput,
): Promise<Indisponibilite> {
  const res = await apiFetch(`/indisponibilites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteIndisponibilite(id: string): Promise<void> {
  await apiFetch(`/indisponibilites/${id}`, { method: 'DELETE' });
}
