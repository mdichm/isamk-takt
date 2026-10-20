import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de volume.dto.ts (L2-01)
   ============================================================================ */

export const VolumeTypeValues = ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const;
export type VolumeType = (typeof VolumeTypeValues)[number];

export interface ModuleVolume {
  id: string;
  moduleId: string;
  type: VolumeType;
  volume: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleVolumeInput {
  moduleId: string;
  type: VolumeType;
  volume: number;
}

export interface UpdateModuleVolumeInput {
  type?: VolumeType;
  volume?: number;
}

export interface PaginatedModuleVolumes {
  data: ModuleVolume[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ModuleVolumesQuery {
  page?: number;
  limit?: number;
}

/* ============================================================================
   Module Volumes
   ============================================================================ */

export async function findModuleVolumes(
  moduleId: string,
  query?: ModuleVolumesQuery,
): Promise<PaginatedModuleVolumes> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const res = await apiFetch(`/modules/${moduleId}/volumes?${params.toString()}`);
  return res.json();
}

export async function createModuleVolume(
  input: CreateModuleVolumeInput,
): Promise<ModuleVolume> {
  const res = await apiFetch('/modules/' + input.moduleId + '/volumes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateModuleVolume(
  moduleId: string,
  volumeId: string,
  input: UpdateModuleVolumeInput,
): Promise<ModuleVolume> {
  const res = await apiFetch(`/modules/${moduleId}/volumes/${volumeId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteModuleVolume(
  moduleId: string,
  volumeId: string,
): Promise<void> {
  await apiFetch(`/modules/${moduleId}/volumes/${volumeId}`, {
    method: 'DELETE',
  });
}
