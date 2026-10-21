import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDemandes, demandesKeys } from './use-demandes';
import * as api from '@/lib/api/demandes';

vi.mock('@/lib/api/demandes', () => ({
  findAllDemandes: vi.fn(),
}));

const mockFindAllDemandes = vi.mocked(api.findAllDemandes);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};

describe('useDemandes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return demandes data', async () => {
    mockFindAllDemandes.mockResolvedValue({
      data: [
        {
          id: 'd-1',
          semestreId: 'S1',
          departementCode: 'INFO',
          auteurId: 'user-1',
          type: 'ANOMALIE',
          cible: { affectationId: 'a-1' },
          motif: 'Erreur de volume',
          statut: 'OUVERTE',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const { result } = renderHook(
      () => useDemandes({ page: 1, limit: 10 }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].id).toBe('d-1');
    expect(mockFindAllDemandes).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('should handle error', async () => {
    mockFindAllDemandes.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useDemandes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should expose correct query key', () => {
    expect(demandesKeys.list({ page: 1 })).toEqual([
      'demandes',
      'list',
      { page: 1 },
    ]);
  });
});
