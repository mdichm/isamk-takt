import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChargeGlobale, useAnnualCharges } from './use-charges';
import * as api from '@/lib/api/charges';

vi.mock('@/lib/api/charges', () => ({
  findAllCharges: vi.fn(),
  findChargeByEnseignant: vi.fn(),
  findAnnualCharges: vi.fn(),
  findChargeGlobale: vi.fn(),
}));

const mockFindChargeGlobale = vi.mocked(api.findChargeGlobale);
const mockFindAnnualCharges = vi.mocked(api.findAnnualCharges);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};

describe('useChargeGlobale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return charge globale data', async () => {
    mockFindChargeGlobale.mockResolvedValue({
      enseignantId: 'e-1',
      matricule: 'ENS001',
      nom: 'Doe',
      prenom: 'John',
      totalVolumeBrut: 200,
      totalChargeCalculee: 240,
      totalChargeReference: 360,
      totalDecharges: 0,
      totalServiceDu: 360,
      totalEcart: -120,
      totalHeuresSup: 0,
      alerteDepassement: false,
      calculPartiel: false,
      parDepartement: [
        {
          departementId: 'd-1',
          libelle: 'Mathématiques',
          volumeBrut: 100,
          chargeCalculee: 120,
          serviceDu: 180,
          ecart: -60,
          heuresSup: 0,
        },
      ],
    });

    const { result } = renderHook(() => useChargeGlobale('e-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.enseignantId).toBe('e-1');
    expect(result.current.data?.totalChargeCalculee).toBe(240);
    expect(mockFindChargeGlobale).toHaveBeenCalledWith('e-1');
  });

  it('should handle error', async () => {
    mockFindChargeGlobale.mockRejectedValue(new Error('Erreur API'));

    const { result } = renderHook(() => useChargeGlobale('e-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should not fetch when enseignantId is empty', async () => {
    const { result } = renderHook(() => useChargeGlobale(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockFindChargeGlobale).not.toHaveBeenCalled();
  });
});

describe('useAnnualCharges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return annual charges data', async () => {
    mockFindAnnualCharges.mockResolvedValue({
      data: [
        {
          enseignantId: 'e-1',
          matricule: 'ENS001',
          nom: 'Doe',
          prenom: 'John',
          departementId: 'd-1',
          departementLibelle: 'Mathématiques',
          s1: { chargeCalculee: 100, source: 'SNAPSHOT_VALIDE', calculPartiel: false },
          s2: { chargeCalculee: 120, source: 'SNAPSHOT_VALIDE', calculPartiel: false },
          total: {
            volumeBrut: 200,
            chargeCalculee: 220,
            chargeReference: 360,
            decharges: 0,
            serviceDu: 360,
            ecart: -140,
            heuresSup: 0,
            depassePlafond: false,
          },
          divergence: false,
          detail: [],
        },
      ],
      total: 1,
    });

    const { result } = renderHook(() => useAnnualCharges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.data[0].enseignantId).toBe('e-1');
    expect(mockFindAnnualCharges).toHaveBeenCalledWith(undefined);
  });

  it('should pass query params to API', async () => {
    mockFindAnnualCharges.mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(() => useAnnualCharges({ departementId: 'd-1' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFindAnnualCharges).toHaveBeenCalledWith({ departementId: 'd-1' });
  });
});