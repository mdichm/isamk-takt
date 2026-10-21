// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API jeux de règles de charge (L2-05)

import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de charge-ruleset (L2-03)
   ============================================================================ */

export const PeriodeRegleValues = ['HEBDOMADAIRE', 'SEMESTRIELLE', 'ANNUELLE'] as const;
export type PeriodeRegle = (typeof PeriodeRegleValues)[number];

export interface ChargeRuleSet {
  id: string;
  numero: number;
  periode: PeriodeRegle;
  seuil: number | null;
  plafond: number | null;
  arrondi: number | null;
  publieLe: string | null;
  anneeId: string | null;
  createdAt: string;
  updatedAt: string;
  referenceGrades: ChargeReferenceGrade[];
  coefficients: ChargeCoefficient[];
}

export interface ChargeReferenceGrade {
  id: string;
  rulesetId: string;
  gradeId: string | null;
  coefficient: number;
  createdAt: string;
}

export interface ChargeCoefficient {
  id: string;
  rulesetId: string;
  typeId: string;
  coefficient: number;
  createdAt: string;
}

export interface CreateChargeRuleSetInput {
  numero: number;
  periode: PeriodeRegle;
  seuil?: number;
  plafond?: number;
  arrondi?: number;
  anneeId?: string;
}

export interface UpdateChargeRuleSetInput {
  numero?: number;
  periode?: PeriodeRegle;
  seuil?: number;
  plafond?: number;
  arrondi?: number;
  anneeId?: string;
}

export interface CreateChargeReferenceGradeInput {
  gradeId?: string;
  coefficient: number;
}

export interface UpdateChargeReferenceGradeInput {
  coefficient: number;
}

export interface CreateChargeCoefficientInput {
  typeId: string;
  coefficient: number;
}

/* ============================================================================
   Jeux de règles de charge
   ============================================================================ */

export async function findChargeRuleSets(): Promise<ChargeRuleSet[]> {
  const res = await apiFetch('/charge/rulesets');
  return res.json();
}

export async function findChargeRuleSet(id: string): Promise<ChargeRuleSet> {
  const res = await apiFetch(`/charge/rulesets/${id}`);
  return res.json();
}

export async function createChargeRuleSet(
  input: CreateChargeRuleSetInput,
): Promise<ChargeRuleSet> {
  const res = await apiFetch('/charge/rulesets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateChargeRuleSet(
  id: string,
  input: UpdateChargeRuleSetInput,
): Promise<ChargeRuleSet> {
  const res = await apiFetch(`/charge/rulesets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteChargeRuleSet(id: string): Promise<void> {
  await apiFetch(`/charge/rulesets/${id}`, { method: 'DELETE' });
}

export async function publishChargeRuleSet(id: string): Promise<ChargeRuleSet> {
  const res = await apiFetch(`/charge/rulesets/${id}/publish`, {
    method: 'POST',
  });
  return res.json();
}

export async function newChargeRuleSetVersion(
  id: string,
): Promise<ChargeRuleSet> {
  const res = await apiFetch(`/charge/rulesets/${id}/new-version`, {
    method: 'POST',
  });
  return res.json();
}

/* ============================================================================
   Coefficients par grade (reference grades)
   ============================================================================ */

export async function createChargeReferenceGrade(
  rulesetId: string,
  input: CreateChargeReferenceGradeInput,
): Promise<ChargeReferenceGrade> {
  const res = await apiFetch(`/charge/rulesets/${rulesetId}/reference-grades`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateChargeReferenceGrade(
  rulesetId: string,
  gradeId: string | null,
  coefficient: number,
): Promise<ChargeReferenceGrade> {
  const params = new URLSearchParams();
  if (gradeId !== null && gradeId !== undefined) {
    params.set('gradeId', gradeId);
  }
  const res = await apiFetch(
    `/charge/rulesets/${rulesetId}/reference-grades?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ coefficient }),
    },
  );
  return res.json();
}

export async function deleteChargeReferenceGrade(
  rulesetId: string,
  gradeId: string | null,
): Promise<void> {
  const params = new URLSearchParams();
  if (gradeId !== null && gradeId !== undefined) {
    params.set('gradeId', gradeId);
  }
  await apiFetch(
    `/charge/rulesets/${rulesetId}/reference-grades?${params.toString()}`,
    { method: 'DELETE' },
  );
}

/* ============================================================================
   Coefficients par type d'enseignement
   ============================================================================ */

export async function createChargeCoefficient(
  rulesetId: string,
  input: CreateChargeCoefficientInput,
): Promise<ChargeCoefficient> {
  const res = await apiFetch(`/charge/rulesets/${rulesetId}/coefficients`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateChargeCoefficient(
  rulesetId: string,
  typeId: string,
  coefficient: number,
): Promise<ChargeCoefficient> {
  const res = await apiFetch(
    `/charge/rulesets/${rulesetId}/coefficients/${typeId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ coefficient }),
    },
  );
  return res.json();
}

export async function deleteChargeCoefficient(
  rulesetId: string,
  typeId: string,
): Promise<void> {
  await apiFetch(
    `/charge/rulesets/${rulesetId}/coefficients/${typeId}`,
    { method: 'DELETE' },
  );
}