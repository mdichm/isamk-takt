// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API pour l'import depuis une année clôturée (L1-24)
import { apiFetch, API_BASE } from './client';

export type ImportType =
  | 'departements'
  | 'formations'
  | 'niveaux'
  | 'groupes'
  | 'modules'
  | 'salles'
  | 'enseignants'
  | 'creneaux'
  | 'grilleRamadan';

export interface ImportAnneeInput {
  cibleAnneeId: string;
  types: ImportType[];
  dryRun?: boolean;
  confirmation?: boolean;
  importId?: string;
  reinitialiserEffectifs?: boolean;
}

export interface ImportPreviewItem {
  type: ImportType;
  sourceId: string;
  sourceCode: string;
  action: 'ajout' | 'modification' | 'doublon' | 'conflit' | 'erreur';
  message: string;
  targetId?: string;
  sourceOriginId?: string;
}

export interface ImportConflict {
  type: ImportType;
  code: string;
  sourceId: string;
  targetId: string;
}

export interface ImportResume {
  ajout: number;
  modification: number;
  doublon: number;
  conflit: number;
  erreur: number;
}

export interface ImportPreviewDto {
  importId: string;
  sourceAnneeCode: string;
  cibleAnneeCode: string;
  items: ImportPreviewItem[];
  conflits: ImportConflict[];
  avertissements: string[];
  resume: ImportResume;
}

export interface ImportResultDto {
  importId: string;
  crees: Record<string, string[]>;
  ignores: Record<string, string[]>;
  avertissements: string[];
  conflits?: ImportConflict[];
}

export async function importAnneePreview(
  sourceAnneeId: string,
  input: ImportAnneeInput,
): Promise<ImportPreviewDto> {
  const res = await apiFetch(`${API_BASE}/annees/${sourceAnneeId}/import`, {
    method: 'POST',
    body: JSON.stringify({ ...input, dryRun: true }),
  });
  return res.json();
}

export async function importAnneeConfirm(
  sourceAnneeId: string,
  input: ImportAnneeInput,
): Promise<ImportResultDto> {
  const res = await apiFetch(`${API_BASE}/annees/${sourceAnneeId}/import`, {
    method: 'POST',
    body: JSON.stringify({ ...input, confirmation: true }),
  });
  return res.json();
}
