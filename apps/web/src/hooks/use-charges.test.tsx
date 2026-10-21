import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCharges, useChargeByEnseignant } from './use-charges';
import * as api from '@/lib/api/charges';

vi.mock('@/lib/api/charges', () => ({
  findAllCharges: vi.fn(),
  findChargeByEnseignant: vi.fn(),
}));

const mockFindAllCharges = vi.mocked(api.findAllCharges);
const mockFindChargeByEnseignant = vi.mocked(api.findChargeByEnseignant);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};

describe('useCharges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return charges data', async () => {
    mockFindAllCharges.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    const { result } = renderHook(() => useCharges({ dimension: 'departement' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(0);
    expect(mockFindAllCharges).toHaveBeenCalledWith({ dimension: 'departement' });
  });

  it('should handle error', async () => {
    mockFindAllCharges.mockRejectedValue(new Error('Erreur API'));

    const { result } = renderHook(() => useCharges({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useChargeByEnseignant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return enseignant charge data', async () => {
    mockFindChargeByEnseignant.mockResolvedValue({
      enseignantId: 'e-1',
      matricule: 'ENS001',
      nom: 'Doe',
      prenom: 'John',
      volumeBrut: 100,
      chargePonderee: 120,
      chargeReference: 180,
      decharges: 0,
      serviceDu: 180,
      ecart: -60,
      heuresSup: 0,
      depassePlafond: false,
      calculPartiel: false,
      detail: [],
    });

    const { result } = renderHook(() => useChargeByEnseignant('e-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.enseignantId).toBe('e-1');
    expect(mockFindChargeByEnseignant).toHaveBeenCalledWith('e-1');
  });

  it('should not fetch when enseignantId is empty', async () => {
    const { result } = renderHook(() => useChargeByEnseignant(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockFindChargeByEnseignant).not.toHaveBeenCalled();
  });
});