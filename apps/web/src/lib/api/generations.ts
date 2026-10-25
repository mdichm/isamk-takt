// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - API client générations (L4-20)
// POST /versions/{id}/generations, GET /generations/{id}, POST /generations/{id}/cancel,
// GET /generations/{id}/engine-file, GET /generations/{id}/events (SSE)

import { apiFetch, API_BASE } from './client';

/* ============================================================================
   Types alignés sur les DTO backend (L4-14, L4-15)
   ============================================================================ */

export type GenerationStatut =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'SUCCEEDED_WITH_WARNINGS'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT';

export type GenerationMode = 'AUTOMATIQUE' | 'MANUELLE';

export interface FichierMoteurInfo {
  sha256: string;
  engineVersion: string;
  downloadUrl?: string;
  createdAt?: string;
}

export interface GenerationDetail {
  id: string;
  versionId: string;
  semestreId: string;
  statut: GenerationStatut;
  mode: GenerationMode;
  profilGenerationId?: string | null;
  profilGenerationVersion?: string | null;
  perimetreHash?: string | null;
  engineVersion?: string | null;
  seeds?: number[] | null;
  score?: number | null;
  classee?: boolean | null;
  classement?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationSeconds?: number | null;
  erreur?: string | null;
  metrics?: Record<string, unknown> | null;
  cancelRequested?: boolean;
  fichierMoteur?: FichierMoteurInfo | null;
  queuedAt: string;
  createdAt: string;
}

export interface GenerationResponse {
  id: string;
  versionId: string;
  semestreId: string;
  profilId?: string | null;
  statut: GenerationStatut;
  mode: GenerationMode;
  perimetreHash: string;
  queuedAt: string;
  createdAt: string;
}

export interface CreateGenerationInput {
  profilId: string;
  perimetreHash: string;
  acknowledgeUntranslatedConstraints?: boolean;
}

export interface CancelGenerationResponse {
  generationId: string;
  statut: string;
  message: string;
  cancelRequested: boolean;
}

export interface EngineFileResponse {
  generationId: string;
  downloadUrl: string;
  sha256: string;
  engineVersion: string;
  expiresAt?: string;
}

/* ============================================================================
   Types alignés sur les DTO backend (L4-18, L4-19, L4-21)
   ============================================================================ */

export interface GenerationSummary {
  id: string;
  versionId: string;
  versionNom: string;
  statut: string;
  score?: number | null;
  classee?: boolean | null;
  classement?: number | null;
  metrics?: Record<string, unknown> | null;
  motifNonClassee?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationSeconds?: number | null;
}

export interface SeanceValeur {
  generationId: string;
  jour?: string;
  creneauDebutId?: string;
  salleId?: string;
  enseignantId?: string;
}

export interface ChangementSeance {
  cle: string;
  generations: SeanceValeur[];
}

export interface ConflitDiff {
  conflitsApparus: string[];
  conflitsDisparus: string[];
}

export interface VerrouDiff {
  verrousRespectes: boolean[];
}

export interface CompareDiff {
  seancesIdentiques: string[];
  seancesDifferentes: string[];
  changements: ChangementSeance[];
  conflits: ConflitDiff;
  verrous: VerrouDiff;
}

export interface CompareResponse {
  generations: GenerationSummary[];
  diff: CompareDiff;
}

export interface AdoptGenerationInput {
  generationId: string;
}

export interface AdoptResponse {
  versionId: string;
  numero: string;
  statut: string;
  conflitsInitiaux: number;
}

/* ============================================================================
   API fonctions — Générations
   ============================================================================ */

/**
 * Lance une génération pour une version.
 * POST /versions/{id}/generations -> 202
 */
export async function launchGeneration(
  versionId: string,
  input: CreateGenerationInput,
): Promise<GenerationResponse> {
  const res = await apiFetch(`/versions/${versionId}/generations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

/**
 * Récupère le détail d'une génération.
 * GET /generations/{id} -> 200
 */
export async function getGenerationDetail(
  id: string,
): Promise<GenerationDetail> {
  const res = await apiFetch(`/generations/${id}`);
  return res.json();
}

/**
 * Demande l'annulation d'une génération.
 * POST /generations/{id}/cancel -> 200
 */
export async function cancelGeneration(
  id: string,
): Promise<CancelGenerationResponse> {
  const res = await apiFetch(`/generations/${id}/cancel`, {
    method: 'POST',
  });
  return res.json();
}

/**
 * Récupère l'URL signée pour télécharger le fichier moteur.
 * GET /generations/{id}/engine-file -> 200
 */
export async function getEngineFileUrl(
  id: string,
): Promise<EngineFileResponse> {
  const res = await apiFetch(`/generations/${id}/engine-file`);
  return res.json();
}

/**
 * Importe un résultat de génération manuelle.
 * POST /versions/{id}/generations/import -> 202
 * multipart/form-data avec file (.fet) et fichierMoteurSha256
 */
export interface ImportManualGenerationResponse {
  generationId: string;
  mode: GenerationMode;
}

export async function importManualGeneration(
  versionId: string,
  file: File,
  fichierMoteurSha256: string,
): Promise<ImportManualGenerationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fichierMoteurSha256', fichierMoteurSha256);

  const res = await apiFetch(`/versions/${versionId}/generations/import`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

/**
 * Crée une EventSource vers le flux SSE d'une génération.
 * GET /generations/{id}/events
 */
export function createGenerationEventSource(id: string): EventSource {
  return new EventSource(`${API_BASE}/generations/${id}/events`);
}

/* ============================================================================
   API fonctions — Historique, comparaison et adoption (L4-21)
   ============================================================================ */

/**
 * Liste les générations d'une version.
 * GET /versions/{id}/generations -> 200
 */
export async function getGenerationsByVersion(
  versionId: string,
): Promise<GenerationSummary[]> {
  const res = await apiFetch(`/versions/${versionId}/generations`);
  const data = await res.json();
  return data.items ?? [];
}

/**
 * Compare 2 à 4 générations entre elles.
 * GET /generations/compare?ids=... -> 200
 */
export async function compareGenerations(
  ids: string[],
): Promise<CompareResponse> {
  const searchParams = new URLSearchParams();
  for (const id of ids) {
    searchParams.append('ids', id);
  }
  const res = await apiFetch(`/generations/compare?${searchParams.toString()}`);
  return res.json();
}

/**
 * Adopte une génération comme base d'édition d'une version.
 * POST /versions/{id}/adopt -> 200
 */
export async function adoptGeneration(
  versionId: string,
  input: AdoptGenerationInput,
): Promise<AdoptResponse> {
  const res = await apiFetch(`/versions/${versionId}/adopt`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

/* ============================================================================
   Relance d'une génération (L4-24)
   ============================================================================ */

export interface RelancerGenerationResponse {
  id: string;
  versionId: string;
  semestreId: string;
  profilId?: string | null;
  statut: string;
  mode: string;
  perimetreHash: string;
  queuedAt: string;
  createdAt: string;
}

/**
 * Relance une génération en échec.
 * POST /generations/{id}/relancer -> 200
 */
export async function relancerGeneration(
  generationId: string,
): Promise<RelancerGenerationResponse> {
  const res = await apiFetch(`/generations/${generationId}/relancer`, {
    method: 'POST',
  });
  return res.json();
}

/* ============================================================================
   Périmètre (reutilisé pour l'affichage avant lancement)
   ============================================================================ */

export interface PerimetreDepartement {
  id: string;
  code: string;
  libelle: string;
}

export interface PerimetreActivite {
  id: string;
  moduleCode: string;
  typeEnseignement: string;
}

export interface PerimetreGroupe {
  id: string;
  code: string;
  niveau: string;
  effectif: number;
}

export interface PerimetreEnseignant {
  id: string;
  nom: string;
  prenom: string;
}

export interface PerimetreSalle {
  id: string;
  code: string;
  capacite: number;
}

export interface PerimetreContrainte {
  id: string;
  code: string;
  libelle: string;
  nature: string;
  portee: string;
  actif?: boolean;
}

export interface PerimetreVerrou {
  id: string;
  type: string;
  seanceId: string;
}

export interface PerimetreProfil {
  id: string;
  nom: string;
  numero: number;
  estParDefaut: boolean;
  engineVersion?: string | null;
  constructeurVersion?: string | null;
}

export interface PerimetreResponse {
  versionId: string;
  semestreId: string;
  annee: string;
  semestreNumero: number;
  departements: PerimetreDepartement[];
  activites: PerimetreActivite[];
  groupes: PerimetreGroupe[];
  enseignants: PerimetreEnseignant[];
  salles: PerimetreSalle[];
  contraintes: PerimetreContrainte[];
  verrous: PerimetreVerrou[];
  profil?: PerimetreProfil | null;
  versionDuJeuDeRegles?: string | null;
  versionAdaptateur?: string | null;
  perimetreHash: string;
  genereLe: string;
}

/**
 * Récupère le périmètre figé d'une version.
 * GET /versions/{id}/perimetre -> 200
 */
export async function getPerimetre(
  versionId: string,
): Promise<PerimetreResponse> {
  const res = await apiFetch(`/versions/${versionId}/perimetre`);
  return res.json();
}

/* ============================================================================
   Rapport de traduction FET (reutilisé pour l'acquittement avant lancement)
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

/**
 * Récupère le rapport de traduction FET d'un semestre.
 * GET /semestres/{id}/contraintes/fet-mapping -> 200
 */
export async function findFetMappingReport(
  semestreId: string,
): Promise<FetMappingReport> {
  const res = await apiFetch(
    `/semestres/${semestreId}/contraintes/fet-mapping`,
  );
  return res.json();
}

export { API_BASE };