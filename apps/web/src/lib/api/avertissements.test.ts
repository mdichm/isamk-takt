import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  listAvertissements,
  accepterAvertissement,
  type AvertissementConflit,
  type AccepterAvertissementInput,
} from './avertissements';

describe('avertissements API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAvertissements', () => {
    it('should GET conflits and filter AVERTISSEMENT non résolus', async () => {
      const conflits: AvertissementConflit[] = [
        {
          id: 'c-1',
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          type: 'ROOM',
          severite: 'AVERTISSEMENT',
          objetType: 'Seance',
          objetId: 's-1',
          seanceIds: ['s-1'],
          message: 'Équipement souhaité manquant',
          signature: 'sig-1',
          createdAt: '2026-10-23T10:00:00Z',
          resoluLe: null,
        },
        {
          id: 'c-2',
          regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
          type: 'TEACHER',
          severite: 'BLOQUANT',
          objetType: 'Seance',
          objetId: 's-2',
          seanceIds: ['s-2'],
          message: 'Double booking enseignant',
          signature: 'sig-2',
          createdAt: '2026-10-23T10:00:00Z',
          resoluLe: null,
        },
        {
          id: 'c-3',
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          type: 'ROOM',
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

      const result = await listAvertissements('v-1');

      expect(apiFetch).toHaveBeenCalledWith('/versions/v-1/conflits');
      expect(result).toHaveLength(1);
      expect(result[0].signature).toBe('sig-1');
    });

    it('should return empty array when no avertissements', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      const result = await listAvertissements('v-1');

      expect(result).toEqual([]);
    });
  });

  describe('accepterAvertissement', () => {
    it('should POST accept with signature and justification', async () => {
      const response = {
        id: 'a-1',
        versionId: 'v-1',
        regleCode: 'SALLE_SOUHAITE_MANQUANT',
        signature: 'sig-1',
        seanceIds: ['s-1'],
        auteurId: 'u-1',
        justification: 'Justification test',
        versionRevision: 0,
        acceptePar: 'u-1',
        accepteLe: '2026-10-23T10:00:00Z',
        impact: {
          seanceIds: ['s-1'],
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          message: 'Équipement souhaité manquant',
        },
      };

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const input: AccepterAvertissementInput = {
        signature: 'sig-1',
        justification: 'Justification test',
      };

      const result = await accepterAvertissement('v-1', input);

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/avertissements:accept',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      expect(result.id).toBe('a-1');
      expect(result.signature).toBe('sig-1');
    });

    it('should POST accept without justification', async () => {
      const response = {
        id: 'a-1',
        versionId: 'v-1',
        regleCode: 'SALLE_SOUHAITE_MANQUANT',
        signature: 'sig-1',
        seanceIds: ['s-1'],
        auteurId: 'u-1',
        versionRevision: 0,
        acceptePar: 'u-1',
        accepteLe: '2026-10-23T10:00:00Z',
        impact: {
          seanceIds: ['s-1'],
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          message: 'Équipement souhaité manquant',
        },
      };

      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );

      const input: AccepterAvertissementInput = {
        signature: 'sig-1',
      };

      await accepterAvertissement('v-1', input);

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/avertissements:accept',
        {
          method: 'POST',
          body: JSON.stringify({ signature: 'sig-1' }),
        },
      );
    });
  });
});
