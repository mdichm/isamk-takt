'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchVersionProvenance,
  type VersionProvenanceDto,
} from '@/lib/api/versions';

// ============================================================================
// Clés de cache React Query
// ============================================================================

export const versionProvenanceKeys = {
  all: ['versionProvenance'] as const,
  detail: (versionId: string) => [
    ...versionProvenanceKeys.all,
    'detail',
    versionId,
  ] as const,
};

// ============================================================================
// Lecture : chaîne de provenance d'une version (L5-12)
// ============================================================================

/** Hook pour récupérer la chaîne de provenance d'une version. */
export function useVersionProvenance(versionId: string) {
  return useQuery<VersionProvenanceDto, Error>({
    queryKey: versionProvenanceKeys.detail(versionId),
    queryFn: () => fetchVersionProvenance(versionId),
    enabled: !!versionId,
    staleTime: 30_000,
  });
}
