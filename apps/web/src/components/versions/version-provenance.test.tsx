import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VersionProvenance } from './version-provenance';
import type { VersionProvenanceDto } from '@/lib/api/versions';
import { useVersionProvenance } from '@/hooks/use-version-provenance';

vi.mock('@/hooks/use-version-provenance', () => ({
  useVersionProvenance: vi.fn(),
}));

const mockUseVersionProvenance = vi.mocked(useVersionProvenance);

const mockProvenance: VersionProvenanceDto = {
  versionId: 'v-1',
  versionNumero: '1.1',
  statut: 'PUBLIE',
  origine: 'GENERATION',
  generation: {
    id: 'gen-1',
    statut: 'TERMINEE',
    mode: 'AUTOMATIQUE',
    engine: 'fet',
    engineVersion: '7.12.0',
    perimetreHash: 'hash-perimetre',
    creeLe: '2024-01-15T10:00:00Z',
    profil: {
      id: 'profile-1',
      code: 'PROF-INFO',
      numero: 3,
      libelle: 'Profil INFO',
      engineVersion: '7.12.0',
      builderVersion: '1.0.0',
    },
  },
  snapshots: [
    {
      id: 'snapshot-1',
      repartitionId: 'rep-1',
      revision: 2,
      contentHash: 'hash-snap',
      parAdministrateur: true,
      validatedAt: '2024-01-16T12:00:00Z',
      chargeRuleSet: {
        id: 'crs-1',
        code: 'CRS-INFO',
        libelle: 'Règles de charge INFO',
        version: '1.0',
      },
    },
  ],
  chargeRuleSet: {
    id: 'crs-1',
    code: 'CRS-INFO',
    libelle: 'Règles de charge INFO',
  },
  chargeRuleSets: [
    {
      id: 'crs-1',
      code: 'CRS-INFO',
      libelle: 'Règles de charge INFO',
      version: '1.0',
    },
  ],
  adaptateur: {
    nom: 'fet',
    version: '7.12.0',
  },
  seancesOrigine: undefined,
  at: '2024-01-20T09:00:00Z',
};

describe('VersionProvenance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('affiche un état de chargement', () => {
    mockUseVersionProvenance.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isPending: true,
      isFetching: false,
      error: null,
    } as never);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionProvenance versionId="v-1" />
      </QueryClientProvider>,
    );
  });

  it('affiche la provenance complète pour une version issue d une génération', async () => {
    mockUseVersionProvenance.mockReturnValue({
      data: mockProvenance,
      isLoading: false,
      isError: false,
      isPending: false,
      isFetching: false,
      error: null,
    } as never);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionProvenance versionId="v-1" />
      </QueryClientProvider>,
    );

    await findByText('Provenance de la version');
    await findByText(/Numéro de version/);
    await findByText('Génération');
    await findByText('Génération source');
    await findByText('Profil INFO');
    await findByText('PROF-INFO');
    await findByText('Libellé');
    await findByText('Instantanés (snapshots)');
    await findByText('snapshot-1');
    await findByText('rep-1');
    await findByText('Jeu de règles de charge');
    await findByText('Validé par admin.');
    await findByText('Oui');
    await findByText('Date de validation');
    await findByText('Adaptateur / fichier moteur');
    await findByText('Empreinte du périmètre');
  });

  it('affiche un état d erreur', async () => {
    mockUseVersionProvenance.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isPending: false,
      isFetching: false,
      error: new Error('Erreur API'),
    } as never);

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionProvenance versionId="v-1" />
      </QueryClientProvider>,
    );

    await findByText(/Impossible de charger la provenance/);
  });
});
