// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API pour les modèles visuels et vues d'export (L6-10)
import { apiFetch } from './client';

export type ExportFormat = 'PDF' | 'XLSX';

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

export interface PaginatedExportStyles {
  data: ExportStyle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedExportViews {
  data: ExportView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExportStyleInput {
  code: string;
  styleVersion?: number;
  libelle: string;
  config: Record<string, unknown>;
  actif?: boolean;
}

export interface UpdateExportStyleInput {
  libelle?: string;
  config?: Record<string, unknown>;
  actif?: boolean;
}

export interface CreateExportViewInput {
  code: string;
  viewVersion?: number;
  libelle: string;
  vue: string;
  format: ExportFormat;
  config: Record<string, unknown>;
  actif?: boolean;
}

export interface UpdateExportViewInput {
  libelle?: string;
  vue?: string;
  format?: ExportFormat;
  config?: Record<string, unknown>;
  actif?: boolean;
}

export interface ExportStyleQueryParams {
  page?: number;
  limit?: number;
  code?: string;
  libelle?: string;
  actif?: boolean;
}

export interface ExportViewQueryParams {
  page?: number;
  limit?: number;
  code?: string;
  libelle?: string;
  vue?: string;
  format?: string;
  actif?: boolean;
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function buildQs(
  params?: Record<string, string | number | boolean | undefined> | ExportStyleQueryParams | ExportViewQueryParams | undefined,
): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
  }
  return qs.toString() ? `?${qs.toString()}` : '';
}

/* --------------------------- Styles --------------------------- */

/** GET /export-styles — liste paginée des styles (Admin uniquement) */
export async function fetchExportStyles(
  params?: ExportStyleQueryParams,
): Promise<PaginatedExportStyles> {
  const url = `/export-styles${buildQs(params)}`;
  const res = await apiFetch(url);
  return json<PaginatedExportStyles>(res);
}

/** GET /export-styles/:id — détail d'un style (Admin uniquement) */
export async function fetchExportStyleById(id: string): Promise<ExportStyle> {
  const res = await apiFetch(`/export-styles/${id}`);
  return json<ExportStyle>(res);
}

/** POST /export-styles — créer un style (Admin uniquement) */
export async function createExportStyle(
  dto: CreateExportStyleInput,
): Promise<ExportStyle> {
  const res = await apiFetch('/export-styles', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return json<ExportStyle>(res);
}

/** PATCH /export-styles/:id — mettre à jour un style (Admin uniquement)
 *  Si le style est déjà utilisé, le backend crée automatiquement une nouvelle version. */
export async function updateExportStyle(
  id: string,
  dto: UpdateExportStyleInput,
): Promise<ExportStyle> {
  const res = await apiFetch(`/export-styles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return json<ExportStyle>(res);
}

/** DELETE /export-styles/:id — supprimer un style (Admin uniquement)
 *  Renvoie 400 CONFIG_IN_USE si le style est déjà utilisé. */
export async function deleteExportStyle(id: string): Promise<void> {
  await apiFetch(`/export-styles/${id}`, { method: 'DELETE' });
}

/* --------------------------- Vues --------------------------- */

/** GET /export-views — liste paginée des vues (Admin/Gestionnaire) */
export async function fetchExportViews(
  params?: ExportViewQueryParams,
): Promise<PaginatedExportViews> {
  const url = `/export-views${buildQs(params)}`;
  const res = await apiFetch(url);
  return json<PaginatedExportViews>(res);
}

/** GET /export-views/:id — détail d'une vue (Admin/Gestionnaire) */
export async function fetchExportViewById(id: string): Promise<ExportView> {
  const res = await apiFetch(`/export-views/${id}`);
  return json<ExportView>(res);
}

/** POST /export-views — créer une vue (Admin/Gestionnaire) */
export async function createExportView(
  dto: CreateExportViewInput,
): Promise<ExportView> {
  const res = await apiFetch('/export-views', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return json<ExportView>(res);
}

/** PATCH /export-views/:id — mettre à jour une vue (Admin/Gestionnaire)
 *  Si la vue est déjà utilisée, le backend crée automatiquement une nouvelle version. */
export async function updateExportView(
  id: string,
  dto: UpdateExportViewInput,
): Promise<ExportView> {
  const res = await apiFetch(`/export-views/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return json<ExportView>(res);
}

/** DELETE /export-views/:id — supprimer une vue (Admin/Gestionnaire)
 *  Renvoie 400 CONFIG_IN_USE si la vue est déjà utilisée. */
export async function deleteExportView(id: string): Promise<void> {
  await apiFetch(`/export-views/${id}`, { method: 'DELETE' });
}