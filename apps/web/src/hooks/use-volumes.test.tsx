import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useModuleVolumes } from './use-volumes';
import * as api from '@/lib/api/volumes';

vi.mock('@/lib/api/volumes', () => ({
  findModuleVolumes: vi.fn(),
}));

const mockFindModuleVolumes = vi.mocked(api.findModuleVolumes);

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

describe('useModuleVolumes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return module volumes data', async () => {
    mockFindModuleVolumes.mockResolvedValue({
      data: [
        { id: 'v-1', moduleId: 'm-1', type: 'CM', volume: 90, createdAt: '', updatedAt: '' },
        { id: 'v-2', moduleId: 'm-1', type: 'TD', volume: 60, createdAt: '', updatedAt: '' },
      ],
      total: 2, page: 1, limit: 10, totalPages: 1,
    });

    const { result } = renderHook(() => useModuleVolumes('m-1', { page: 1, limit: 100 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].type).toBe('CM');
    expect(result.current.data?.data[0].volume).toBe(90);
    expect(mockFindModuleVolumes).toHaveBeenCalledWith('m-1', { page: 1, limit: 100 });
  });

  it('should be disabled when no moduleId', async () => {
    const { result } = renderHook(() => useModuleVolumes(''), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.data).toBeUndefined();
    expect(mockFindModuleVolumes).not.toHaveBeenCalled();
  });
});
