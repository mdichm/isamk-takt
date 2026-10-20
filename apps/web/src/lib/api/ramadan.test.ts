import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findAllCreneauxAffichage,
  findCreneauAffichageById,
  createCreneauAffichage,
  updateCreneauAffichage,
  deleteCreneauAffichage,
  duplicateCreneauxAffichage,
} from './ramadan';

describe('ramadan API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllCreneauxAffichage', () => {
    it('should GET with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      }), { status: 200 }));

      await findAllCreneauxAffichage({ page: 1, limit: 10, semestreId: 's-1', grille: 'RAMADAN' });

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage?page=1&limit=10&semestreId=s-1&grille=RAMADAN');
    });

    it('should GET without optional params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      }), { status: 200 }));

      await findAllCreneauxAffichage();

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage?');
    });
  });

  describe('findCreneauAffichageById', () => {
    it('should GET by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        id: 'a-1', creneauId: 'c-1', grille: 'RAMADAN', heureDebut: '07:30:00', heureFin: '09:00:00',
      }), { status: 200 }));

      await findCreneauAffichageById('a-1');

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage/a-1');
    });
  });

  describe('createCreneauAffichage', () => {
    it('should POST the affichage', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'a-1' }), { status: 201 }));

      await createCreneauAffichage({
        creneauId: 'c-1',
        heureDebut: '07:30:00',
        heureFin: '09:00:00',
      });

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage', {
        method: 'POST',
        body: JSON.stringify({ creneauId: 'c-1', heureDebut: '07:30:00', heureFin: '09:00:00' }),
      });
    });
  });

  describe('updateCreneauAffichage', () => {
    it('should PATCH the affichage', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'a-1' }), { status: 200 }));

      await updateCreneauAffichage('a-1', { heureDebut: '08:00:00', heureFin: '09:30:00' });

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage/a-1', {
        method: 'PATCH',
        body: JSON.stringify({ heureDebut: '08:00:00', heureFin: '09:30:00' }),
      });
    });
  });

  describe('deleteCreneauAffichage', () => {
    it('should DELETE by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteCreneauAffichage('a-1');

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage/a-1', { method: 'DELETE' });
    });
  });

  describe('duplicateCreneauxAffichage', () => {
    it('should POST duplication', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        created: 3, creneauAffichageIds: ['a-1', 'a-2', 'a-3'],
      }), { status: 201 }));

      await duplicateCreneauxAffichage({
        sourceSemestreId: 's-1',
        cibleSemestreId: 's-2',
        remplacer: false,
      });

      expect(apiFetch).toHaveBeenCalledWith('/creneaux-affichage/duplicate', {
        method: 'POST',
        body: JSON.stringify({ sourceSemestreId: 's-1', cibleSemestreId: 's-2', remplacer: false }),
      });
    });
  });
});
