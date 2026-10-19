import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de creneaux-affichage.dto.ts (L1-22 / L1-23)
   ============================================================================ */

export type GrilleAffichage = 'NORMALE' | 'RAMADAN';

export interface CreneauAffichage {
  id: string;
  creneauId: string;
  grille: GrilleAffichage;
  heureDebut: string;
  heureFin: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreneauAffichageInput {
  creneauId: string;
  heureDebut: string;
  heureFin: string;
}

export interface UpdateCreneauAffichageInput {
  heureDebut?: string;
  heureFin?: string;
}

export interface PaginatedCreneauxAffichage {
  data: CreneauAffichage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreneauAffichageQuery {
  page?: number;
  limit?: number;
  semestreId?: string;
  grille?: GrilleAffichage;
}

export interface DuplicateCreneauxAffichageInput {
  sourceSemestreId: string;
  cibleSemestreId: string;
  remplacer?: boolean;
}

export interface DuplicateCreneauxAffichageResponse {
  created: number;
  creneauAffichageIds: string[];
}

/* ============================================================================
   Correspondance d'affichage Ramadan
   ============================================================================ */

export async function findAllCreneauxAffichage(
  query?: CreneauAffichageQuery,
): Promise<PaginatedCreneauxAffichage> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.grille) params.set('grille', query.grille);
  const res = await apiFetch(`/creneaux-affichage?${params.toString()}`);
  return res.json();
}

export async function findCreneauAffichageById(id: string): Promise<CreneauAffichage> {
  const res = await apiFetch(`/creneaux-affichage/${id}`);
  return res.json();
}

export async function createCreneauAffichage(
  input: CreateCreneauAffichageInput,
): Promise<CreneauAffichage> {
  const res = await apiFetch('/creneaux-affichage', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateCreneauAffichage(
  id: string,
  input: UpdateCreneauAffichageInput,
): Promise<CreneauAffichage> {
  const res = await apiFetch(`/creneaux-affichage/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteCreneauAffichage(id: string): Promise<void> {
  await apiFetch(`/creneaux-affichage/${id}`, { method: 'DELETE' });
}

export async function duplicateCreneauxAffichage(
  input: DuplicateCreneauxAffichageInput,
): Promise<DuplicateCreneauxAffichageResponse> {
  const res = await apiFetch('/creneaux-affichage/duplicate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}
