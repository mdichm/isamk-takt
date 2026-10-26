import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExecuteTransition } from './use-version-transition';

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
    versionTransitionSucces: 'Transition effectuée avec succès.',
    versionTransitionInterdite: 'Action interdite.',
    versionNonSoumettable: 'Version non soumettable.',
    versionTransitionErreur: 'Erreur de transition.',
    validationInterdite: "Vous n'êtes pas autorisé à prendre cette décision.",
    confirmationSoumissionTitre: 'Confirmer la soumission',
    confirmationSoumissionAvertissements:
      'Avertissements non acceptés. Continuer ?',
    confirmationSoumissionPublication:
      'La version actuellement publiée sera archivée.',
    confirmationSoumissionBoutonConfirmer: 'Oui, soumettre',
    confirmationSoumissionBoutonAnnuler: 'Annuler',
  },
}));

import { apiFetch } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

/** Erreur simulée avec un code HTTP pour les tests du hook. */
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

describe('useExecuteTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appelle POST /versions/{id}/transitions avec le dto et invalide les requêtes liées', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          versionId: 'v-1',
          numero: '1.1',
          de: 'EDITION',
          vers: 'PRET_POUR_VALIDATION',
          action: 'MARQUER_PRET',
          revision: 1,
          cycleValidation: 1,
          at: '2026-01-01T00:00:00Z',
        }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(
      () => useExecuteTransition('v-1'),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ action: 'MARQUER_PRET' });
    });

    expect(apiFetch).toHaveBeenCalledWith('/versions/v-1/transitions', {
      method: 'POST',
      body: JSON.stringify({ action: 'MARQUER_PRET' }),
    });
    expect(toast.success).toHaveBeenCalledWith(messages.versionTransitionSucces);
  });

  it('affiche une erreur interdite en cas de 409', async () => {
    const err = new Error('INVALID_STATE_TRANSITION') as ErreurApiSimulee;
    err.status = 409;
    vi.mocked(apiFetch).mockRejectedValue(err);

    const { result } = renderHook(() => useExecuteTransition('v-1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ action: 'SOUMETTRE' });
    });

    expect(toast.error).toHaveBeenCalledWith(messages.versionTransitionInterdite);
  });

  it('affiche une erreur non soumettable en cas de 422', async () => {
    const err = new Error('VERSION_NOT_SUBMITTABLE') as ErreurApiSimulee;
    err.status = 422;
    vi.mocked(apiFetch).mockRejectedValue(err);

    const { result } = renderHook(() => useExecuteTransition('v-1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ action: 'SOUMETTRE' });
    });

    expect(toast.error).toHaveBeenCalledWith(messages.versionNonSoumettable);
  });

  it('affiche un message dédié en cas de 422 CONFIRMATION_PUBLICATION_REQUISE (L5-19)', async () => {
    const err = new Error('Confirmation requise') as ErreurApiSimulee;
    err.status = 422;
    err.code = 'CONFIRMATION_PUBLICATION_REQUISE';
    vi.mocked(apiFetch).mockRejectedValue(err);

    const { result } = renderHook(() => useExecuteTransition('v-1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ action: 'SOUMETTRE' });
    });

    expect(toast.error).toHaveBeenCalledWith(
      messages.confirmationSoumissionPublication,
    );
  });

  it('affiche une erreur interdite en cas de 403', async () => {
    const err = new Error('FORBIDDEN') as ErreurApiSimulee;
    err.status = 403;
    vi.mocked(apiFetch).mockRejectedValue(err);

    const { result } = renderHook(() => useExecuteTransition('v-1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ action: 'ABANDONNER' });
    });

    expect(toast.error).toHaveBeenCalledWith(messages.validationInterdite);
  });

  it('utilise getErrorMessage pour une erreur inconnue', async () => {
    const err = new Error('Boom');
    vi.mocked(apiFetch).mockRejectedValue(err);
    vi.mocked(getErrorMessage).mockReturnValue('Message personnalisé');

    const { result } = renderHook(() => useExecuteTransition('v-1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ action: 'DEMARRER_EDITION' });
    });

    expect(toast.error).toHaveBeenCalledWith('Message personnalisé');
  });
});
