// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API pour les jobs d'export (L6-04 à L6-09)
import { apiFetch } from './client';

export type ExportFormat = 'PDF' | 'XLSX' | 'CSV';
export type ExportMode = 'BROUILLON' | 'OFFICIEL';
export type GrilleAffichage = 'NORMALE' | 'RAMADAN';
export type JobStatut = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';

export interface ExportView {
  id: string;
  code: string;
  viewVersion: number;
  libelle: string;
  vue: string;
  format: ExportFormat;
  config: Record<string, unknown>;
  actif: boolean;
  utiliseLe?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportStyle {
  id: string;
  code: string;
  styleVersion: number;
  libelle: string;
  config: Record<string, unknown>;
  actif: boolean;
  utiliseLe?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJob {
  id: string;
  versionId: string;
  styleId: string;
  viewId: string;
  auteurId: string;
  format: ExportFormat;
  mode: ExportMode;
  grille: GrilleAffichage;
  parametres: Record<string, unknown>;
  statut: JobStatut;
  storageKey?: string;
  sha256?: string;
  erreur?: string;
  styleVersion?: number;
  viewVersion?: number;
  avertissementsAcceptes?: string[];
  grilleEffective?: GrilleAffichage;
  createdAt: string;
  finishedAt?: string;
}

export interface PaginatedExportJobs {
  data: ExportJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DownloadUrl {
  downloadUrl: string;
  expiresIn: number;
}

export interface CreateExportJobInput {
  versionId: string;
  styleId?: string;
  viewId?: string;
  format: ExportFormat;
  mode: ExportMode;
  grille?: GrilleAffichage;
  parametres: Record<string, unknown>;
  avertissementsAcceptes?: string[];
}

export interface ExportQueryParams {
  page?: number;
  limit?: number;
  statut?: JobStatut;
  format?: ExportFormat;
  mode?: ExportMode;
  versionId?: string;
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/** GET /export-views — liste paginée des vues d'export (Admin/Gestionnaire) */
export async function fetchExportViews(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ExportView[]> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
  }
  const url = `/export-views${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch(url);
  const body = (await json<{ data: ExportView[] }>(res));
  return body.data;
}

/** GET /export-styles — liste paginée des styles d'export (Admin uniquement) */
export async function fetchExportStyles(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ExportStyle[]> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
  }
  const url = `/export-styles${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch(url);
  const body = (await json<{ data: ExportStyle[] }>(res));
  return body.data;
}

/** POST /exports — lancer un nouvel export */
export async function createExportJob(
  dto: CreateExportJobInput,
): Promise<ExportJob> {
  const res = await apiFetch('/exports', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return json<ExportJob>(res);
}

/** GET /exports — liste paginée des jobs d'export */
export async function fetchExportJobs(
  params?: ExportQueryParams,
): Promise<PaginatedExportJobs> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
  }
  const url = `/exports${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch(url);
  return json<PaginatedExportJobs>(res);
}

/** GET /exports/:id — détail et statut d'un job */
export async function fetchExportJobById(id: string): Promise<ExportJob> {
  const res = await apiFetch(`/exports/${id}`);
  return json<ExportJob>(res);
}

/** GET /exports/:id/download — URL signée de téléchargement */
export async function fetchExportDownloadUrl(id: string): Promise<DownloadUrl> {
  const res = await apiFetch(`/exports/${id}/download`);
  return json<DownloadUrl>(res);
}

/** Rafraîchit le statut d'un job (polling) */
export async function pollExportStatus(
  id: string,
  onUpdate: (job: ExportJob) => void,
  intervalMs = 3000,
  maxAttempts = 120,
): Promise<ExportJob> {
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    try {
      const job = await fetchExportJobById(id);
      onUpdate(job);
      if (job.statut === 'DONE' || job.statut === 'FAILED') {
        clearInterval(timer);
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    } catch {
      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }
  }, intervalMs);

  const first = await fetchExportJobById(id);
  onUpdate(first);
  return first;
}