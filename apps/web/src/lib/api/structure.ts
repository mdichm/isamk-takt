import { apiFetch, API_BASE } from './client';

/* ============================================================================
   Types (alignés sur les DTO backend de structure.dto.ts et groupe.dto.ts)
   ============================================================================ */

export interface Departement {
  id: string;
  anneeId: string;
  code: string;
  libelle: string;
  ordre: number;
  originId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartementInput {
  anneeId: string;
  code: string;
  libelle: string;
  ordre?: number;
  originId?: string;
}

export interface UpdateDepartementInput {
  code?: string;
  libelle?: string;
  ordre?: number;
  originId?: string;
}

export interface PaginatedDepartements {
  data: Departement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Formation {
  id: string;
  departementId: string;
  code: string;
  libelle: string;
  ordre: number;
  originId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormationInput {
  departementId: string;
  code: string;
  libelle: string;
  ordre?: number;
  originId?: string;
}

export interface UpdateFormationInput {
  code?: string;
  libelle?: string;
  ordre?: number;
  originId?: string;
}

export interface PaginatedFormations {
  data: Formation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Niveau {
  id: string;
  formationId: string;
  code: string;
  libelle: string;
  ordre: number;
  originId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNiveauInput {
  formationId: string;
  code: string;
  libelle: string;
  ordre?: number;
  originId?: string;
}

export interface UpdateNiveauInput {
  code?: string;
  libelle?: string;
  ordre?: number;
  originId?: string;
}

export interface PaginatedNiveaux {
  data: Niveau[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type GroupeType = 'SECTION' | 'GROUPE' | 'SOUS_GROUPE';

export interface Groupe {
  id: string;
  niveauId: string;
  semestreId: string;
  parentId: string | null;
  type: GroupeType;
  code: string;
  libelle: string;
  effectif: number;
  ordre: number;
  originId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupeInput {
  niveauId: string;
  semestreId: string;
  parentId?: string;
  type: GroupeType;
  code: string;
  libelle: string;
  effectif?: number;
  ordre?: number;
}

export interface UpdateGroupeInput {
  code?: string;
  libelle?: string;
  effectif?: number;
  parentId?: string;
  ordre?: number;
}

export interface PaginatedGroupes {
  data: Groupe[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================================================================
   Départements
   ============================================================================ */

export async function createDepartement(input: CreateDepartementInput): Promise<Departement> {
  const res = await apiFetch(API_BASE + '/structure/departements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function findAllDepartements(query?: {
  page?: number;
  limit?: number;
  search?: string;
  anneeId?: string;
}): Promise<PaginatedDepartements> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.anneeId) params.set('anneeId', query.anneeId);
  const res = await apiFetch(API_BASE + '/structure/departements?' + params);
  return res.json();
}

export async function findDepartementById(id: string): Promise<Departement> {
  const res = await apiFetch(API_BASE + '/structure/departements/' + id);
  return res.json();
}

export async function updateDepartement(id: string, input: UpdateDepartementInput): Promise<Departement> {
  const res = await apiFetch(API_BASE + '/structure/departements/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteDepartement(id: string): Promise<void> {
  await apiFetch(API_BASE + '/structure/departements/' + id, { method: 'DELETE' });
}

/* ============================================================================
   Formations
   ============================================================================ */

export async function createFormation(input: CreateFormationInput): Promise<Formation> {
  const res = await apiFetch(API_BASE + '/structure/formations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function findAllFormations(query?: {
  page?: number;
  limit?: number;
  search?: string;
  departementId?: string;
}): Promise<PaginatedFormations> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.departementId) params.set('departementId', query.departementId);
  const res = await apiFetch(API_BASE + '/structure/formations?' + params);
  return res.json();
}

export async function findFormationById(id: string): Promise<Formation> {
  const res = await apiFetch(API_BASE + '/structure/formations/' + id);
  return res.json();
}

export async function updateFormation(id: string, input: UpdateFormationInput): Promise<Formation> {
  const res = await apiFetch(API_BASE + '/structure/formations/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteFormation(id: string): Promise<void> {
  await apiFetch(API_BASE + '/structure/formations/' + id, { method: 'DELETE' });
}

/* ============================================================================
   Niveaux
   ============================================================================ */

export async function createNiveau(input: CreateNiveauInput): Promise<Niveau> {
  const res = await apiFetch(API_BASE + '/structure/formations/' + input.formationId + '/niveaux', {
    method: 'POST',
    body: JSON.stringify({ code: input.code, libelle: input.libelle, originId: input.originId }),
  });
  return res.json();
}

export async function findAllNiveaux(query?: {
  page?: number;
  limit?: number;
  search?: string;
  formationId?: string;
}): Promise<PaginatedNiveaux> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.formationId) params.set('formationId', query.formationId);
  const res = await apiFetch(API_BASE + '/structure/niveaux?' + params);
  return res.json();
}

export async function findNiveauById(id: string): Promise<Niveau> {
  const res = await apiFetch(API_BASE + '/structure/niveaux/' + id);
  return res.json();
}

export async function updateNiveau(id: string, input: UpdateNiveauInput): Promise<Niveau> {
  const res = await apiFetch(API_BASE + '/structure/niveaux/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteNiveau(id: string): Promise<void> {
  await apiFetch(API_BASE + '/structure/niveaux/' + id, { method: 'DELETE' });
}

/* ============================================================================
   Groupes
   ============================================================================ */

export async function createGroupe(input: CreateGroupeInput): Promise<Groupe> {
  const res = await apiFetch(API_BASE + '/groupes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function findAllGroupes(query?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: GroupeType;
  niveauId?: string;
  semestreId?: string;
  parentId?: string;
}): Promise<PaginatedGroupes> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.type) params.set('type', query.type);
  if (query?.niveauId) params.set('niveauId', query.niveauId);
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.parentId) params.set('parentId', query.parentId);
  const res = await apiFetch(API_BASE + '/groupes?' + params);
  return res.json();
}

export async function findGroupeById(id: string): Promise<Groupe> {
  const res = await apiFetch(API_BASE + '/groupes/' + id);
  return res.json();
}

export async function updateGroupe(id: string, input: UpdateGroupeInput): Promise<Groupe> {
  const res = await apiFetch(API_BASE + '/groupes/' + id, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteGroupe(id: string): Promise<void> {
  await apiFetch(API_BASE + '/groupes/' + id, { method: 'DELETE' });
}

/* ============================================================================
   Réordonnancement (L7-18)
   ============================================================================ */

export interface ReorderItem {
  id: string;
  ordre: number;
}

export interface ReorderInput {
  items: ReorderItem[];
}

export async function reorderDepartements(input: ReorderInput): Promise<void> {
  await apiFetch(API_BASE + '/structure/departements/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function reorderFormations(input: ReorderInput): Promise<void> {
  await apiFetch(API_BASE + '/structure/formations/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function reorderNiveaux(input: ReorderInput): Promise<void> {
  await apiFetch(API_BASE + '/structure/niveaux/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function reorderGroupes(input: ReorderInput): Promise<void> {
  await apiFetch(API_BASE + '/groupes/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
