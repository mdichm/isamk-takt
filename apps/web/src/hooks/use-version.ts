'use client';

import { useQuery } from '@tanstack/react-query';
import { findVersionById, type Version } from '@/lib/api/versions';
import { listAvertissementsConflits } from '@/lib/api/conflits';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const versionKeys = {
  all: ['version'] as const,
  detail: (versionId: string) =>
    [...versionKeys.all, 'detail', versionId] as const,
  avertissements: (versionId: string) =>
    [...versionKeys.all, 'avertissements', versionId] as const,
};

/**
 * Détail d'une version (statut, circuit figé appliqué).
 * Invalidation nécessaire après une transition de workflow (L5-19).
 */
export function useVersion(versionId: string) {
  return useQuery<Version, Error>({
    queryKey: versionKeys.detail(versionId),
    queryFn: () => findVersionById(versionId),
    enabled: !!versionId,
  });
}

/**
 * Nombre d'avertissements non acceptés sur une version.
 * Les avertissements non acceptés ne bloquent pas la soumission : leur nombre
 * est renvoyé pour la confirmation globale de l'interface (ST §3.4.11).
 */
export function useVersionAvertissements(versionId: string) {
  return useQuery<number, Error>({
    queryKey: versionKeys.avertissements(versionId),
    queryFn: async () => (await listAvertissementsConflits(versionId)).length,
    enabled: !!versionId,
  });
}
