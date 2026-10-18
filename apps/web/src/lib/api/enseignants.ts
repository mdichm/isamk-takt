import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de enseignant.dto.ts (L1-10 / L1-12)
   ============================================================================ */

export interface Enseignant {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  isActive: boolean;
  anneeId: string;
  departementId: string;
  gradeId: string | null;
  moduleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnseignantInput {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  anneeId: string;
  departementId: string;
  gradeId?: string;
  moduleIds?: string[];
}

export interface UpdateEnseignantInput {
  matricule?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
  isActive?: boolean;
  anneeId?: string;
  departementId?: string;
  gradeId?: string | null;
  moduleIds?: string[];
}

export interface PaginatedEnseignants {
  data: Enseignant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnseignantsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  departementId?: string;
  gradeId?: string;
  anneeId?: string;
}

/* ============================================================================
   Enseignants
   ============================================================================ */

export async function findAllEnseignants(
  query?: EnseignantsQuery,
): Promise<PaginatedEnseignants> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query?.departementId) params.set('departementId', query.departementId);
  if (query?.gradeId) params.set('gradeId', query.gradeId);
  if (query?.anneeId) params.set('anneeId', query.anneeId);
  const res = await apiFetch(`/enseignants?${params.toString()}`);
  return res.json();
}

export async function findEnseignantById(id: string): Promise<Enseignant> {
  const res = await apiFetch(`/enseignants/${id}`);
  return res.json();
}

export async function createEnseignant(
  input: CreateEnseignantInput,
): Promise<Enseignant> {
  const res = await apiFetch('/enseignants', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateEnseignant(
  id: string,
  input: UpdateEnseignantInput,
): Promise<Enseignant> {
  const res = await apiFetch(`/enseignants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteEnseignant(id: string): Promise<void> {
  await apiFetch(`/enseignants/${id}`, { method: 'DELETE' });
}

/* ============================================================================
   Modules enseignables
   ============================================================================ */

export interface AssignModulesInput {
  moduleIds: string[];
}

export async function assignModules(
  enseignantId: string,
  input: AssignModulesInput,
): Promise<Enseignant> {
  const res = await apiFetch(`/enseignants/${enseignantId}/modules`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function unassignModule(
  enseignantId: string,
  moduleId: string,
): Promise<void> {
  await apiFetch(`/enseignants/${enseignantId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
}

/* ============================================================================
   Listes de référence (grades, modules) pour les formulaires enseignant
   ============================================================================ */

export interface GradeRef {
  id: string;
  code: string;
  libelle: string;
}

export interface ModuleRef {
  id: string;
  code: string;
  libelle: string;
  semestreNumero: number;
  credits: number | null;
}

export async function findAllGrades(): Promise<GradeRef[]> {
  const res = await apiFetch('/modules/grades');
  return res.json();
}

export async function findAllModules(): Promise<ModuleRef[]> {
  const res = await apiFetch('/modules');
  return res.json();
}


