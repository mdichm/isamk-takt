import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConflits, useSimulatePlacement } from './use-conflits';
import * as api from '@/lib/api/conflits';
import { toast } from 'sonner';

vi.mock('@/lib/api/conflits', () => ({
  listConflits: vi.fn(),
  simulatePlacement: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockListConflits = vi.mocked(api.listConflits);
const mockSimulatePlacement = vi.mocked(api.simulatePlacement);

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

describe('useConflits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return conflits data', async () => {
    mockListConflits.mockResolvedValue([
      {
        id: 'c-1',
        regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
        type: 'ENSEIGNANT',
        severite: 'BLOQUANT',
        objetType: 'Seance',
        objetId: 's-1',
        seanceIds: ['s-1'],
        message: 'Double booking enseignant',
        signature: 'sig-1',
        createdAt: '2026-10-23T10:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useConflits('v-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].regleCode).toBe('ENSEIGNANT_DOUBLE_BOOKING');
    expect(mockListConflits).toHaveBeenCalledWith('v-1');
  });

  it('should be disabled when no versionId', async () => {
    const { result } = renderHook(() => useConflits(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockListConflits).not.toHaveBeenCalled();
  });
});

describe('useSimulatePlacement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should simulate a placement and show success toast', async () => {
    mockSimulatePlacement.mockResolvedValue({
      conflits: [],
      conflitsBloquants: [],
      conflitsAvertissements: [],
      placementValide: true,
      impacts: {
        groupes: ['G1'],
        enseignant: 'Dupont',
        salle: 'Amphi A',
        verrous: [],
      },
      dureeMs: 42,
    });

    const { result } = renderHook(() => useSimulatePlacement('seance-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      jour: 'LUNDI',
      creneauDebutId: 'c-1',
      salleId: 'salle-1',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSimulatePlacement).toHaveBeenCalledWith('seance-1', {
      jour: 'LUNDI',
      creneauDebutId: 'c-1',
      salleId: 'salle-1',
    });
    expect(toast.success).toHaveBeenCalledWith('Simulation effectuée.');
  });

  it('should show error toast on simulation failure', async () => {
    mockSimulatePlacement.mockRejectedValue(new Error('Erreur simulation'));

    const { result } = renderHook(() => useSimulatePlacement('seance-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      jour: 'LUNDI',
      creneauDebutId: 'c-1',
      salleId: 'salle-1',
    }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalled();
  });
});
