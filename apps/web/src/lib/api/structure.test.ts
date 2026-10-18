import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDepartement,
  reorderDepartements,
  reorderFormations,
  reorderNiveaux,
  reorderGroupes,
} from './structure';

// Mock the api client
vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000/api',
}));

import { apiFetch } from './client';

describe('structure API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDepartement', () => {
    it('should POST to the correct endpoint', async () => {
      const mockData = { id: 'dep-1', code: 'INFO', libelle: 'Informatique', ordre: 1 };
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

      const result = await createDepartement({
        anneeId: 'annee-1',
        code: 'INFO',
        libelle: 'Informatique',
        ordre: 1,
      });

      expect(apiFetch).toHaveBeenCalledWith('http://localhost:3000/api/structure/departements', {
        method: 'POST',
        body: JSON.stringify({
          anneeId: 'annee-1',
          code: 'INFO',
          libelle: 'Informatique',
          ordre: 1,
        }),
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('reorderDepartements', () => {
    it('should PATCH to the reorder endpoint', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await reorderDepartements({
        items: [
          { id: 'dep-2', ordre: 1 },
          { id: 'dep-1', ordre: 2 },
        ],
      });

      expect(apiFetch).toHaveBeenCalledWith('http://localhost:3000/api/structure/departements/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          items: [
            { id: 'dep-2', ordre: 1 },
            { id: 'dep-1', ordre: 2 },
          ],
        }),
      });
    });
  });

  describe('reorderFormations', () => {
    it('should PATCH to the reorder endpoint', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await reorderFormations({
        items: [{ id: 'form-1', ordre: 1 }],
      });

      expect(apiFetch).toHaveBeenCalledWith('http://localhost:3000/api/structure/formations/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: [{ id: 'form-1', ordre: 1 }] }),
      });
    });
  });

  describe('reorderNiveaux', () => {
    it('should PATCH to the reorder endpoint', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await reorderNiveaux({
        items: [{ id: 'niv-1', ordre: 1 }],
      });

      expect(apiFetch).toHaveBeenCalledWith('http://localhost:3000/api/structure/niveaux/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: [{ id: 'niv-1', ordre: 1 }] }),
      });
    });
  });

  describe('reorderGroupes', () => {
    it('should PATCH to the reorder endpoint', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await reorderGroupes({
        items: [{ id: 'grp-1', ordre: 1 }],
      });

      expect(apiFetch).toHaveBeenCalledWith('http://localhost:3000/api/groupes/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: [{ id: 'grp-1', ordre: 1 }] }),
      });
    });
  });
});