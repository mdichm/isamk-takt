import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransitionAnnee } from './use-annee-transition';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));
vi.mock('@/lib/api/errors', () => ({
  getErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : 'Erreur inattendue',
  ),
  getErrorCode: vi.fn((error: unknown) =>
    error instanceof Error ? (error as { code?: string }).code : undefined,
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/messages/fr', () => ({
  messages: {
    statutPreparation: 'En préparation',
    statutActive: 'Active',
    statutCloturee: 'Clôturée',
    clotureSucces: "L'année a été clôturée avec succès.",
    clotureErreurConfirmation: "Le code saisi ne correspond pas au code de l'année.",
    clotureErreurVersionEnValidation:
      'Impossible de clôturer : une version est actuellement en validation.',
    clotureErreurConflit: "L'année ne peut pas être clôturée dans son état actuel.",
    clotureErreurGenerique: 'Une erreur inattendue est survenue lors de la clôture.',
  },
}));

import { apiFetch } from '@/lib/api/client';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

interface ErreurApiSimulee extends Error {
  status: number;
  code?: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockApiError(status: number, code?: string, message?: string) {
  const err = new Error(message || 'Erreur') as ErreurApiSimulee;
  err.status = status;
  err.code = code;
  return err;
}

describe('useTransitionAnnee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appelle POST /annees/{id}/transitions avec le DTO CLOTURER et invalide les requêtes', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      mockResponse({ anneeId: 'a-1', de: '2025', vers: '2026', versionsArchivees: 3 }),
    );

    const { result } = renderHook(() => useTransitionAnnee('a-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ confirmation: '2025-2026', motif: 'Fin d’année' });
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith(
      'http://localhost:3000/annees/a-1/transitions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'CLOTURER',
          confirmation: '2025-2026',
          motif: 'Fin d’année',
        }),
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(messages.clotureSucces);
  });

  it('affiche l’erreur de confirmation en cas de 422 CONFIRMATION_MISMATCH', async () => {
    vi.mocked(apiFetch).mockRejectedValue(mockApiError(422, 'CONFIRMATION_MISMATCH'));

    const { result } = renderHook(() => useTransitionAnnee('a-1'), { wrapper });

    await expect(
      result.current.mutateAsync({ confirmation: 'mauvais-code' }),
    ).rejects.toBeDefined();

    expect(toast.error).toHaveBeenCalledWith(messages.clotureErreurConfirmation);
  });

  it('affiche l’erreur de conflit en cas de 409', async () => {
    vi.mocked(apiFetch).mockRejectedValue(mockApiError(409));

    const { result } = renderHook(() => useTransitionAnnee('a-1'), { wrapper });

    await expect(result.current.mutateAsync({ confirmation: '2025-2026' })).rejects.toBeDefined();

    expect(toast.error).toHaveBeenCalledWith(messages.clotureErreurConflit);
  });

  it('affiche l’erreur générique en cas de 404', async () => {
    vi.mocked(apiFetch).mockRejectedValue(mockApiError(404));

    const { result } = renderHook(() => useTransitionAnnee('a-1'), { wrapper });

    await expect(result.current.mutateAsync({ confirmation: '2025-2026' })).rejects.toBeDefined();

    expect(toast.error).toHaveBeenCalledWith(messages.clotureErreurGenerique);
  });
});
