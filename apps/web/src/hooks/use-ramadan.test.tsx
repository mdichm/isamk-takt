import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreneauxAffichage,
  useCreateCreneauAffichage,
  useUpdateCreneauAffichage,
  useDeleteCreneauAffichage,
  useDuplicateCreneauxAffichage,
} from './use-ramadan';
import * as api from '@/lib/api/ramadan';
import type { CreneauAffichage } from '@/lib/api/ramadan';

vi.mock('@/lib/api/ramadan', () => ({
  findAllCreneauxAffichage: vi.fn(),
  findCreneauAffichageById: vi.fn(),
  createCreneauAffichage: vi.fn(),
  updateCreneauAffichage: vi.fn(),
  deleteCreneauAffichage: vi.fn(),
  duplicateCreneauxAffichage: vi.fn(),
}));

const mockFindAllCreneauxAffichage = vi.mocked(api.findAllCreneauxAffichage);
const mockFindCreneauAffichageById = vi.mocked(api.findCreneauAffichageById);
const mockCreateCreneauAffichage = vi.mocked(api.createCreneauAffichage);
const mockUpdateCreneauAffichage = vi.mocked(api.updateCreneauAffichage);
const mockDeleteCreneauAffichage = vi.mocked(api.deleteCreneauAffichage);
const mockDuplicateCreneauxAffichage = vi.mocked(api.duplicateCreneauxAffichage);

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

describe('useCreneauxAffichage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return affichage data', async () => {
    mockFindAllCreneauxAffichage.mockResolvedValue({
      data: [{
        id: 'a-1', creneauId: 'c-1', grille: 'RAMADAN',
        heureDebut: '07:30:00', heureFin: '09:00:00',
        createdAt: '', updatedAt: '',
      }],
      total: 1, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useCreneauxAffichage({ semestreId: 's-1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].grille).toBe('RAMADAN');
    expect(mockFindAllCreneauxAffichage).toHaveBeenCalledWith({ semestreId: 's-1' });
  });

  it('should return empty data when no affichages', async () => {
    mockFindAllCreneauxAffichage.mockResolvedValue({
      data: [], total: 0, page: 1, limit: 10, totalPages: 0,
    });

    const { result } = renderHook(() => useCreneauxAffichage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(0);
  });
});

describe('useCreateCreneauAffichage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an affichage successfully', async () => {
    const created: CreneauAffichage = { id: 'a-1', creneauId: 'c-1', grille: 'RAMADAN', heureDebut: '07:30:00', heureFin: '09:00:00', createdAt: '', updatedAt: '' };
    mockCreateCreneauAffichage.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateCreneauAffichage(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({
      creneauId: 'c-1', heureDebut: '07:30:00', heureFin: '09:00:00',
    });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateCreneauAffichage).toHaveBeenCalledTimes(1);
    expect(mockCreateCreneauAffichage.mock.calls[0][0]).toMatchObject({
      creneauId: 'c-1', heureDebut: '07:30:00', heureFin: '09:00:00',
    });
  });

  it('should handle create error', async () => {
    mockCreateCreneauAffichage.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useCreateCreneauAffichage(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      creneauId: 'c-1', heureDebut: '07:30:00', heureFin: '09:00:00',
    }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateCreneauAffichage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update an affichage successfully', async () => {
    const updated: CreneauAffichage = { id: 'a-1', creneauId: 'c-1', grille: 'RAMADAN', heureDebut: '08:00:00', heureFin: '09:30:00', createdAt: '', updatedAt: '' };
    mockUpdateCreneauAffichage.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateCreneauAffichage(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({
      id: 'a-1', input: { heureDebut: '08:00:00', heureFin: '09:30:00' },
    });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateCreneauAffichage).toHaveBeenCalledTimes(1);
    expect(mockUpdateCreneauAffichage.mock.calls[0][0]).toBe('a-1');
    expect(mockUpdateCreneauAffichage.mock.calls[0][1]).toMatchObject({
      heureDebut: '08:00:00', heureFin: '09:30:00',
    });
  });

  it('should handle update error', async () => {
    mockUpdateCreneauAffichage.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateCreneauAffichage(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'a-1', input: {} }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteCreneauAffichage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete an affichage successfully', async () => {
    mockDeleteCreneauAffichage.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCreneauAffichage(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync('a-1');
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteCreneauAffichage).toHaveBeenCalledTimes(1);
    expect(mockDeleteCreneauAffichage.mock.calls[0][0]).toBe('a-1');
  });

  it('should handle delete error', async () => {
    mockDeleteCreneauAffichage.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteCreneauAffichage(), { wrapper: createWrapper() });

    await result.current.mutateAsync('a-1').catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDuplicateCreneauxAffichage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should duplicate affichages successfully', async () => {
    mockDuplicateCreneauxAffichage.mockResolvedValue({
      created: 5, creneauAffichageIds: ['a-1', 'a-2', 'a-3', 'a-4', 'a-5'],
    });

    const { result } = renderHook(() => useDuplicateCreneauxAffichage(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ sourceSemestreId: 's-1', cibleSemestreId: 's-2' });
    await promise;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDuplicateCreneauxAffichage).toHaveBeenCalledTimes(1);
    expect(mockDuplicateCreneauxAffichage.mock.calls[0][0]).toMatchObject({
      sourceSemestreId: 's-1', cibleSemestreId: 's-2',
    });
  });

  it('should handle duplicate error', async () => {
    mockDuplicateCreneauxAffichage.mockRejectedValue(new Error('Duplicate failed'));

    const { result } = renderHook(() => useDuplicateCreneauxAffichage(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ sourceSemestreId: 's-1', cibleSemestreId: 's-2' }).catch(() => {});

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
