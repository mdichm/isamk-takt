import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEnseignants } from './use-enseignants';
import * as api from '@/lib/api/enseignants';

vi.mock('@/lib/api/enseignants', () => ({
  findAllEnseignants: vi.fn(),
}));

const mockFindAllEnseignants = vi.mocked(api.findAllEnseignants);

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

describe('useEnseignants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return enseignants data', async () => {
    mockFindAllEnseignants.mockResolvedValue({
      data: [{ id: 'e-1', matricule: 'ENS-001', nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com', telephone: null, isActive: true, anneeId: 'a-1', departementId: 'd-1', gradeId: null, moduleIds: [], createdAt: '', updatedAt: '' }],
      total: 1, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useEnseignants({ page: 1, limit: 10 }), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].matricule).toBe('ENS-001');
    expect(mockFindAllEnseignants).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('should handle error', async () => {
    mockFindAllEnseignants.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useEnseignants(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
