import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRepartitions } from './use-repartitions';
import * as api from '@/lib/api/repartitions';

vi.mock('@/lib/api/repartitions', () => ({
  findAllRepartitions: vi.fn(),
}));

const mockFindAllRepartitions = vi.mocked(api.findAllRepartitions);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};

describe('useRepartitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne la liste paginée des répartitions', async () => {
    mockFindAllRepartitions.mockResolvedValue({
      data: [
        {
          id: 'rep-1',
          semestreId: 'sem-1',
          departementId: 'dep-1',
          statut: 'VALIDEE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          semestreNumero: 1,
          departementCode: 'INFO',
          departementLibelle: 'Informatique',
        },
      ],
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
    });

    const { result } = renderHook(
      () => useRepartitions({ page: 1, limit: 12, statut: 'VALIDEE' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.data[0].departementLibelle).toBe('Informatique');
    expect(mockFindAllRepartitions).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      statut: 'VALIDEE',
    });
  });

  it('remonte les filtres optionnels vides', async () => {
    mockFindAllRepartitions.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    });

    const { result } = renderHook(
      () =>
        useRepartitions({
          page: 1,
          limit: 12,
          search: undefined,
          statut: undefined,
          departementId: undefined,
          semestreId: undefined,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual([]);
  });

  it('gère les erreurs', async () => {
    mockFindAllRepartitions.mockRejectedValue(new Error('Erreur API'));

    const { result } = renderHook(() => useRepartitions({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});