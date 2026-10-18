import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDecharges } from './use-decharges';
import * as api from '@/lib/api/decharges';

vi.mock('@/lib/api/decharges', () => ({
  findAllDecharges: vi.fn(),
}));

const mockFindAllDecharges = vi.mocked(api.findAllDecharges);

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

describe('useDecharges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return decharges data', async () => {
    mockFindAllDecharges.mockResolvedValue({
      data: [{ id: 'dc-1', heures: 10, enseignantId: 'e-1', semestreId: 's-1', createdAt: '', updatedAt: '' }],
      total: 1, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useDecharges({ enseignantId: 'e-1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].heures).toBe(10);
    expect(mockFindAllDecharges).toHaveBeenCalledWith({ enseignantId: 'e-1' });
  });
});
