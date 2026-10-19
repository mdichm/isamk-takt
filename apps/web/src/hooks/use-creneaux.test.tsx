import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreneaux, useCreateCreneau, useUpdateCreneau, useDeleteCreneau, useDuplicateCreneaux } from './use-creneaux';
import * as api from '@/lib/api/creneaux';

vi.mock('@/lib/api/creneaux', () => ({
  findAllCreneaux: vi.fn(),
  createCreneau: vi.fn(),
  updateCreneau: vi.fn(),
  deleteCreneau: vi.fn(),
  duplicateCreneaux: vi.fn(),
}));

const mockFindAllCreneaux = vi.mocked(api.findAllCreneaux);
const mockCreateCreneau = vi.mocked(api.createCreneau);
const mockUpdateCreneau = vi.mocked(api.updateCreneau);
const mockDeleteCreneau = vi.mocked(api.deleteCreneau);
const mockDuplicateCreneaux = vi.mocked(api.duplicateCreneaux);

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

describe('useCreneaux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return creneaux data', async () => {
    mockFindAllCreneaux.mockResolvedValue({
      data: [{ id: 'c-1', semestreId: 's-1', jour: 'LUNDI', ordre: 1, heureDebut: '08:00:00', heureFin: '08:30:00', estPause: false, estActive: true, createdAt: '', updatedAt: '' }],
      total: 1, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useCreneaux({ semestreId: 's-1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].jour).toBe('LUNDI');
    expect(mockFindAllCreneaux).toHaveBeenCalledWith({ semestreId: 's-1' });
  });

  it('should return empty data when no creneaux', async () => {
    mockFindAllCreneaux.mockResolvedValue({
      data: [], total: 0, page: 1, limit: 10, totalPages: 0,
    });

    const { result } = renderHook(() => useCreneaux(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it('should pass pagination params to API', async () => {
    mockFindAllCreneaux.mockResolvedValue({
      data: [], total: 0, page: 2, limit: 20, totalPages: 0,
    });

    const { result } = renderHook(() => useCreneaux({ page: 2, limit: 20 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFindAllCreneaux).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });

  it('should handle error', async () => {
    mockFindAllCreneaux.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useCreneaux(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
describe('useCreateCreneau', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a creneau successfully', async () => {
    const created = { id: 'c-new', semestreId: 's-1', jour: 'LUNDI', ordre: 1, heureDebut: '08:00:00', heureFin: '08:30:00', estPause: false, estActive: true, createdAt: '', updatedAt: '' };
    mockCreateCreneau.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateCreneau(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1,
      heureDebut: '08:00:00', heureFin: '08:30:00', estPause: false,
    });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateCreneau).toHaveBeenCalledTimes(1);
    expect(mockCreateCreneau.mock.calls[0][0]).toMatchObject({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1,
      heureDebut: '08:00:00', heureFin: '08:30:00', estPause: false,
    });
  });

  it('should handle create error', async () => {
    mockCreateCreneau.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useCreateCreneau(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      semestreId: 's-1', jour: 'LUNDI', ordre: 1,
      heureDebut: '08:00:00', heureFin: '08:30:00', estPause: false,
    }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
describe('useUpdateCreneau', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update a creneau successfully', async () => {
    const updated = { id: 'c-1', semestreId: 's-1', jour: 'MARDI', ordre: 2, heureDebut: '09:00:00', heureFin: '09:30:00', estPause: false, estActive: true, createdAt: '', updatedAt: '' };
    mockUpdateCreneau.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateCreneau(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ id: 'c-1', input: { ordre: 2, heureDebut: '09:00:00', heureFin: '09:30:00' } });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateCreneau).toHaveBeenCalledTimes(1);
    expect(mockUpdateCreneau.mock.calls[0][0]).toBe('c-1');
    expect(mockUpdateCreneau.mock.calls[0][1]).toMatchObject({
      ordre: 2, heureDebut: '09:00:00', heureFin: '09:30:00',
    });
  });

  it('should handle update error', async () => {
    mockUpdateCreneau.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateCreneau(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'c-1', input: {} }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteCreneau', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete a creneau successfully', async () => {
    mockDeleteCreneau.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCreneau(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync('c-1');
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDeleteCreneau).toHaveBeenCalledTimes(1);
    expect(mockDeleteCreneau.mock.calls[0][0]).toBe('c-1');
  });

  it('should handle delete error', async () => {
    mockDeleteCreneau.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteCreneau(), { wrapper: createWrapper() });

    await result.current.mutateAsync('c-1').catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDuplicateCreneaux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should duplicate creneaux successfully', async () => {
    mockDuplicateCreneaux.mockResolvedValue({ created: 5, creneauIds: ['c-1', 'c-2', 'c-3', 'c-4', 'c-5'] });

    const { result } = renderHook(() => useDuplicateCreneaux(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ sourceSemestreId: 's-1', cibleSemestreId: 's-2' });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDuplicateCreneaux).toHaveBeenCalledTimes(1);
    expect(mockDuplicateCreneaux.mock.calls[0][0]).toMatchObject({
      sourceSemestreId: 's-1', cibleSemestreId: 's-2',
    });
  });

  it('should handle duplicate error', async () => {
    mockDuplicateCreneaux.mockRejectedValue(new Error('Duplicate failed'));

    const { result } = renderHook(() => useDuplicateCreneaux(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ sourceSemestreId: 's-1', cibleSemestreId: 's-2' }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});