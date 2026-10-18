import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findAllDecharges,
  findDechargeById,
  createDecharge,
  updateDecharge,
  deleteDecharge,
} from './decharges';

describe('decharges API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllDecharges', () => {
    it('should GET with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }), { status: 200 }));

      await findAllDecharges({ enseignantId: 'e-1', semestreId: 's-1' });

      expect(apiFetch).toHaveBeenCalledWith('/decharges?enseignantId=e-1&semestreId=s-1');
    });
  });

  describe('findDechargeById', () => {
    it('should GET by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'dc-1', heures: 10 }), { status: 200 }));

      await findDechargeById('dc-1');

      expect(apiFetch).toHaveBeenCalledWith('/decharges/dc-1');
    });
  });

  describe('createDecharge', () => {
    it('should POST the decharge', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'dc-1' }), { status: 201 }));

      await createDecharge({ heures: 10, enseignantId: 'e-1', semestreId: 's-1' });

      expect(apiFetch).toHaveBeenCalledWith('/decharges', {
        method: 'POST',
        body: JSON.stringify({ heures: 10, enseignantId: 'e-1', semestreId: 's-1' }),
      });
    });
  });

  describe('updateDecharge', () => {
    it('should PATCH the decharge', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'dc-1' }), { status: 200 }));

      await updateDecharge('dc-1', { heures: 15 });

      expect(apiFetch).toHaveBeenCalledWith('/decharges/dc-1', {
        method: 'PATCH',
        body: JSON.stringify({ heures: 15 }),
      });
    });
  });

  describe('deleteDecharge', () => {
    it('should DELETE by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteDecharge('dc-1');

      expect(apiFetch).toHaveBeenCalledWith('/decharges/dc-1', { method: 'DELETE' });
    });
  });
});
