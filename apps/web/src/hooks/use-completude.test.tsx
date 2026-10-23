import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompletude } from './use-completude';
import * as api from '@/lib/api/versions';

vi.mock('@/lib/api/versions', () => ({
  fetchCompletude: vi.fn(),
}));

const mockFetchCompletude = vi.mocked(api.fetchCompletude);

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

const mockCompletudeResponse = {
  attenduTotal: 100,
  placeTotal: 90,
  ecartTotal: 10,
  couvertureTotale: 90,
  couvertureExacte: false,
  parAffectation: [
    { affectationKey: 'g-1:m-1:t-1:e-1', attendu: 50, place: 45, ecart: 5 },
    { affectationKey: 'g-2:m-1:t-1:e-2', attendu: 50, place: 45, ecart: 5 },
  ],
};

describe('useCompletude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches completude data for a version', async () => {
    mockFetchCompletude.mockResolvedValue(mockCompletudeResponse);

    const { result } = renderHook(() => useCompletude('version-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCompletudeResponse);
    expect(mockFetchCompletude).toHaveBeenCalledWith('version-1');
  });

  it('returns error when fetch fails', async () => {
    mockFetchCompletude.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCompletude('version-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('does not fetch when versionId is empty', () => {
    const { result } = renderHook(() => useCompletude(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(mockFetchCompletude).not.toHaveBeenCalled();
  });
});
