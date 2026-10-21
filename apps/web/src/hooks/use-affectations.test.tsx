import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAffectations } from './use-affectations';
import * as api from '@/lib/api/repartitions';

vi.mock('@/lib/api/repartitions', () => ({
  findAllAffectations: vi.fn(),
}));

const mockFindAllAffectations = vi.mocked(api.findAllAffectations);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe('useAffectations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return affectations data', async () => {
    mockFindAllAffectations.mockResolvedValue({
      data: [{
        id: 'a-1',
        repartitionId: 'r-1',
        enseignantId: 'e-1',
        groupeId: 'g-1',
        moduleId: 'm-1',
        typeEnseignementId: 't-1',
        activityTagId: undefined,
        volumeHebdoMinutes: 90,
        seancesParSemaine: 1,
        dureeMinutes: 90,
        estCmCommun: false,
        workingRevision: 1,
        createdAt: '',
        updatedAt: '',
      }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const { result } = renderHook(
      () => useAffectations('r-1', { page: 1, limit: 10 }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].id).toBe('a-1');
    expect(mockFindAllAffectations).toHaveBeenCalledWith('r-1', {
      page: 1,
      limit: 10,
    });
  });

  it('should handle error', async () => {
    mockFindAllAffectations.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(
      () => useAffectations('r-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
