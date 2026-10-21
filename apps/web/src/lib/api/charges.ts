import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de charge.dto.ts (L2-10)
   ============================================================================ */

export type ChargeDimension = 'departement' | 'formation' | 'module' | 'groupe' | 'type';

/* ============================================================================
   Types alignés sur les DTO backend de annual-charge.dto.ts (L2-17) et
   charge.dto.ts (L2-18, charge-globale)
   ============================================================================ */

export type ChargeSource = 'SNAPSHOT_VALIDE' | 'COPIE_TRAVAIL' | 'ABSENT';

export interface SemestreChargeDto {
  chargeCalculee: number;
  source: ChargeSource;
  calculPartiel: boolean;
}

export interface ChargeTotaleAnnuelleDto {
  volumeBrut: number;
  chargeCalculee: number;
  chargeReference: number;
  decharges: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
  depassePlafond: boolean;
}

export interface AnnualChargeEnseignantDto {
  enseignantId: string;
  matricule: string;
  nom: string;
  prenom: string;
  departementId: string;
  departementLibelle: string;
  s1: SemestreChargeDto;
  s2: SemestreChargeDto;
  total: ChargeTotaleAnnuelleDto;
  divergence: boolean;
  detail: ChargeEnseignantDetail[];
}

export interface AnnualChargesDto {
  data: AnnualChargeEnseignantDto[];
  total: number;
}

export interface ChargeParDepartementDto {
  departementId: string;
  libelle: string;
  volumeBrut: number;
  chargeCalculee: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
}

export interface ChargeGlobaleDto {
  enseignantId: string;
  matricule: string;
  nom: string;
  prenom: string;
  totalVolumeBrut: number;
  totalChargeCalculee: number;
  totalChargeReference: number;
  totalDecharges: number;
  totalServiceDu: number;
  totalEcart: number;
  totalHeuresSup: number;
  alerteDepassement: boolean;
  calculPartiel: boolean;
  parDepartement: ChargeParDepartementDto[];
}

export interface ChargeAggregationItem {
  dimension: ChargeDimension;
  id: string;
  libelle: string;
  volumeBrut: number;
  chargePonderee: number;
  calculPartiel: boolean;
}

export interface ChargeEnseignantDetail {
  type: string;
  volume: number;
  coefficient: number;
  contribution: number;
}

export interface ChargeEnseignant {
  enseignantId: string;
  matricule: string;
  nom: string;
  prenom: string;
  volumeBrut: number;
  chargePonderee: number;
  chargeReference: number;
  decharges: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
  depassePlafond: boolean;
  calculPartiel: boolean;
  detail: ChargeEnseignantDetail[];
}

export interface PaginatedCharges {
  data: ChargeAggregationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChargesQuery {
  page?: number;
  limit?: number;
  enseignantId?: string;
  departementId?: string;
  formationId?: string;
  moduleId?: string;
  groupeId?: string;
  typeEnseignementId?: string;
  dimension?: ChargeDimension;
}

/* ============================================================================
   API fonctions
   ============================================================================ */

export async function findAllCharges(
  query?: ChargesQuery,
): Promise<PaginatedCharges> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.departementId) params.set('departementId', query.departementId);
  if (query?.formationId) params.set('formationId', query.formationId);
  if (query?.moduleId) params.set('moduleId', query.moduleId);
  if (query?.groupeId) params.set('groupeId', query.groupeId);
  if (query?.typeEnseignementId) params.set('typeEnseignementId', query.typeEnseignementId);
  if (query?.dimension) params.set('dimension', query.dimension);

  const res = await apiFetch(`/charges?${params.toString()}`);
  return res.json();
}

export async function findChargeByEnseignant(
  enseignantId: string,
): Promise<ChargeEnseignant> {
  const res = await apiFetch(`/charges/enseignant/${enseignantId}`);
  return res.json();
}

/* ============================================================================
   Vue annuelle des charges (L2-17 / L2-18)
   ============================================================================ */

export interface AnnualChargesQuery {
  anneeId?: string;
  departementId?: string;
  enseignantId?: string;
}

export async function findAnnualCharges(
  query?: AnnualChargesQuery,
): Promise<AnnualChargesDto> {
  const params = new URLSearchParams();
  if (query?.anneeId) params.set('anneeId', query.anneeId);
  if (query?.departementId) params.set('departementId', query.departementId);
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);

  const qs = params.toString();
  const res = await apiFetch(`/charges/annuelles${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function findChargeGlobale(
  enseignantId: string,
): Promise<ChargeGlobaleDto> {
  const res = await apiFetch(`/enseignants/${enseignantId}/charge-globale`);
  return res.json();
}