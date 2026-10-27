// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API Espace Direction (L5-29)
// Lecture seule : plannings publiés/archivés, répartition, charges, contraintes, audit, exports officiels.
import { apiFetch } from './client';

const API_BASE = typeof window === 'undefined'
  ? 'http://localhost:3000'
  : window.location.origin;

export interface DirectionVersion {
  id: string;
  numero: string;
  statut: string;
}

export interface DirectionSeance {
  id: string;
  versionId: string;
  semestreId: string;
  affectationKey: string;
  rang: number;
  tag: string | null;
  statut: string;
  origine: string | null;
  revision: number;
  jour: string;
  creneauDebutId: string | null;
  nbCreneaux: number | null;
  enseignantId: string | null;
  salleId: string | null;
}

export interface PaginatedSeances {
  data: DirectionSeance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DirectionExport {
  id: string;
  libelle: string;
  description: string;
  format: string;
  disponible: boolean;
  roles: string[];
}

export interface RepariationListItem {
  id: string;
  semestreId: string;
  departementId: string;
  statut: string;
  libelle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRepartitions {
  data: RepariationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChargeListItem {
  id: string;
  enseignantId: string;
  volumeBrut: number;
  chargeCalculee: number;
  chargeReference: number;
  decharges: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
}

export interface PaginatedCharges {
  data: ChargeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContrainteDefinitionItem {
  id: string;
  code: string;
  libelle: string;
  categorie: string;
  portee: string;
  actif: boolean;
}

export interface PaginatedContraintes {
  data: ContrainteDefinitionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string | null;
  action: string;
  objetType: string;
  objetId: string;
  ancienneValeur: Record<string, unknown> | null;
  nouvelleValeur: Record<string, unknown> | null;
  versionId: string | null;
  motif: string | null;
  requestId: string | null;
  ip: string | null;
}

export interface PaginatedAudit {
  data: AuditEntry[];
  nextCursor: string | null;
}

function urlWithParams(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function fetchDirectionVersions(): Promise<DirectionVersion[]> {
  const res = await apiFetch('/direction/versions');
  return res.json() as Promise<DirectionVersion[]>;
}

export async function fetchDirectionSeances(
  versionId: string,
  params?: { page?: number; limit?: number; statut?: string; jour?: string; enseignantId?: string; salleId?: string },
): Promise<PaginatedSeances> {
  const res = await apiFetch(urlWithParams(`/direction/versions/${versionId}/seances`, params));
  return res.json() as Promise<PaginatedSeances>;
}

export async function fetchDirectionRepartitions(
  params?: { page?: number; limit?: number; search?: string; statut?: string; semestreId?: string },
): Promise<PaginatedRepartitions> {
  const res = await apiFetch(urlWithParams('/direction/repartitions', params));
  return res.json() as Promise<PaginatedRepartitions>;
}

export async function fetchDirectionCharges(
  params?: { page?: number; limit?: number; enseignantId?: string; departementId?: string },
): Promise<PaginatedCharges> {
  const res = await apiFetch(urlWithParams('/direction/charges', params));
  return res.json() as Promise<PaginatedCharges>;
}

export async function fetchDirectionContraintes(
  params?: { page?: number; limit?: number; actif?: boolean; categorie?: string },
): Promise<PaginatedContraintes> {
  const res = await apiFetch(urlWithParams('/direction/contraintes', params));
  return res.json() as Promise<PaginatedContraintes>;
}

export async function fetchDirectionAudit(
  params?: { objetType?: string; objetId?: string; userId?: string; from?: string; to?: string; limit?: number; cursor?: string },
): Promise<PaginatedAudit> {
  const res = await apiFetch(urlWithParams('/direction/audit', params));
  return res.json() as Promise<PaginatedAudit>;
}

export async function fetchDirectionExports(): Promise<DirectionExport[]> {
  const res = await apiFetch('/direction/exports');
  return res.json() as Promise<DirectionExport[]>;
}
