import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findAllVoeux,
  findVoeuById,
  createVoeu,
  updateVoeu,
  deleteVoeu,
  VOEU_CODES,
  VOEU_POIDS_VALUES,
} from './voeux';

describe('voeux API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllVoeux', () => {
    it('should GET with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 50, totalPages: 0,
      }), { status: 200 }));

      await findAllVoeux({ semestreId: 's-1', enseignantId: 'e-1', page: 1, limit: 50 });

      expect(apiFetch).toHaveBeenCalledWith('/voeux?semestreId=s-1&enseignantId=e-1&page=1&limit=50');
    });

    it('should GET without params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 50, totalPages: 0,
      }), { status: 200 }));

      await findAllVoeux();

      expect(apiFetch).toHaveBeenCalledWith('/voeux?');
    });
  });

  describe('findVoeuById', () => {
    it('should GET by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'v-1' }), { status: 200 }));

      await findVoeuById('v-1');

      expect(apiFetch).toHaveBeenCalledWith('/voeux/v-1');
    });
  });

  describe('createVoeu', () => {
    it('should POST the voeux', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'v-1' }), { status: 201 }));

      await createVoeu({
        semestreId: 's-1',
        enseignantId: 'e-1',
        code: 'TEACHER_DAY_OFF_WISH',
        poids: 50,
        params: { code: 'TEACHER_DAY_OFF_WISH', Jour: 'Lundi' },
      });

      expect(apiFetch).toHaveBeenCalledWith('/voeux', {
        method: 'POST',
        body: JSON.stringify({
          semestreId: 's-1',
          enseignantId: 'e-1',
          code: 'TEACHER_DAY_OFF_WISH',
          poids: 50,
          params: { code: 'TEACHER_DAY_OFF_WISH', Jour: 'Lundi' },
        }),
      });
    });
  });

  describe('updateVoeu', () => {
    it('should PATCH the voeux', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'v-1' }), { status: 200 }));

      await updateVoeu('v-1', { poids: 75, commentaire: 'Mis à jour' });

      expect(apiFetch).toHaveBeenCalledWith('/voeux/v-1', {
        method: 'PATCH',
        body: JSON.stringify({ poids: 75, commentaire: 'Mis à jour' }),
      });
    });
  });

  describe('deleteVoeu', () => {
    it('should DELETE by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteVoeu('v-1');

      expect(apiFetch).toHaveBeenCalledWith('/voeux/v-1', { method: 'DELETE' });
    });
  });

  describe('constants', () => {
    it('should export VOEU_CODES', () => {
      expect(VOEU_CODES).toContain('TEACHER_AVOID_SLOT');
      expect(VOEU_CODES).toContain('TEACHER_DAY_OFF_WISH');
      expect(VOEU_CODES).toContain('TEACHER_DAYS_PER_WEEK');
      expect(VOEU_CODES).toContain('TEACHER_HOURS_PER_DAY');
      expect(VOEU_CODES).toContain('TEACHER_GAPS');
    });

    it('should export VOEU_POIDS_VALUES', () => {
      expect(VOEU_POIDS_VALUES).toEqual([25, 50, 75, 90]);
    });
  });
});