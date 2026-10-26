// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - API client contraintes (L3-04)

import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend contrainte-definition.dto.ts / contrainte-instance.dto.ts
   ============================================================================ */

export type ContrainteCategorie = 'DURE' | 'SOUPLE';
export type ContraintePortee = 'GLOBALE' | 'ENSEIGNANT' | 'GROUPE' | 'SALLE' | 'MODULE';
export type ContrainteNature = 'REGLE' | 'VOEU';
export type ClasseRegle = 'HARD_CONSTRAINT' | 'SOFT_CONSTRAINT' | 'BUSINESS_VALIDATION' | 'INFORMATIONAL';
export type FetSupport = 'NATIF' | 'PARTIEL' | 'AUCUN';

export interface ContrainteDefinition {
  id: string;
  code: string;
  libelle: string;
  categorie: ContrainteCategorie;
  portee: ContraintePortee;
  classe: ClasseRegle;
  traductionFET: FetSupport;
  paramsSchema: Record<string, unknown>;
  fetSupport: FetSupport;
  actif: boolean;
}

export interface ContrainteInstance {
  id: string;
  semestreId: string;
  definitionId: string;
  enseignantId?: string;
  groupeId?: string;
  salleId?: string;
  moduleId?: string;
  params: Record<string, unknown>;
  poids?: number;
  nature: ContrainteNature;
  commentaire?: string;
  actif: boolean;
  creePar: string;
  creeLe: string;
}

export interface CreateContrainteInstanceInput {
  semestreId: string;
  definitionId: string;
  enseignantId?: string;
  groupeId?: string;
  salleId?: string;
  moduleId?: string;
  params: Record<string, unknown>;
  poids?: number;
  nature: ContrainteNature;
  commentaire?: string;
  actif?: boolean;
}

export interface UpdateContrainteInstanceInput {
  semestreId?: string;
  definitionId?: string;
  enseignantId?: string;
  groupeId?: string;
  salleId?: string;
  moduleId?: string;
  params?: Record<string, unknown>;
  poids?: number;
  nature?: ContrainteNature;
  commentaire?: string;
  actif?: boolean;
}

export interface PaginatedContrainteInstances {
  data: ContrainteInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContraintesQuery {
  page?: number;
  limit?: number;
  search?: string;
  semestreId?: string;
  definitionId?: string;
  enseignantId?: string;
  groupeId?: string;
  salleId?: string;
  moduleId?: string;
  nature?: ContrainteNature;
  actif?: boolean;
}

export interface ContraintesDefinitionsQuery {
  page?: number;
  limit?: number;
  actif?: boolean;
  categorie?: ContrainteCategorie;
  portee?: ContraintePortee;
}

/* ============================================================================
   Rapport de traduction FET (L4-06)
   ============================================================================ */

export type MappingStatut = 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';

export interface FetMappingItem {
  regleCode: string;
  statut: MappingStatut;
  raison?: string;
  controleeParApplication: boolean;
  definitionId?: string;
}

export interface FetMappingStats {
  TRADUITE: number;
  PARTIELLE: number;
  NON_TRADUITE: number;
}

export interface FetMappingReport {
  semestreId: string;
  items: FetMappingItem[];
  total: number;
  stats: FetMappingStats;
}

/* ============================================================================
   Définitions de contraintes (catalogue)
   ============================================================================ */

export async function findAllContrainteDefinitions(
  query?: ContraintesDefinitionsQuery,
): Promise<{ data: ContrainteDefinition[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.actif !== undefined) params.set('actif', String(query.actif));
  if (query?.categorie) params.set('categorie', query.categorie);
  if (query?.portee) params.set('portee', query.portee);
  const res = await apiFetch(`/contraintes/definitions?${params.toString()}`);
  return res.json();
}

/* ============================================================================
   Instances de contraintes
   ============================================================================ */

export async function findAllContrainteInstances(
  query?: ContraintesQuery,
): Promise<PaginatedContrainteInstances> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.search) params.set('search', query.search);
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.definitionId) params.set('definitionId', query.definitionId);
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.groupeId) params.set('groupeId', query.groupeId);
  if (query?.salleId) params.set('salleId', query.salleId);
  if (query?.moduleId) params.set('moduleId', query.moduleId);
  if (query?.nature) params.set('nature', query.nature);
  if (query?.actif !== undefined) params.set('actif', String(query.actif));
  const res = await apiFetch(`/contraintes/instances?${params.toString()}`);
  return res.json();
}

export async function findContrainteInstanceById(id: string): Promise<ContrainteInstance> {
  const res = await apiFetch(`/contraintes/instances/${id}`);
  return res.json();
}

export async function createContrainteInstance(
  input: CreateContrainteInstanceInput,
): Promise<ContrainteInstance> {
  const res = await apiFetch(`/contraintes/instances`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateContrainteInstance(
  id: string,
  input: UpdateContrainteInstanceInput,
): Promise<ContrainteInstance> {
  const res = await apiFetch(`/contraintes/instances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteContrainteInstance(id: string): Promise<void> {
  await apiFetch(`/contraintes/instances/${id}`, { method: 'DELETE' });
}

/* ============================================================================
   Modification de contrainte après validation (L5-14)
   ============================================================================ */

export type ApplicationMode = 'immediate' | 'next_generation';

export interface AppliquerContrainteApresValidationInput {
  application: ApplicationMode;
  profilId?: string;
  definitionId?: string;
  enseignantId?: string;
  groupeId?: string;
  salleId?: string;
  moduleId?: string;
  poids?: number;
  nature?: 'REGLE' | 'VOEU';
  commentaire?: string;
  actif?: boolean;
}

export interface AppliquerContrainteApresValidationOutput {
  versionId: string;
  statut: string;
  actionRequiree: 'aucun' | 'regenerer' | 'annuler';
  conflits: Array<{
    id: string;
    regleCode: string;
    type: string;
    severite: string;
    objetType: string;
    objetId: string;
    seanceIds: string[];
    message: string;
  }>;
  versionPublieeId: string | null;
}

export async function appliquerContrainteApresValidation(
  id: string,
  input: AppliquerContrainteApresValidationInput,
): Promise<AppliquerContrainteApresValidationOutput> {
  const res = await apiFetch(
    `/contraintes/instances/${id}/appliquer-apres-validation`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return res.json();
}

/* ============================================================================
   Rapport de traduction FET (L4-06)
   ============================================================================ */

export async function findFetMappingReport(
  semestreId: string,
): Promise<FetMappingReport> {
  const res = await apiFetch(
    `/semestres/${semestreId}/contraintes/fet-mapping`,
  );
  return res.json();
}