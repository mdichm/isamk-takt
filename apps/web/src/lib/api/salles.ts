import { apiFetch, API_BASE } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de salle.dto.ts (L1-13 / L1-16)
   ============================================================================ */

export interface Salle {
  id: string;
  code: string;
  libelle: string;
  siteId?: string;
  capaciteMax: number;
  capaciteRecommandee?: number;
  accesPMR: boolean;
  commentaire?: string;
  estActive: boolean;
  departementId?: string;
  typeSalleId?: string;
  originId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalleInput {
  code: string;
  libelle: string;
  siteId?: string;
  capaciteMax: number;
  capaciteRecommandee?: number;
  accesPMR?: boolean;
  commentaire?: string;
  estActive?: boolean;
  departementId?: string;
  typeSalleId?: string;
}

export interface UpdateSalleInput {
  code?: string;
  libelle?: string;
  siteId?: string;
  capaciteMax?: number;
  capaciteRecommandee?: number;
  accesPMR?: boolean;
  commentaire?: string;
  estActive?: boolean;
  departementId?: string;
  typeSalleId?: string;
}

export interface PaginatedSalles {
  data: Salle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SallesQuery {
  page?: number;
  limit?: number;
  search?: string;
  estActive?: boolean;
  departementId?: string;
  typeSalleId?: string;
  accesPMR?: boolean;
}

export interface SiteRef {
  id: string;
  code: string;
  libelle: string;
  estPrincipal: boolean;
}

export interface TypeSalleRef {
  id: string;
  code: string;
  libelle: string;
  estActive: boolean;
}

export interface EquipementRef {
  id: string;
  code: string;
  libelle: string;
  estActive: boolean;
}

/* ============================================================================
   Salles
   ============================================================================ */

export async function findAllSalles(
  query?: SallesQuery,
): Promise<PaginatedSalles> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.estActive !== undefined) params.set('estActive', String(query.estActive));
  if (query?.departementId) params.set('departementId', query.departementId);
  if (query?.typeSalleId) params.set('typeSalleId', query.typeSalleId);
  if (query?.accesPMR !== undefined) params.set('accesPMR', String(query.accesPMR));
  const res = await apiFetch(`/salles?${params.toString()}`);
  return res.json();
}

export async function findSalleById(id: string): Promise<Salle> {
  const res = await apiFetch(`/salles/${id}`);
  return res.json();
}

export async function createSalle(input: CreateSalleInput): Promise<Salle> {
  const res = await apiFetch('/salles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateSalle(
  id: string,
  input: UpdateSalleInput,
): Promise<Salle> {
  const res = await apiFetch(`/salles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteSalle(id: string): Promise<void> {
  await apiFetch(`/salles/${id}`, { method: 'DELETE' });
}

/* ============================================================================
   Référentiels pour les formulaires (sites, types de salle, équipements)
   ============================================================================ */

export async function findAllSites(
  query?: { page?: number; limit?: number; search?: string },
): Promise<{ data: SiteRef[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  const res = await apiFetch(`${API_BASE}/sites?${params.toString()}`);
  return res.json();
}

export async function findAllTypeSalles(
  query?: { page?: number; limit?: number; search?: string; estActive?: boolean },
): Promise<{ data: TypeSalleRef[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.estActive !== undefined) params.set('estActive', String(query.estActive));
  const res = await apiFetch(`${API_BASE}/salles/types-salles?${params.toString()}`);
  return res.json();
}

export async function findAllEquipements(
  query?: { page?: number; limit?: number; search?: string; estActive?: boolean },
): Promise<{ data: EquipementRef[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.estActive !== undefined) params.set('estActive', String(query.estActive));
  const res = await apiFetch(`${API_BASE}/salles/equipements?${params.toString()}`);
  return res.json();
}

export async function assignerEquipements(
  salleId: string,
  equipementIds: string[],
): Promise<Salle> {
  const res = await apiFetch(`/salles/${salleId}/equipements`, {
    method: 'POST',
    body: JSON.stringify({ equipementIds }),
  });
  return res.json();
}
