import { apiFetch, API_BASE } from './client';

/* ============================================================================
   Types (alignés sur les DTO backend de annee.dto.ts)
   ============================================================================ */

export type AnneeStatut = 'PREPARATION' | 'ACTIVE' | 'CLOTUREE';

export interface Annee {
  id: string;
  numero: number;
  code: string;
  nbSemaines: number;
  statut: AnneeStatut;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnneeInput {
  numero: number;
  code: string;
  nbSemaines?: number;
}

export interface UpdateAnneeInput {
  code?: string;
  numero?: number;
  nbSemaines?: number;
  statut?: AnneeStatut;
}

export interface PaginatedAnnees {
  data: Annee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnneeQuery {
  page?: number;
  limit?: number;
  search?: string;
  statut?: AnneeStatut;
}

export interface Semestre {
  id: string;
  anneeId: string;
  numero: number;
  nbSemaines: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSemestreInput {
  anneeId: string;
  numero: number;
  nbSemaines?: number;
}

export interface UpdateSemestreInput {
  numero?: number;
  nbSemaines?: number;
}

export interface PaginatedSemestres {
  data: Semestre[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SemestreQuery {
  page?: number;
  limit?: number;
}

/* ============================================================================
   Transition d'année (L7-01)
   POST /annees/{id}/transitions
   ============================================================================ */

export interface TransitionAnneeDto {
  action: 'ACTIVER' | 'CLOTURER';
  confirmation?: string;
  motif?: string;
}

export interface TransitionResponseDto {
  anneeId: string;
  de: string;
  vers: string;
  versionsArchivees: number;
}

export async function transitionAnnee(
  id: string,
  dto: TransitionAnneeDto,
): Promise<TransitionResponseDto> {
  const res = await apiFetch(`${API_BASE}/annees/${id}/transitions`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return res.json();
}

/* ============================================================================
   Années
   ============================================================================ */

export async function findAllAnnees(query?: AnneeQuery): Promise<PaginatedAnnees> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.statut) params.set('statut', query.statut);
  const res = await apiFetch(API_BASE + '/annees?' + params);
  return res.json();
}

export async function findAnneeById(id: string): Promise<Annee> {
  const res = await apiFetch(API_BASE + '/annees/' + id);
  return res.json();
}

export async function createAnnee(input: CreateAnneeInput): Promise<Annee> {
  const res = await apiFetch(API_BASE + '/annees', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateAnnee(id: string, input: UpdateAnneeInput): Promise<Annee> {
  const res = await apiFetch(API_BASE + '/annees/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteAnnee(id: string): Promise<void> {
  await apiFetch(API_BASE + '/annees/' + id, { method: 'DELETE' });
}

/* ============================================================================
   Semestres
   ============================================================================ */

export async function findAllSemestres(anneeId: string, query?: SemestreQuery): Promise<PaginatedSemestres> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const res = await apiFetch(API_BASE + '/annees/' + anneeId + '/semestres?' + params);
  return res.json();
}

export async function findSemestreById(id: string): Promise<Semestre> {
  const res = await apiFetch(API_BASE + '/semestres/' + id);
  return res.json();
}

export async function createSemestre(input: CreateSemestreInput): Promise<Semestre> {
  const res = await apiFetch(API_BASE + '/annees/' + input.anneeId + '/semestres', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateSemestre(id: string, input: UpdateSemestreInput): Promise<Semestre> {
  const res = await apiFetch(API_BASE + '/semestres/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteSemestre(id: string): Promise<void> {
  await apiFetch(API_BASE + '/semestres/' + id, { method: 'DELETE' });
}
