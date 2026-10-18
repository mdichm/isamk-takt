import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useReorderDepartements,
  useReorderFormations,
  useReorderNiveaux,
  useReorderGroupes,
} from './use-structure';

// Mock the API module
vi.mock('@/lib/api/structure', () => ({
  reorderDepartements: vi.fn(),
  reorderFormations: vi.fn(),
  reorderNiveaux: vi.fn(),
  reorderGroupes: vi.fn(),
}));

import {
  reorderDepartements,
  reorderFormations,
  reorderNiveaux,
  reorderGroupes,
} from '@/lib/api/structure';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
// eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useReorderDepartements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call reorderDepartements on mutate', async () => {
    vi.mocked(reorderDepartements).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderDepartements(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        items: [{ id: 'dep-1', ordre: 1 }],
      });
    });

    expect(reorderDepartements).toHaveBeenCalledTimes(1);
    expect((reorderDepartements as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      items: [{ id: 'dep-1', ordre: 1 }],
    });
  });
});

describe('useReorderFormations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call reorderFormations on mutate', async () => {
    vi.mocked(reorderFormations).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderFormations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        items: [{ id: 'form-1', ordre: 1 }],
      });
    });

    expect(reorderFormations).toHaveBeenCalledTimes(1);
    expect((reorderFormations as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      items: [{ id: 'form-1', ordre: 1 }],
    });
  });
});

describe('useReorderNiveaux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call reorderNiveaux on mutate', async () => {
    vi.mocked(reorderNiveaux).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderNiveaux(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        items: [{ id: 'niv-1', ordre: 1 }],
      });
    });

    expect(reorderNiveaux).toHaveBeenCalledTimes(1);
    expect((reorderNiveaux as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      items: [{ id: 'niv-1', ordre: 1 }],
    });
  });
});

describe('useReorderGroupes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call reorderGroupes on mutate', async () => {
    vi.mocked(reorderGroupes).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderGroupes(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        items: [{ id: 'grp-1', ordre: 1 }],
      });
    });

    expect(reorderGroupes).toHaveBeenCalledTimes(1);
    expect((reorderGroupes as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      items: [{ id: 'grp-1', ordre: 1 }],
    });
  });
});