import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de affectation.dto.ts (L2-07)
   ============================================================================ */

export interface Affectation {
  id: string;
  repartitionId: string;
  enseignantId: string;
  groupeId?: string;
  moduleId: string;
  typeEnseignementId: string;
  activityTagId?: string;
  volumeHebdoMinutes: number;
  seancesParSemaine: number;
  dureeMinutes: number;
  estCmCommun: boolean;
  workingRevision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAffectationInput {
  enseignantId: string;
  groupeId?: string;
  moduleId: string;
  typeEnseignementId: string;
  activityTagId?: string;
  seancesParSemaine: number;
  dureeMinutes: number;
  estCmCommun?: boolean;
}

export interface UpdateAffectationInput {
  enseignantId?: string;
  groupeId?: string;
  moduleId?: string;
  typeEnseignementId?: string;
  activityTagId?: string;
  seancesParSemaine?: number;
  dureeMinutes?: number;
  estCmCommun?: boolean;
}

export interface PaginatedAffectations {
  data: Affectation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AffectationsQuery {
  page?: number;
  limit?: number;
  enseignantId?: string;
  moduleId?: string;
  groupeId?: string;
}

/* ============================================================================
   Répartition (détail)
   ============================================================================ */

export interface Repartition {
  id: string;
  anneeId: string;
  departementId: string;
  semestreNumero: number;
  isValidated: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================================
   Références pour le formulaire d'affectation
   ============================================================================ */

export interface TypeEnseignementRef {
  id: string;
  code: string;
  libelle: string;
}

export interface ActivityTagRef {
  id: string;
  code: string;
  libelle: string;
  couleur?: string;
}

export async function findAllTypesEnseignement(): Promise<TypeEnseignementRef[]> {
  const res = await apiFetch('/modules/types-enseignement');
  return res.json();
}

export async function findAllActivityTags(): Promise<ActivityTagRef[]> {
  const res = await apiFetch('/activity-tags?limit=100');
  return (res.json() as Promise<PaginatedActivityTags>).then((p) => p.data);
}

interface PaginatedActivityTags {
  data: ActivityTagRef[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================================================================
   Affectations
   ============================================================================ */

export async function findRepartition(id: string): Promise<Repartition> {
  const res = await apiFetch(`/repartitions/${id}`);
  return res.json();
}

export async function findAllAffectations(
  repartitionId: string,
  query?: AffectationsQuery,
): Promise<PaginatedAffectations> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.moduleId) params.set('moduleId', query.moduleId);
  if (query?.groupeId) params.set('groupeId', query.groupeId);
  const res = await apiFetch(
    `/repartitions/${repartitionId}/affectations?${params.toString()}`,
  );
  return res.json();
}

export async function createAffectation(
  repartitionId: string,
  input: CreateAffectationInput,
): Promise<Affectation> {
  const res = await apiFetch(`/repartitions/${repartitionId}/affectations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateAffectation(
  repartitionId: string,
  id: string,
  input: UpdateAffectationInput,
): Promise<Affectation> {
  const res = await apiFetch(
    `/repartitions/${repartitionId}/affectations/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  return res.json();
}

export async function deleteAffectation(
  repartitionId: string,
  id: string,
): Promise<void> {
  await apiFetch(
    `/repartitions/${repartitionId}/affectations/${id}`,
    { method: 'DELETE' },
  );
}
