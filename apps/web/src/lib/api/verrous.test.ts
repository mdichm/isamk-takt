import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  listVerrousSeance,
  poseVerrou,
  leveVerrou,
  bulkPoseVerrou,
  previewLeveVerrou,
  leveVerrouById,
  type VerrouType,
} from './verrous';

describe('verrous API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listVerrousSeance', () => {
    it('should GET verrous for a séance', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await listVerrousSeance('v-1', 's-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/seances/s-1/verrous',
      );
    });
  });

  describe('poseVerrou', () => {
    it('should POST a verrou on a séance', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ id: 'vr-1' }), { status: 201 }),
      );

      await poseVerrou('v-1', 's-1', { type: 'CRENEAU', justification: 'Examen' });

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/seances/s-1/verrous',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'CRENEAU', justification: 'Examen' }),
        },
      );
    });

    it('should POST a verrou without justification', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ id: 'vr-1' }), { status: 201 }),
      );

      await poseVerrou('v-1', 's-1', { type: 'SALLE' });

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/seances/s-1/verrous',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'SALLE' }),
        },
      );
    });
  });

  describe('leveVerrou', () => {
    it('should DELETE a verrou by séance and type', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ id: 'vr-1', leveLe: '2026-10-23T10:00:00Z' }), { status: 200 }),
      );

      await leveVerrou('v-1', 's-1', 'CRENEAU');

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/seances/s-1/verrous?type=CRENEAU',
        { method: 'DELETE' },
      );
    });
  });

  describe('bulkPoseVerrou', () => {
    it('should POST bulk pose for a groupe', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ poses: 5, ignores: 2, details: [] }),
          { status: 200 },
        ),
      );

      await bulkPoseVerrou('v-1', {
        cible: { type: 'GROUPE', id: 'g-1' },
        type: 'ENSEIGNANT',
        justification: 'Indisponibilité enseignant',
      });

      expect(apiFetch).toHaveBeenCalledWith(
        '/versions/v-1/verrous:bulk',
        {
          method: 'POST',
          body: JSON.stringify({
            cible: { type: 'GROUPE', id: 'g-1' },
            type: 'ENSEIGNANT',
            justification: 'Indisponibilité enseignant',
          }),
        },
      );
    });
  });

  describe('previewLeveVerrou', () => {
    it('should DELETE with preview=true', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ seancesConcernees: 3, avertissement: '', verrouId: 'vr-1' }),
          { status: 200 },
        ),
      );

      await previewLeveVerrou('vr-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/verrous/vr-1?preview=true',
        { method: 'DELETE' },
      );
    });
  });

  describe('leveVerrouById', () => {
    it('should DELETE a verrou by ID', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ id: 'vr-1', leveLe: '2026-10-23T10:00:00Z' }), { status: 200 }),
      );

      await leveVerrouById('vr-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/verrous/vr-1',
        { method: 'DELETE' },
      );
    });
  });
});
