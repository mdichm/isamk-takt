import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de demande.dto.ts (L2-15)
   ============================================================================ */

export type DemandeType = 'ANOMALIE' | 'MODIFICATION';
export type DemandeStatut = 'OUVERTE' | 'TRAITEE' | 'REFUSEE';

export const DemandeType = {
  ANOMALIE: 'ANOMALIE' as const,
  MODIFICATION: 'MODIFICATION' as const,
} as const;

export const DemandeStatut = {
  OUVERTE: 'OUVERTE' as const,
  TRAITEE: 'TRAITEE' as const,
  REFUSEE: 'REFUSEE' as const,
} as const;

export interface Demande {
  id: string;
  semestreId: string;
  departementCode: string;
  auteurId: string;
  versionId?: string | null;
  type: DemandeType;
  cible: unknown;
  motif: string;
  statut: DemandeStatut;
  reponse?: string | null;
  traiteePar?: string | null;
  createdAt: string;
  traiteeLe?: string | null;
}

export interface CreateDemandeInput {
  semestreId: string;
  departementCode: string;
  versionId?: string;
  type: DemandeType;
  cible: unknown;
  motif: string;
}

export interface TraiterDemandeInput {
  statut: DemandeStatut;
  reponse?: string;
}

export interface PaginatedDemandes {
  data: Demande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DemandesQuery {
  page?: number;
  limit?: number;
  type?: DemandeType;
  statut?: DemandeStatut;
  search?: string;
  semestreId?: string;
  departementCode?: string;
  auteurId?: string;
}

/* ============================================================================
   Requêtes API
   ============================================================================ */

export async function findAllDemandes(
  query?: DemandesQuery,
): Promise<PaginatedDemandes> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.type) params.set('type', query.type);
  if (query?.statut) params.set('statut', query.statut);
  if (query?.search) params.set('search', query.search);
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.departementCode) params.set('departementCode', query.departementCode);
  if (query?.auteurId) params.set('auteurId', query.auteurId);

  const res = await apiFetch(`/demandes-modification?${params.toString()}`);
  return res.json();
}

export async function findDemandeById(id: string): Promise<Demande> {
  const res = await apiFetch(`/demandes-modification/${id}`);
  return res.json();
}

export async function createDemande(
  input: CreateDemandeInput,
): Promise<Demande> {
  const res = await apiFetch(`/demandes-modification`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function traiterDemande(
  id: string,
  input: TraiterDemandeInput,
): Promise<Demande> {
  const res = await apiFetch(`/demandes-modification/${id}/traiter`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}
