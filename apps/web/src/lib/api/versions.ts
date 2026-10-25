import { apiFetch } from './client';

/* ============================================================================
   Versions (aligné sur VersionResponseDto du backend L3-09)
   ============================================================================ */

export interface Version {
  id: string;
  semestreId: string;
  numero: string;
  statut: string;
  motif?: string;
  createdAt: string;
  updatedAt: string;
}

export async function findVersions(): Promise<Version[]> {
  const res = await apiFetch('/versions');
  return res.json();
}

export async function findVersionById(id: string): Promise<Version> {
  const res = await apiFetch(`/versions/${id}`);
  return res.json();
}

/* ============================================================================
   Couverture / Complétude (L3-30 / L3-31)
   GET /versions/{id}/completude
   ============================================================================ */

export interface CompletudeAffectation {
  affectationKey: string;
  attendu: number;
  place: number;
  ecart: number;
}

export interface CompletudeResponse {
  attenduTotal: number;
  placeTotal: number;
  ecartTotal: number;
  couvertureTotale: number;
  couvertureExacte: boolean;
  parAffectation: CompletudeAffectation[];
}

export async function fetchCompletude(versionId: string): Promise<CompletudeResponse> {
  const res = await apiFetch(`/versions/${versionId}/completude`);
  return res.json();
}

/* ============================================================================
   Historique de version (L5-09)
   GET /versions/{id}/history
   ============================================================================ */

export interface HistoryEntry {
  id: string;
  de: string;
  vers: string;
  action: string;
  userId: string;
  userName: string;
  automatique: boolean;
  commentaire: string | null;
  at: string;
}

export interface HistoryResponse {
  versionId: string;
  entries: HistoryEntry[];
}

export async function fetchHistory(versionId: string): Promise<HistoryResponse> {
  const res = await apiFetch(`/versions/${versionId}/history`);
  return res.json();
}

/* ============================================================================
   Analyse d'impact par département (L5-03)
   GET /versions/{id}/impact
   ============================================================================ */

export interface ImpactDepartementDto {
  departementId: string;
  departementCode: string;
  departementLibelle: string;
  statut: 'IMPACTE' | 'NON_IMPACTE';
  raison: string;
  reportee: boolean;
  cycleSource?: string;
}

export interface ImpactResumeDto {
  impactes: number;
  nonImpactes: number;
  reportees: number;
}

export interface ImpactResponseDto {
  versionId: string;
  versionNumero: string;
  departements: ImpactDepartementDto[];
  resume: ImpactResumeDto;
}

export async function fetchImpact(versionId: string): Promise<ImpactResponseDto> {
  const res = await apiFetch(`/versions/${versionId}/impact`);
  return res.json() as Promise<ImpactResponseDto>;
}

/* ============================================================================
   Décision de validation par département (L5-04 / L5-05)
   POST /versions/{id}/validations
   ============================================================================ */

export type DecisionDepartement = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';

export interface ValidationDepartementDto {
  departementId: string;
  decision: DecisionDepartement;
  motif?: string;
}

export interface ValidationResponseDto {
  versionId: string;
  versionNumero: string;
  departementId: string;
  decision: DecisionDepartement;
  motif?: string;
  parAdministrateur: boolean;
  unanimiteAtteinte: boolean;
  nouveauStatutVersion?: string;
  at?: string;
}

export async function submitValidation(
  versionId: string,
  dto: ValidationDepartementDto,
): Promise<ValidationResponseDto> {
  const res = await apiFetch(`/versions/${versionId}/validations`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return res.json() as Promise<ValidationResponseDto>;
}

/* ============================================================================
   Prévisualisation avant publication (L5-08)
   GET /versions/{id}/previsualisation-publication
   ============================================================================ */

export interface DepartementValideDto {
  departementId: string;
  departementCode: string;
  departementLibelle: string;
  decision: string;
  userId: string | null;
  at: string | null;
}

export interface ConflitPrevisDto {
  id: string;
  type: string;
  severite: 'BLOQUANT' | 'AVERTISSEMENT' | 'INFORMATION';
  resoluLe: string | null;
}

export interface AvertissementAccepteDto {
  regleCode: string;
  auteurId: string;
  accepteLe: string;
}

export interface VerrouPrevisDto {
  id: string;
  type: 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE';
  seanceId: string;
  auteurId: string;
  creeLe: string;
}

export interface ProvenanceDto {
  generationId: string | null;
  profilVersion: string | null;
  profilNom: string | null;
  perimetreHash: string | null;
  engineVersion: string | null;
}

export interface ActivitePrevisDto {
  affectationKey: string;
  enseignantId: string | null;
  enseignantNom: string;
  salleId: string | null;
  salleCode: string | null;
  planifiee: boolean;
}

export interface PrevisualisationPublicationDto {
  versionId: string;
  versionNumero: string;
  statut: string;
  revision: number;
  versionPrecedenteId: string | null;
  versionPrecedenteNumero: string | null;
  departementsValides: DepartementValideDto[];
  activitesModifiees: number;
  conflits: ConflitPrevisDto[];
  avertissementsAcceptes: AvertissementAccepteDto[];
  verrous: VerrouPrevisDto[];
  provenance: ProvenanceDto;
  activites: ActivitePrevisDto[];
  at: string;
}

export async function fetchPrevisualisationPublication(
  versionId: string,
): Promise<PrevisualisationPublicationDto> {
  const res = await apiFetch(
    `/versions/${versionId}/previsualisation-publication`,
  );
  return res.json() as Promise<PrevisualisationPublicationDto>;
}

/* ============================================================================
   Publication de version (L5-07)
   POST /versions/{id}/publish
   ============================================================================ */

export interface PublishResponseDto {
  versionId: string;
  numero: string;
  statut: string;
  versionPrecedenteId: string | null;
  versionPrecedenteNumero: string | null;
  at: string;
}

export async function publishVersion(
  versionId: string,
): Promise<PublishResponseDto> {
  const res = await apiFetch(`/versions/${versionId}/publish`, {
    method: 'POST',
  });
  return res.json() as Promise<PublishResponseDto>;
}