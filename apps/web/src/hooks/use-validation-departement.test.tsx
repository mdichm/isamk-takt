import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserDepartment,
  useImpact,
  useSubmitValidation,
} from './use-validation-departement';
import * as api from '@/lib/api/versions';
import * as usersApi from '@/lib/api/users';
import { toast } from 'sonner';

vi.mock('@/lib/api/versions', () => ({
  fetchImpact: vi.fn(),
  submitValidation: vi.fn(),
}));

vi.mock('@/lib/api/users', () => ({
  fetchMe: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockFetchImpact = vi.mocked(api.fetchImpact);
const mockSubmitValidation = vi.mocked(api.submitValidation);
const mockFetchMe = vi.mocked(usersApi.fetchMe);

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

describe('useUserDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return user department data', async () => {
    mockFetchMe.mockResolvedValue({
      id: 'u-1',
      role: 'RESPONSABLE_DEPARTEMENT',
      departments: ['dept-1'],
    });

    const { result } = renderHook(() => useUserDepartment(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.role).toBe('RESPONSABLE_DEPARTEMENT');
    expect(result.current.data?.departments).toEqual(['dept-1']);
    expect(mockFetchMe).toHaveBeenCalled();
  });
});

describe('useImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return impact data for a version', async () => {
    mockFetchImpact.mockResolvedValue({
      versionId: 'v-1',
      versionNumero: 'V1',
      departements: [
        {
          departementId: 'dept-1',
          departementCode: 'INFO',
          departementLibelle: 'Informatique',
          statut: 'IMPACTE',
          raison: 'Séances modifiées',
          reportee: false,
        },
      ],
      resume: { impactes: 1, nonImpactes: 0, reportees: 0 },
    });

    const { result } = renderHook(() => useImpact('v-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.departements).toHaveLength(1);
    expect(mockFetchImpact).toHaveBeenCalledWith('v-1');
  });

  it('should be disabled when no versionId', async () => {
    const { result } = renderHook(() => useImpact(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockFetchImpact).not.toHaveBeenCalled();
  });
});

describe('useSubmitValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should submit a validation decision successfully', async () => {
    mockSubmitValidation.mockResolvedValue({
      versionId: 'v-1',
      versionNumero: 'V1',
      departementId: 'dept-1',
      decision: 'APPROUVE',
      parAdministrateur: false,
      unanimiteAtteinte: false,
    });

    const { result } = renderHook(() => useSubmitValidation('v-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        departementId: 'dept-1',
        decision: 'APPROUVE',
      });
    });

    expect(mockSubmitValidation).toHaveBeenCalledWith('v-1', {
      departementId: 'dept-1',
      decision: 'APPROUVE',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show error toast on validation failure', async () => {
    const error = new Error('Déjà décidé');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock error with status
    (error as any).status = 409;
    mockSubmitValidation.mockRejectedValue(error);

    const { result } = renderHook(() => useSubmitValidation('v-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        departementId: 'dept-1',
        decision: 'APPROUVE',
      }).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalled();
  });

  it('should require motif for rejection (422)', async () => {
    const error = new Error('Motif requis');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock error with status
    (error as any).status = 422;
    mockSubmitValidation.mockRejectedValue(error);

    const { result } = renderHook(() => useSubmitValidation('v-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        departementId: 'dept-1',
        decision: 'REJETE',
      }).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('motif'),
    );
  });
});
