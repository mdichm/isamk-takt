import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAvertissements,
  useAccepterAvertissement,
} from './use-avertissements';
import * as api from '@/lib/api/avertissements';
import { toast } from 'sonner';

vi.mock('@/lib/api/avertissements', () => ({
  listAvertissements: vi.fn(),
  accepterAvertissement: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockListAvertissements = vi.mocked(api.listAvertissements);
const mockAccepterAvertissement = vi.mocked(api.accepterAvertissement);

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

describe('useAvertissements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return avertissements data', async () => {
    mockListAvertissements.mockResolvedValue([
      {
        id: 'c-1',
        regleCode: 'SALLE_SOUHAITE_MANQUANT',
        type: 'ROOM',
        severite: 'AVERTISSEMENT',
        objetType: 'Seance',
        objetId: 's-1',
        seanceIds: ['s-1'],
        message: 'Équipement souhaité manquant',
        signature: 'sig-1',
        createdAt: '2026-10-23T10:00:00Z',
        resoluLe: null,
      },
    ]);

    const { result } = renderHook(() => useAvertissements('v-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].regleCode).toBe('SALLE_SOUHAITE_MANQUANT');
    expect(mockListAvertissements).toHaveBeenCalledWith('v-1');
  });

  it('should be disabled when no versionId', async () => {
    const { result } = renderHook(() => useAvertissements(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockListAvertissements).not.toHaveBeenCalled();
  });
});

describe('useAccepterAvertissement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should accept an avertissement and invalidate queries', async () => {
    mockAccepterAvertissement.mockResolvedValue({
      id: 'a-1',
      versionId: 'v-1',
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      signature: 'sig-1',
      seanceIds: ['s-1'],
      auteurId: 'u-1',
      versionRevision: 0,
      acceptePar: 'u-1',
      accepteLe: '2026-10-23T10:00:00Z',
      impact: {
        seanceIds: ['s-1'],
        regleCode: 'SALLE_SOUHAITE_MANQUANT',
        message: 'Équipement souhaité manquant',
      },
    });

    const { result } = renderHook(() => useAccepterAvertissement('v-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      signature: 'sig-1',
      justification: 'Justification',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAccepterAvertissement).toHaveBeenCalledWith('v-1', {
      signature: 'sig-1',
      justification: 'Justification',
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Avertissement accepté avec succès.',
    );
  });

  it('should show error toast for 422 BLOCKING_NOT_ACCEPTABLE', async () => {
    const error = new Error('Blocked') as Error & { status?: number };
    error.status = 422;
    mockAccepterAvertissement.mockRejectedValue(error);

    const { result } = renderHook(() => useAccepterAvertissement('v-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ signature: 'sig-1' }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'Ce conflit est bloquant et ne peut pas être accepté.',
    );
  });

  it('should show error toast for 404', async () => {
    const error = new Error('Not found') as Error & { status?: number };
    error.status = 404;
    mockAccepterAvertissement.mockRejectedValue(error);

    const { result } = renderHook(() => useAccepterAvertissement('v-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ signature: 'sig-1' }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'Version ou avertissement introuvable.',
    );
  });
});
