import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVoeux } from './use-voeux';
import * as api from '@/lib/api/voeux';

vi.mock('@/lib/api/voeux', () => ({
  findAllVoeux: vi.fn(),
}));

const mockFindAllVoeux = vi.mocked(api.findAllVoeux);

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

describe('useVoeux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return voeux data', async () => {
    mockFindAllVoeux.mockResolvedValue({
      data: [{
        id: 'v-1',
        semestreId: 's-1',
        enseignantId: 'e-1',
        code: 'TEACHER_DAY_OFF_WISH',
        params: { code: 'TEACHER_DAY_OFF_WISH', Jour: 'Lundi' },
        poids: 50,
        actif: true,
        creePar: 'system',
        creeLe: '2026-01-01T00:00:00Z',
      }],
      total: 1, page: 1, limit: 50, totalPages: 1,
    });

    const { result } = renderHook(() => useVoeux({ semestreId: 's-1' }), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].id).toBe('v-1');
    expect(mockFindAllVoeux).toHaveBeenCalledWith({ semestreId: 's-1' });
  });

  it('should handle error', async () => {
    mockFindAllVoeux.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useVoeux(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});