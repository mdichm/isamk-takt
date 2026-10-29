import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnneeClotureDialog } from './annee-cloture-dialog';

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
    clotureTitre: 'Clôture de l’année {code}',
    clotureDescription: 'Une fois clôturée, l’année devient lecture seule.',
    clotureLabelCode: 'Code de l’année',
    cloturePlaceholderCode: 'Saisissez le code de l’année (ex: 2026-2027)',
    clotureBoutonConfirmer: 'Clôturer l’année',
    clotureBoutonAnnuler: 'Annuler',
    clotureSucces: "L'année a été clôturée avec succès.",
    clotureErreurConfirmation: "Le code saisi ne correspond pas au code de l'année.",
    clotureErreurVersionEnValidation: 'Version en validation.',
    clotureErreurConflit: "L'année ne peut pas être clôturée dans son état actuel.",
    clotureErreurGenerique: 'Erreur inattendue.',
  },
}));

import { apiFetch } from '@/lib/api/client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const anneeActive = { id: 'a-1', numero: 2026, code: '2026-2027', nbSemaines: 40, statut: 'ACTIVE' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
const anneeCloturee = { ...anneeActive, statut: 'CLOTUREE' as const };

describe('AnneeClotureDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le bouton de déclenchement pour une année active et le désactive pour une année clôturée', () => {
    const declencheurActive = () => {
      const tous = screen.getAllByTestId('cloture-declencheur');
      return tous[tous.length - 1]; // le bouton interne (le plus imbriqué) porte le disabled réel
    };

    render(<AnneeClotureDialog annee={anneeActive} open={false} onOpenChange={() => {}} />, { wrapper });
    expect(declencheurActive()).not.toBeDisabled();

    render(<AnneeClotureDialog annee={anneeCloturee} open={false} onOpenChange={() => {}} />, { wrapper });
    expect(declencheurActive()).toBeDisabled();
  });

  it('désactive le bouton Confirmer tant que le code saisi ne correspond pas', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ anneeId: 'a-1', de: '2025', vers: '2026', versionsArchivees: 2 })),
    );

    render(<AnneeClotureDialog annee={anneeActive} open={true} onOpenChange={() => {}} />, { wrapper });

    const input = screen.getByLabelText('Code de l’année');
    fireEvent.change(input, { target: { value: 'mauvais-code' } });

    const confirmer = screen.getAllByTestId('cloture-confirmer')[0];
    expect(confirmer).toBeDisabled();
  });

  it('active le bouton Confirmer quand le code correspond et appelle l’API', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ anneeId: 'a-1', de: '2025', vers: '2026', versionsArchivees: 2 })),
    );

    render(<AnneeClotureDialog annee={anneeActive} open={true} onOpenChange={() => {}} />, { wrapper });

    const input = screen.getByLabelText('Code de l’année');
    fireEvent.change(input, { target: { value: '2026-2027' } });

    const confirmer = screen.getAllByTestId('cloture-confirmer')[0];
    expect(confirmer).not.toBeDisabled();

    fireEvent.click(confirmer);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:3000/annees/a-1/transitions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'CLOTURER', confirmation: '2026-2027', motif: undefined }),
        }),
      );
    });
  });
});
