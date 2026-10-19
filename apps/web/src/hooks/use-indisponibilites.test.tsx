import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIndisponibilites, useCreateIndisponibilite, useUpdateIndisponibilite, useDeleteIndisponibilite } from './use-indisponibilites';
import * as api from '@/lib/api/indisponibilites';

vi.mock('@/lib/api/indisponibilites', () => ({
  findAllIndisponibilites: vi.fn(),
  createIndisponibilite: vi.fn(),
  updateIndisponibilite: vi.fn(),
  deleteIndisponibilite: vi.fn(),
}));

const mockFindAllIndisponibilites = vi.mocked(api.findAllIndisponibilites);
const mockCreateIndisponibilite = vi.mocked(api.createIndisponibilite);
const mockUpdateIndisponibilite = vi.mocked(api.updateIndisponibilite);
const mockDeleteIndisponibilite = vi.mocked(api.deleteIndisponibilite);

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

describe('useIndisponibilites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return indisponibilites data', async () => {
    mockFindAllIndisponibilites.mockResolvedValue({
      data: [{ id: 'i-1', semestreId: 's-1', jour: 'LUNDI', ordre: 1, enseignantId: 'e-1', salleId: undefined, estActive: true, createdAt: '', updatedAt: '' }],
      total: 1, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useIndisponibilites({ semestreId: 's-1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].jour).toBe('LUNDI');
    expect(mockFindAllIndisponibilites).toHaveBeenCalledWith({ semestreId: 's-1' });
  });

  it('should return empty data when no indisponibilites', async () => {
    mockFindAllIndisponibilites.mockResolvedValue({
      data: [], total: 0, page: 1, limit: 10, totalPages: 0,
    });

    const { result } = renderHook(() => useIndisponibilites(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it('should pass pagination params to API', async () => {
    mockFindAllIndisponibilites.mockResolvedValue({
      data: [], total: 0, page: 2, limit: 20, totalPages: 0,
    });

    const { result } = renderHook(() => useIndisponibilites({ page: 2, limit: 20 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFindAllIndisponibilites).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });

  it('should handle error', async () => {
    mockFindAllIndisponibilites.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useIndisponibilites(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
describe('useCreateIndisponibilite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an indisponibilite successfully', async () => {
    const created = { id: 'i-new', semestreId: 's-1', jour: 'LUNDI', ordre: 1, enseignantId: 'e-1', salleId: undefined, estActive: true, createdAt: '', updatedAt: '' };
    mockCreateIndisponibilite.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateIndisponibilite(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1, enseignantId: 'e-1',
    });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateIndisponibilite).toHaveBeenCalledTimes(1);
    expect(mockCreateIndisponibilite.mock.calls[0][0]).toMatchObject({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1, enseignantId: 'e-1',
    });
  });

  it('should handle create error', async () => {
    mockCreateIndisponibilite.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useCreateIndisponibilite(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1, enseignantId: 'e-1',
    }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
describe('useUpdateIndisponibilite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update an indisponibilite successfully', async () => {
    const updated = { id: 'i-1', semestreId: 's-1', jour: 'MARDI', ordre: 2, enseignantId: undefined, salleId: 'salle-1', estActive: true, createdAt: '', updatedAt: '' };
    mockUpdateIndisponibilite.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateIndisponibilite(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ id: 'i-1', input: { jour: 'MARDI', ordre: 2, salleId: 'salle-1' } });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateIndisponibilite).toHaveBeenCalledTimes(1);
    expect(mockUpdateIndisponibilite.mock.calls[0][0]).toBe('i-1');
    expect(mockUpdateIndisponibilite.mock.calls[0][1]).toMatchObject({
      jour: 'MARDI', ordre: 2, salleId: 'salle-1',
    });
  });

  it('should handle update error', async () => {
    mockUpdateIndisponibilite.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateIndisponibilite(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'i-1', input: {} }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteIndisponibilite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete an indisponibilite successfully', async () => {
    mockDeleteIndisponibilite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteIndisponibilite(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync('i-1');
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDeleteIndisponibilite).toHaveBeenCalledTimes(1);
    expect(mockDeleteIndisponibilite.mock.calls[0][0]).toBe('i-1');
  });

  it('should handle delete error', async () => {
    mockDeleteIndisponibilite.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteIndisponibilite(), { wrapper: createWrapper() });

    await result.current.mutateAsync('i-1').catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
});