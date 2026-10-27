// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du client API du tableau de bord (L5-27)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTableauDeBord, type TableauDeBordResponse } from '@/lib/api/tableau-de-bord';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api/client';

const mockApiFetch = vi.mocked(apiFetch);

const mockResponse: TableauDeBordResponse = {
  role: 'GESTIONNAIRE',
  contexte: { annee: '2026-2027', semestre: 'S1' },
  repartitions: [
    { departementCode: 'INFO', statut: 'VALIDEE', avancement: '12/12' },
  ],
  validationsEnAttente: ['Validation INFO'],
  preparation: {
    peutGenerer: false,
    nbBloquants: 1,
    nbAvertissements: 2,
    nbInfos: 0,
    controles: [],
  },
  versionEnPreparation: {
    id: 'ver-1',
    numero: '3.0',
    statut: 'EDITION',
    conflitsBloquants: 2,
    nonPlacees: 5,
  },
  generations: {
    enCours: [{ id: 'gen-1', statut: 'EN_COURS', progres: 45 }],
    recentes: [{ id: 'gen-0', statut: 'REUSSIE', at: '2026-10-25T08:00:00Z' }],
  },
  versionPubliee: {
    id: 'pub-1',
    numero: '2.0',
    statut: 'PUBLIE',
    provenance: {
      generationId: 'gen-42',
      adaptateur: 'FET',
      versionFET: '7.12.0',
      seancesOrigine: 1200,
      at: '2026-10-20T12:00:00Z',
    },
  },
  changements: {
    departements: [{ code: 'INFO', libelle: 'Informatique', impactes: 10 }],
    totalImpactes: 10,
  },
  actionsPrioritaires: [
    { code: 'CONFLITS_BLOQUANTS', pourquoi: '2 conflit(s)', lien: '/versions/ver-1/conflits' },
  ],
};

describe('fetchTableauDeBord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle l API avec le semestre et les paramètres par défaut', async () => {
    mockApiFetch.mockResolvedValue({
      json: async () => mockResponse,
      ok: true,
    } as unknown as Response);

    const result = await fetchTableauDeBord('sem-1', false);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockApiFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/tableau-de-bord');
    expect(calledUrl).toContain('semestreId=sem-1');
    expect(calledUrl).not.toContain('actions=all');
    expect(result.role).toBe('GESTIONNAIRE');
    expect(result.contexte.semestre).toBe('S1');
  });

  it('ajoute actions=all quand demandé', async () => {
    mockApiFetch.mockResolvedValue({
      json: async () => mockResponse,
      ok: true,
    } as unknown as Response);

    await fetchTableauDeBord(undefined, true);

    const calledUrl = mockApiFetch.mock.calls[0][0];
    expect(calledUrl).toContain('actions=all');
  });

  it('ne passe pas semestreId quand non fourni', async () => {
    mockApiFetch.mockResolvedValue({
      json: async () => mockResponse,
      ok: true,
    } as unknown as Response);

    await fetchTableauDeBord(undefined, false);

    const calledUrl = mockApiFetch.mock.calls[0][0];
    expect(calledUrl).not.toContain('semestreId');
  });
});
