import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  listConflits,
  listAvertissementsConflits,
  simulatePlacement,
  type Conflit,
  type SimulatePlacementInput,
} from './conflits';

describe('conflits API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConflits', () => {
    it('should GET conflits from the version endpoint', async () => {
      const conflits: Conflit[] = [
        {
          id: 'c-1',
          regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
          type: 'ENSEIGNANT',
          severite: 'BLOQUANT',
          objetType: 'Seance',
          objetId: 's-1',
          seanceIds: ['s-1'],
          message: 'Double booking enseignant',
          signature: 'sig-1',
          createdAt: '2026-10-23T10:00:00Z',
        },
        {
          id: 'c-2',
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          type: 'SALLE',
          severite: 'AVERTISSEMENT',
          objetType: 'Seance',
          objetId: 's-2',
          seanceIds: ['s-2'],
          message: 'Équipement souhaité manquant',
          signature: 'sig-2',
          createdAt: '2026-10-23T10:00:00Z',
          resoluLe: null,
        },
      ];

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(conflits), { status: 200 }),
      );

      const result = await listConflits('v-1');

      expect(apiFetch).toHaveBeenCalledWith('/versions/v-1/conflits');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('ENSEIGNANT');
      expect(result[1].type).toBe('SALLE');
    });

    it('should return empty array when no conflits', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      const result = await listConflits('v-1');

      expect(result).toEqual([]);
    });
  });

  describe('listAvertissementsConflits', () => {
    it('should filter AVERTISSEMENT non resolus', async () => {
      const conflits: Conflit[] = [
        {
          id: 'c-1',
          regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
          type: 'ENSEIGNANT',
          severite: 'BLOQUANT',
          objetType: 'Seance',
          objetId: 's-1',
          seanceIds: ['s-1'],
          message: 'Double booking enseignant',
          signature: 'sig-1',
          createdAt: '2026-10-23T10:00:00Z',
        },
        {
          id: 'c-2',
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          type: 'SALLE',
          severite: 'AVERTISSEMENT',
          objetType: 'Seance',
          objetId: 's-2',
          seanceIds: ['s-2'],
          message: 'Équipement souhaité manquant',
          signature: 'sig-2',
          createdAt: '2026-10-23T10:00:00Z',
          resoluLe: null,
        },
        {
          id: 'c-3',
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          type: 'SALLE',
          severite: 'AVERTISSEMENT',
          objetType: 'Seance',
          objetId: 's-3',
          seanceIds: ['s-3'],
          message: 'Équipement souhaité manquant',
          signature: 'sig-3',
          createdAt: '2026-10-23T10:00:00Z',
          resoluLe: '2026-10-23T11:00:00Z',
        },
      ];

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(conflits), { status: 200 }),
      );

      const result = await listAvertissementsConflits('v-1');

      expect(apiFetch).toHaveBeenCalledWith('/versions/v-1/conflits');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c-2');
      expect(result[0].severite).toBe('AVERTISSEMENT');
    });

    it('should return empty array when no avertissements', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      const result = await listAvertissementsConflits('v-1');

      expect(result).toEqual([]);
    });
  });
});

  describe('simulatePlacement', () => {
    it('should POST simulate placement with the given input', async () => {
      const input: SimulatePlacementInput = {
        jour: 'LUNDI',
        creneauDebutId: 'c-1',
        salleId: 'salle-1',
      };

      const response = {
        conflits: [],
        conflitsBloquants: [],
        conflitsAvertissements: [],
        placementValide: true,
        impacts: {
          groupes: ['G1', 'G2'],
          enseignant: 'Dupont',
          salle: 'Amphi A',
          verrous: [],
        },
        dureeMs: 42,
      };

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const result = await simulatePlacement('seance-1', input);

      expect(apiFetch).toHaveBeenCalledWith(
        '/seances/seance-1/placement:simulate',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      expect(result.placementValide).toBe(true);
      expect(result.impacts.enseignant).toBe('Dupont');
    });

    it('should return conflicts when placement is invalid', async () => {
      const input: SimulatePlacementInput = {
        jour: 'MARDI',
        creneauDebutId: 'c-2',
        salleId: 'salle-2',
      };

      const response = {
        conflits: [
          {
            id: 'c-1',
            regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
            type: 'ENSEIGNANT',
            severite: 'BLOQUANT',
            objetType: 'Seance',
            objetId: 'seance-1',
            seanceIds: ['seance-1'],
            message: 'Double booking enseignant',
            signature: 'sig-1',
            createdAt: '2026-10-23T10:00:00Z',
          },
        ],
        conflitsBloquants: [],
        conflitsAvertissements: [],
        placementValide: false,
        impacts: {
          groupes: [],
          enseignant: '',
          salle: '',
          verrous: [],
        },
        dureeMs: 15,
      };

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const result = await simulatePlacement('seance-1', input);

      expect(result.placementValide).toBe(false);
      expect(result.conflits).toHaveLength(1);
      expect(result.conflits[0].severite).toBe('BLOQUANT');
    });
  });
