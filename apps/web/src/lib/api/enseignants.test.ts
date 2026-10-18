import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findAllEnseignants,
  findEnseignantById,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
  assignModules,
  unassignModule,
  findAllGrades,
  findAllModules,
} from './enseignants';

describe('enseignants API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllEnseignants', () => {
    it('should GET with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }), { status: 200 }));

      await findAllEnseignants({ page: 1, limit: 10, search: 'dupont' });

      expect(apiFetch).toHaveBeenCalledWith('/enseignants?page=1&limit=10&search=dupont');
    });
  });

  describe('findEnseignantById', () => {
    it('should GET by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'e-1', matricule: 'ENS-001' }), { status: 200 }));

      await findEnseignantById('e-1');

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1');
    });
  });

  describe('createEnseignant', () => {
    it('should POST the enseignant', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'e-1' }), { status: 201 }));

      await createEnseignant({ matricule: 'ENS-001', nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', anneeId: 'a-1', departementId: 'd-1' });

      expect(apiFetch).toHaveBeenCalledWith('/enseignants', {
        method: 'POST',
        body: JSON.stringify({ matricule: 'ENS-001', nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', anneeId: 'a-1', departementId: 'd-1' }),
      });
    });
  });

  describe('updateEnseignant', () => {
    it('should PATCH the enseignant', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'e-1' }), { status: 200 }));

      await updateEnseignant('e-1', { nom: 'Durand' });

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1', {
        method: 'PATCH',
        body: JSON.stringify({ nom: 'Durand' }),
      });
    });
  });

  describe('deleteEnseignant', () => {
    it('should DELETE by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteEnseignant('e-1');

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1', { method: 'DELETE' });
    });
  });

  describe('assignModules', () => {
    it('should POST module assignment', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ id: 'e-1' }), { status: 201 }));

      await assignModules('e-1', { moduleIds: ['m-1', 'm-2'] });

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1/modules', {
        method: 'POST',
        body: JSON.stringify({ moduleIds: ['m-1', 'm-2'] }),
      });
    });
  });

  describe('unassignModule', () => {
    it('should DELETE module assignment', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await unassignModule('e-1', 'm-1');

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1/modules/m-1', { method: 'DELETE' });
    });
  });

  describe('findAllGrades / findAllModules', () => {
    it('should GET grades', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify([{ id: 'g-1', code: 'PR', libelle: 'Professeur' }]), { status: 200 }));
      await findAllGrades();
      expect(apiFetch).toHaveBeenCalledWith('/modules/grades');
    });

    it('should GET modules', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
      await findAllModules();
      expect(apiFetch).toHaveBeenCalledWith('/modules');
    });
  });
});
