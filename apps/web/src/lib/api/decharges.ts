import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de decharge.dto.ts (L1-11 / L1-12)
   ============================================================================ */

export interface Decharge {
  id: string;
  heures: number;
  enseignantId: string;
  semestreId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDechargeInput {
  heures: number;
  enseignantId: string;
  semestreId: string;
}

export interface UpdateDechargeInput {
  heures?: number;
  enseignantId?: string;
  semestreId?: string;
}

export interface PaginatedDecharges {
  data: Decharge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DechargesQuery {
  page?: number;
  limit?: number;
  enseignantId?: string;
  semestreId?: string;
}

/* ============================================================================
   Décharges enseignant
   ============================================================================ */

export async function findAllDecharges(
  query?: DechargesQuery,
): Promise<PaginatedDecharges> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  const res = await apiFetch(`/decharges?${params.toString()}`);
  return res.json();
}

export async function findDechargeById(id: string): Promise<Decharge> {
  const res = await apiFetch(`/decharges/${id}`);
  return res.json();
}

export async function createDecharge(input: CreateDechargeInput): Promise<Decharge> {
  const res = await apiFetch('/decharges', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateDecharge(
  id: string,
  input: UpdateDechargeInput,
): Promise<Decharge> {
  const res = await apiFetch(`/decharges/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteDecharge(id: string): Promise<void> {
  await apiFetch(`/decharges/${id}`, { method: 'DELETE' });
}


