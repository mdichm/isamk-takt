import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de exigences-salle.dto.ts (L3-43)
   ============================================================================ */

export interface ExigenceSalleAutorisee {
  salleId: string;
  code?: string;
  libelle?: string;
}

export interface ExigenceSalleActivite {
  id: string;
  semestreId: string;
  affectationKey: string;
  salleImposeeId?: string;
  salleImposeeCode?: string;
  autorisees: ExigenceSalleAutorisee[];
  creePar: string;
  creeLe: string;
  updatedAt: string;
}

export interface CreateExigenceSalleInput {
  semestreId: string;
  affectationKey: string;
  salleImposeeId?: string;
  autorisees?: string[];
}

export interface UpdateExigenceSalleInput {
  salleImposeeId?: string;
  autorisees?: string[];
}

export interface ExigenceSalleQuery {
  page?: number;
  limit?: number;
  search?: string;
  semestreId?: string;
}

export interface PaginatedExigenceSalleActivite {
  data: ExigenceSalleActivite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================================================================
   Exigences de salle
   ============================================================================ */

export async function listExigencesSalle(
  query?: ExigenceSalleQuery,
): Promise<PaginatedExigenceSalleActivite> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  const res = await apiFetch(`/exigences-salle?${params.toString()}`);
  return res.json();
}

export async function getExigenceSalle(id: string): Promise<ExigenceSalleActivite> {
  const res = await apiFetch(`/exigences-salle/${id}`);
  return res.json();
}

export async function createExigenceSalle(
  input: CreateExigenceSalleInput,
): Promise<ExigenceSalleActivite> {
  const res = await apiFetch('/exigences-salle', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateExigenceSalle(
  id: string,
  input: UpdateExigenceSalleInput,
): Promise<ExigenceSalleActivite> {
  const res = await apiFetch(`/exigences-salle/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteExigenceSalle(id: string): Promise<void> {
  await apiFetch(`/exigences-salle/${id}`, { method: 'DELETE' });
}
