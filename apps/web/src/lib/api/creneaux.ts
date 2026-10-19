import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de creneau.dto.ts (L1-17 / L1-19)
   ============================================================================ */

export interface Creneau {
  id: string;
  semestreId: string;
  jour: string;
  ordre: number;
  heureDebut: string;
  heureFin: string;
  estPause: boolean;
  estActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreneauInput {
  semestreId: string;
  jour: string;
  ordre: number;
  heureDebut: string;
  heureFin: string;
  estPause?: boolean;
}

export interface UpdateCreneauInput {
  ordre?: number;
  heureDebut?: string;
  heureFin?: string;
  estPause?: boolean;
  estActive?: boolean;
}

export interface PaginatedCreneaux {
  data: Creneau[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreneauQuery {
  page?: number;
  limit?: number;
  semestreId?: string;
  jour?: string;
  estPause?: boolean;
  estActive?: boolean;
}

export interface DuplicateCreneauxInput {
  sourceSemestreId: string;
  cibleSemestreId: string;
  remplacer?: boolean;
}

export interface DuplicateCreneauxResponse {
  created: number;
  creneauIds: string[];
}

/* ============================================================================
   Créneaux et pauses
   ============================================================================ */

export async function findAllCreneaux(
  query?: CreneauQuery,
): Promise<PaginatedCreneaux> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.jour) params.set('jour', query.jour);
  if (query?.estPause !== undefined) params.set('estPause', String(query.estPause));
  if (query?.estActive !== undefined) params.set('estActive', String(query.estActive));
  const res = await apiFetch(`/creneaux?${params.toString()}`);
  return res.json();
}

export async function findCreneauById(id: string): Promise<Creneau> {
  const res = await apiFetch(`/creneaux/${id}`);
  return res.json();
}

export async function createCreneau(input: CreateCreneauInput): Promise<Creneau> {
  const res = await apiFetch('/creneaux', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateCreneau(
  id: string,
  input: UpdateCreneauInput,
): Promise<Creneau> {
  const res = await apiFetch(`/creneaux/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteCreneau(id: string): Promise<void> {
  await apiFetch(`/creneaux/${id}`, { method: 'DELETE' });
}

export async function duplicateCreneaux(
  input: DuplicateCreneauxInput,
): Promise<DuplicateCreneauxResponse> {
  const res = await apiFetch('/creneaux/duplicate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}
