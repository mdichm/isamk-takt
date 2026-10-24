// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - API client voeux (L3-34)

import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend voeux.dto.ts
   ============================================================================ */

export const VOEU_CODES = [
  'TEACHER_AVOID_SLOT',
  'TEACHER_DAY_OFF_WISH',
  'TEACHER_DAYS_PER_WEEK',
  'TEACHER_HOURS_PER_DAY',
  'TEACHER_GAPS',
] as const;

export type VOEU_CODE = (typeof VOEU_CODES)[number];

export const VOEU_POIDS_VALUES = [25, 50, 75, 90] as const;
export type VOEU_POIDS = (typeof VOEU_POIDS_VALUES)[number];

export interface VoeuResponseDto {
  id: string;
  semestreId: string;
  enseignantId: string;
  code: VOEU_CODE;
  params: Record<string, unknown>;
  poids: VOEU_POIDS;
  avertissement?: string;
  commentaire?: string;
  actif: boolean;
  creePar: string;
  creeLe: string;
}

export interface CreateVoeuDto {
  semestreId: string;
  enseignantId: string;
  code: VOEU_CODE;
  params: Record<string, unknown>;
  poids: VOEU_POIDS;
  commentaire?: string;
  actif?: boolean;
}

export interface UpdateVoeuDto {
  params?: Record<string, unknown>;
  poids?: VOEU_POIDS;
  commentaire?: string;
  actif?: boolean;
}

export interface VoeuQueryDto {
  semestreId?: string;
  enseignantId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVoeux {
  data: VoeuResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================================================================
   Vœux
   ============================================================================ */

export async function findAllVoeux(
  query?: VoeuQueryDto,
): Promise<PaginatedVoeux> {
  const params = new URLSearchParams();
  if (query?.semestreId) params.set('semestreId', query.semestreId);
  if (query?.enseignantId) params.set('enseignantId', query.enseignantId);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const res = await apiFetch(`/voeux?${params.toString()}`);
  return res.json();
}

export async function findVoeuById(id: string): Promise<VoeuResponseDto> {
  const res = await apiFetch(`/voeux/${id}`);
  return res.json();
}

export async function createVoeu(
  input: CreateVoeuDto,
): Promise<VoeuResponseDto> {
  const res = await apiFetch('/voeux', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateVoeu(
  id: string,
  input: UpdateVoeuDto,
): Promise<VoeuResponseDto> {
  const res = await apiFetch(`/voeux/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteVoeu(id: string): Promise<void> {
  await apiFetch(`/voeux/${id}`, { method: 'DELETE' });
}