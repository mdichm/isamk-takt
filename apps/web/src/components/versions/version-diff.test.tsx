import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VersionDiff } from './version-diff';
import type { VersionDiffDto } from '@/lib/api/versions';
import { useVersionDiff } from '@/hooks/use-version-diff';

vi.mock('@/lib/api/versions', () => ({
  fetchVersionDiff: vi.fn(),
}));

vi.mock('@/hooks/use-version-diff', () => ({
  useVersionDiff: vi.fn(),
}));

const mockUseVersionDiff = vi.mocked(useVersionDiff);

const mockDiffData: VersionDiffDto = {
  versionId: 'v-1',
  versionNumero: '1.1',
  againstId: 'v-2',
  againstNumero: '1.0',
  seancesIdentiques: 2,
  seancesDifferentes: 2,
  changements: [
    {
      cle: 'INFO:M01:CM:ENS01#2',
      type: 'DEPLACE',
      gauche: {
        jour: 'LUNDI',
        creneauDebutId: 'creneau-1',
        salleId: 'salle-1',
        enseignantId: 'ens-1',
        statut: 'PLACEE',
      },
      droite: {
        jour: 'MARDI',
        creneauDebutId: 'creneau-3',
        salleId: 'salle-1',
        enseignantId: 'ens-1',
        statut: 'PLACEE',
      },
    },
    {
      cle: 'INFO:M02:TD:ENS02#1',
      type: 'SALLE_MODIFIEE',
      gauche: {
        jour: 'LUNDI',
        creneauDebutId: 'creneau-2',
        salleId: 'salle-1',
        enseignantId: 'ens-2',
        statut: 'PLACEE',
      },
      droite: {
        jour: 'LUNDI',
        creneauDebutId: 'creneau-2',
        salleId: 'salle-99',
        enseignantId: 'ens-2',
        statut: 'PLACEE',
      },
    },
  ],
  seulesAGauche: ['INFO:M03:TD:ENS03#1'],
  seulesADroite: ['INFO:M04:TD:ENS04#1'],
  conflits: { apparus: 1, disparus: 1 },
  verrous: { respectesGauche: 2, respectesDroite: 1 },
};

describe('VersionDiff', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('affiche un état de chargement', () => {
    mockUseVersionDiff.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isPending: true,
      isFetching: false,
      error: null,
    } as never);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionDiff versionId="v-1" againstId="v-2" />
      </QueryClientProvider>,
    );
  });

  it('affiche les différences entre deux versions', async () => {
    mockUseVersionDiff.mockReturnValue({
      data: mockDiffData,
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
    } as never);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionDiff versionId="v-1" againstId="v-2" />
      </QueryClientProvider>,
    );

    await findByText('1.1 vs 1.0');
    await findByText('Séances identiques');
    await findByText('Séances différentes');
    await findByText('INFO:M03:TD:ENS03#1');
    await findByText('INFO:M04:TD:ENS04#1');
  });

  it('affiche "Aucune différence détectée" quand versions identiques', async () => {
    mockUseVersionDiff.mockReturnValue({
      data: {
        ...mockDiffData,
        seancesDifferentes: 0,
        changements: [],
        seulesAGauche: [],
        seulesADroite: [],
        conflits: { apparus: 0, disparus: 0 },
        verrous: { respectesGauche: 0, respectesDroite: 0 },
      },
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
    } as never);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionDiff versionId="v-1" againstId="v-2" />
      </QueryClientProvider>,
    );

    await findByText(/Aucune différence détectée/);
  });

  it('affiche un état d erreur', async () => {
    mockUseVersionDiff.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isPending: false,
      isFetching: false,
      error: new Error('Erreur API'),
    } as never);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionDiff versionId="v-1" againstId="v-2" />
      </QueryClientProvider>,
    );

    await findByText(/Erreur lors du chargement du diff/);
  });
});