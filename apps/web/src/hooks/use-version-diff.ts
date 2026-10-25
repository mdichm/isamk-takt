'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchVersionDiff, type VersionDiffDto } from '@/lib/api/versions';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const versionDiffKeys = {
  all: ['versionDiff'] as const,
  detail: (versionId: string, againstId: string) =>
    [...versionDiffKeys.all, 'detail', versionId, againstId] as const,
};

// ============================================================================
// Lecture : diff entre deux versions (L5-11)
// ============================================================================

/** Hook pour récupérer le diff entre deux versions. */
export function useVersionDiff(versionId: string, againstId: string) {
  return useQuery<VersionDiffDto, Error>({
    queryKey: versionDiffKeys.detail(versionId, againstId),
    queryFn: () => fetchVersionDiff(versionId, againstId),
    enabled: !!versionId && !!againstId,
    staleTime: 30_000,
  });
}