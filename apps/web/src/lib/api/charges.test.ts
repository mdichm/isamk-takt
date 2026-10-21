import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import { findAllCharges, findChargeByEnseignant } from './charges';

describe('charges API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllCharges', () => {
    it('should GET charges with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
          { status: 200 },
        ),
      );

      await findAllCharges({ page: 1, limit: 10, dimension: 'departement' });

      expect(apiFetch).toHaveBeenCalledWith(
        '/charges?page=1&limit=10&dimension=departement',
      );
    });

    it('should GET charges with enseignant filter', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
          { status: 200 },
        ),
      );

      await findAllCharges({ enseignantId: 'e-1', departementId: 'd-1' });

      expect(apiFetch).toHaveBeenCalledWith(
        '/charges?enseignantId=e-1&departementId=d-1',
      );
    });
  });

  describe('findChargeByEnseignant', () => {
    it('should GET charge by enseignant id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ enseignantId: 'e-1', volumeBrut: 100 }), { status: 200 }),
      );

      await findChargeByEnseignant('e-1');

      expect(apiFetch).toHaveBeenCalledWith('/charges/enseignant/e-1');
    });
  });
});