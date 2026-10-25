import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImpactSynthese } from './impact-synthese';
import * as api from '@/lib/api/versions';

vi.mock('@/lib/api/versions', () => ({
  fetchImpact: vi.fn(),
}));

vi.mock('@/lib/api/users', () => ({
  fetchMe: vi.fn(),
}));

const mockFetchImpact = vi.mocked(api.fetchImpact);

const mockImpactData = {
  versionId: 'v-1',
  versionNumero: 'V1',
  departements: [
    {
      departementId: 'dept-1',
      departementCode: 'INFO',
      departementLibelle: 'Informatique',
      statut: 'IMPACTE' as const,
      raison: 'SEANCES_MODIFIEES',
      reportee: false,
    },
    {
      departementId: 'dept-2',
      departementCode: 'MATH',
      departementLibelle: 'Mathématiques',
      statut: 'NON_IMPACTE' as const,
      raison: 'AUCUN_CHANGEMENT',
      reportee: true,
    },
  ],
  resume: { impactes: 1, nonImpactes: 1, reportees: 1 },
};

describe('ImpactSynthese', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('affiche un état de chargement', () => {
    mockFetchImpact.mockResolvedValue(mockImpactData);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ImpactSynthese versionId="v-1" />
      </QueryClientProvider>,
    );
  });

  it('affiche le résumé et le tableau quand les données sont chargées', async () => {
    mockFetchImpact.mockResolvedValue(mockImpactData);

    const { findByText, getByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ImpactSynthese versionId="v-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockFetchImpact).toHaveBeenCalledWith('v-1'));

    // Résumé : libellés à côté des badges
    await findByText('Départements impactés');
    await findByText('Départements non impactés');
    await findByText('Approbations reportées');

    // Tableau : en-têtes
    await findByText('Département');
    await findByText('Statut');
    await findByText('Raison');
    await findByText('Reportée');

    // Tableau : lignes départements
    await findByText('INFO — Informatique');
    await findByText('MATH — Mathématiques');

    // Statuts
    await findByText('Impacté');
    await findByText('Non impacté');

    // Raison traduite
    await findByText('Séances modifiées');
    await findByText('Aucun changement');

    // Mention reportée (pour MATH qui a reportee=true)
    await findByText('Approbation reportée sur la version parente');
    // Le département INFO n'est pas reporté → tiret
    expect(getByText('—')).toBeTruthy();
  });

  it.each([
    ['PREMIERE_VERSION', 'Première version'],
    ['SEANCES_MODIFIEES', 'Séances modifiées'],
    ['ENSEIGNANT_PARTAGE', 'Enseignant concerné'],
    ['SNAPSHOT_MODIFIE', 'Snapshot modifié'],
    ['AUCUN_CHANGEMENT', 'Aucun changement'],
  ])('traduit la raison %s en %s', async (raisonCode, attendu) => {
    mockFetchImpact.mockResolvedValue({
      ...mockImpactData,
      departements: [
        {
          ...mockImpactData.departements[0],
          raison: raisonCode,
        },
      ],
    });

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ImpactSynthese versionId="v-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockFetchImpact).toHaveBeenCalled());
    await findByText(attendu);
  });

  it('gère l\'état d\'erreur', async () => {
    mockFetchImpact.mockRejectedValue(new Error('Erreur API'));

    const { findByText } = render(
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })}
      >
        <ImpactSynthese versionId="v-1" />
      </QueryClientProvider>,
    );

    await findByText('Impossible de charger la synthèse d\'impact.');
  });

  it('gère la liste vide de départements', async () => {
    mockFetchImpact.mockResolvedValue({
      ...mockImpactData,
      departements: [],
      resume: { impactes: 0, nonImpactes: 0, reportees: 0 },
    });

    const { findByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ImpactSynthese versionId="v-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockFetchImpact).toHaveBeenCalled());
    await findByText('Départements impactés');
    await findByText('Départements non impactés');
    await findByText('Approbations reportées');
  });
});
