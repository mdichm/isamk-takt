// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API pour l'import de fichier CSV/XLSX (L1-27)
// POST /imports/{entite} (multipart/form-data) — dryRun par défaut, confirmation pour appliquer.
import { apiFetch } from './client';
import type { Messages } from '@/lib/messages/fr';

export type ImportEntity = 'enseignants' | 'salles' | 'groupes' | 'modules' | 'indisponibilites' | 'voeux' | 'contraintes' | 'covoiturage';

export type ImportAction = 'ajout' | 'modification' | 'doublon' | 'conflit' | 'erreur';

export interface ImportFichierOptions {
  dryRun?: boolean;
  confirmation?: boolean;
  importId?: string;
}

export interface ImportFichierItem {
  ligne: number;
  colonne: string;
  valeur: string;
  action: ImportAction;
  message: string;
  correctionAttendue?: string;
  targetId?: string;
}

export interface ImportImpact {
  entite: ImportEntity;
  code: string;
  utiliseDans: string[];
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
  entite: ImportEntity;
  totalLignes: number;
  items: ImportFichierItem[];
  impacts: ImportImpact[];
  resume: ImportResume;
}

export interface ImportConflict {
  entite: ImportEntity;
  code: string;
  targetId: string;
}

export interface ImportResultDto {
  importId: string;
  crees: string[];
  ignores: string[];
  avertissements: string[];
  conflits?: ImportConflict[];
}

export const IMPORT_ENTITIES: {
  value: ImportEntity;
  labelKey: keyof Messages;
}[] = [
  { value: 'enseignants', labelKey: 'entiteEnseignants' },
  { value: 'salles', labelKey: 'entiteSalles' },
  { value: 'groupes', labelKey: 'entiteGroupes' },
  { value: 'modules', labelKey: 'entiteModules' },
  { value: 'indisponibilites', labelKey: 'entiteIndisponibilites' },
  { value: 'voeux', labelKey: 'entiteVoeux' },
  { value: 'contraintes', labelKey: 'entiteContraintes' },
  { value: 'covoiturage', labelKey: 'entiteCovoiturage' },
];

function queryString(options: ImportFichierOptions): string {
  const params = new URLSearchParams();
  if (options.dryRun !== undefined) params.set('dryRun', String(options.dryRun));
  if (options.confirmation !== undefined) {
    params.set('confirmation', String(options.confirmation));
  }
  if (options.importId) params.set('importId', options.importId);
  return params.toString();
}

export async function importFichierPreview(
  entite: ImportEntity,
  file: File,
  options: ImportFichierOptions = {},
): Promise<ImportPreviewDto> {
  const formData = new FormData();
  formData.append('file', file);
  const qs = queryString({ ...options, dryRun: true });
  const url = `/imports/${entite}${qs ? `?${qs}` : ''}`;
  const res = await apiFetch(url, { method: 'POST', body: formData });
  return res.json();
}

export async function importFichierConfirm(
  entite: ImportEntity,
  file: File,
  importId: string,
): Promise<ImportResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  const qs = queryString({ confirmation: true, importId });
  const url = `/imports/${entite}?${qs}`;
  const res = await apiFetch(url, { method: 'POST', body: formData });
  return res.json();
}
