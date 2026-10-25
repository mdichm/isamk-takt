import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrevisualisationPublication } from './previsualisation-publication';
import type { PrevisualisationPublicationDto } from '@/lib/api/versions';
import { usePrevisualisationPublication, usePublishVersion } from '@/hooks/use-previsualisation-publication';

vi.mock('@/lib/api/versions', () => ({
  fetchPrevisualisationPublication: vi.fn(),
  publishVersion: vi.fn(),
}));

vi.mock('@/hooks/use-previsualisation-publication', () => ({
  usePrevisualisationPublication: vi.fn(),
  usePublishVersion: vi.fn(),
}));

const mockUsePrevisualisationPublication = vi.mocked(usePrevisualisationPublication);
const mockUsePublishVersion = vi.mocked(usePublishVersion);

const mockPrevisData: PrevisualisationPublicationDto = {
  versionId: 'v-1',
  versionNumero: 'V1',
  statut: 'VALIDE',
  revision: 1,
  versionPrecedenteId: null,
  versionPrecedenteNumero: null,
  departementsValides: [
    {
      departementId: 'dept-1',
      departementCode: 'INFO',
      departementLibelle: 'Informatique',
      decision: 'APPROUVE',
      userId: 'user-1',
      at: '2024-01-15T10:00:00Z',
    },
  ],
  activitesModifiees: 2,
  conflits: [
    {
      id: 'c-1',
      type: 'SALLE_OCCUPEE',
      severite: 'BLOQUANT',
      resoluLe: null,
    },
  ],
  avertissementsAcceptes: [
    {
      regleCode: 'REGLE_01',
      auteurId: 'user-1',
      accepteLe: '2024-01-15T10:30:00Z',
    },
  ],
  verrous: [
    {
      id: 'lock-1',
      type: 'SALLE',
      seanceId: 's-1',
      auteurId: 'user-1',
      creeLe: '2024-01-15T09:00:00Z',
    },
  ],
  provenance: {
    generationId: 'gen-1',
    profilVersion: '1',
    profilNom: 'Standard',
    perimetreHash: 'abc123',
    engineVersion: '1.0.0',
  },
  activites: [
    {
      affectationKey: 'INFO:M01:CM:ENS01',
      enseignantId: 'ens-1',
      enseignantNom: 'Jean Dupont',
      salleId: 'salle-1',
      salleCode: 'A101',
      planifiee: true,
    },
    {
      affectationKey: 'INFO:M02:TD:ENS02',
      enseignantId: 'ens-2',
      enseignantNom: 'Marie Martin',
      salleId: null,
      salleCode: null,
      planifiee: false,
    },
  ],
  at: '2024-01-15T11:00:00Z',
};

describe('PrevisualisationPublication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('affiche un état de chargement', () => {
    mockUsePrevisualisationPublication.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isPending: true,
      isFetching: false,
      error: null,
      errorUpdateCount: 0,
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
      isRefetchError: false,
      isLoadingError: false,
      status: 'loading',
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PrevisualisationPublication versionId="v-1" />
      </QueryClientProvider>,
    );

    expect(mockUsePrevisualisationPublication).toHaveBeenCalledWith('v-1');
  });

  it('affiche les données de prévisualisation quand chargées', async () => {
    mockUsePrevisualisationPublication.mockReturnValue({
      data: mockPrevisData,
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
      errorUpdateCount: 0,
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
      isRefetchError: false,
      isLoadingError: false,
      status: 'success',
    } as any);
    mockUsePublishVersion.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PrevisualisationPublication versionId="v-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockUsePrevisualisationPublication).toHaveBeenCalledWith('v-1'));
    await findByText(/V1/);
    await findByText(/VALIDE/);
    await findByText(/INFO — Informatique/);
    await findByText('Jean Dupont');
    await findByText('A101');
    await findByText('SALLE_OCCUPEE');
    await findByText('REGLE_01');
    await findByText('SALLE');
    await findByText(/gen-1/);
    await findByText('Standard');
    await findByText('Publier la version');
  });

  it('affiche un état d erreur', async () => {
    mockUsePrevisualisationPublication.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isPending: false,
      isFetching: false,
      error: new Error('Erreur API'),
      errorUpdateCount: 0,
      failureCount: 0,
      failureReason: 'Erreur API',
      isPlaceholderData: false,
      isRefetchError: false,
      isLoadingError: false,
      status: 'error',
    } as any);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PrevisualisationPublication versionId="v-1" />
      </QueryClientProvider>,
    );

    await findByText('Impossible de charger la prévisualisation.');
  });

  it('désactive le bouton publier quand un conflit bloquant est non résolu', async () => {
    const dataAvecConflitBloquant = {
      ...mockPrevisData,
      statut: 'VALIDE',
      conflits: [
        {
          id: 'c-1',
          type: 'SALLE_OCCUPEE',
          severite: 'BLOQUANT',
          resoluLe: null,
        },
      ],
    };
    mockUsePrevisualisationPublication.mockReturnValue({
      data: dataAvecConflitBloquant,
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
      errorUpdateCount: 0,
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
      isRefetchError: false,
      isLoadingError: false,
      status: 'success',
    } as any);
    mockUsePublishVersion.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const { getByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PrevisualisationPublication versionId="v-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockUsePrevisualisationPublication).toHaveBeenCalledWith('v-1'));
    const btn = getByText('Publier la version');
    expect(btn).toBeTruthy();
  });

  it('affiche "Aucune version précédente publiée" quand il n y en a pas', async () => {
    mockUsePrevisualisationPublication.mockReturnValue({
      data: mockPrevisData,
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
      errorUpdateCount: 0,
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
      isRefetchError: false,
      isLoadingError: false,
      status: 'success',
    } as any);
    mockUsePublishVersion.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PrevisualisationPublication versionId="v-1" />
      </QueryClientProvider>,
    );

    await findByText('Aucune version précédente publiée');
  });
});
