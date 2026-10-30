import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findAllDepartements,
  createDepartement,
  updateDepartement,
  deleteDepartement,
  reorderDepartements,
  findAllFormations,
  createFormation,
  updateFormation,
  deleteFormation,
  reorderFormations,
  findAllNiveaux,
  createNiveau,
  updateNiveau,
  deleteNiveau,
  reorderNiveaux,
  findAllGroupes,
  createGroupe,
  updateGroupe,
  deleteGroupe,
  reorderGroupes,
} from '@/lib/api/structure';

// Mock the apiFetch function used by the API module
vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from '@/lib/api/client';

beforeEach(() => {
  (apiFetch as unknown as vi.Mock).mockReset();
});

function mockResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function getLastCall() {
  const calls = (apiFetch as unknown as vi.Mock).mock.calls;
  return calls[calls.length - 1];
}

describe('API functions', () => {
  describe('departements', () => {
    it('findAllDepartements builds correct URL and returns data', async () => {
      const data = { data: [{ id: '1', code: 'INFO' }], total: 1, page: 1, limit: 10, totalPages: 1 };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(data));
      const result = await findAllDepartements({ anneeId: 'annee-1' });
      expect(result).toEqual(data);
      const [url, init] = getLastCall();
      expect(url).toContain('structure/departements?anneeId=annee-1');
      // GET calls may omit init; default method is GET
      expect(init?.method ?? 'GET').toBe('GET');
    });

    it('createDepartement posts and returns created', async () => {
      const created = { id: 'new-id', code: 'MATH', libelle: 'Mathématiques' };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(created, 201));
      const result = await createDepartement({ anneeId: 'annee-1', code: 'MATH', libelle: 'Mathématiques' });
      expect(result).toEqual(created);
      const [url, init] = getLastCall();
      expect(url).toContain('structure/departements');
      expect(init).toMatchObject({ method: 'POST' });
      expect(typeof init?.body).toBe('string');
    });

    it('updateDepartement patches', async () => {
      const updated = { id: '1', code: 'INFO2' };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(updated));
      const result = await updateDepartement('1', { code: 'INFO2' });
      expect(result).toEqual(updated);
      const [url, init] = getLastCall();
      expect(url).toContain('structure/departements/1');
      expect(init).toMatchObject({ method: 'PATCH' });
    });

    it('deleteDepartement deletes', async () => {
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(null, 204));
      await deleteDepartement('1');
      const [url, init] = getLastCall();
      expect(url).toContain('structure/departements/1');
      expect(init).toMatchObject({ method: 'DELETE' });
    });

    it('reorderDepartements sends items', async () => {
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(null, 204));
      await reorderDepartements({ items: [{ id: '1', ordre: 2 }] });
      const [url, init] = getLastCall();
      expect(url).toContain('structure/departements/reorder');
      expect(init).toMatchObject({ method: 'PATCH' });
    });
  });

  // Similar pattern for formations, niveaux, groupes - abbreviated for brevity
  describe('formations', () => {
    it('findAllFormations', async () => {
      const data = { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(data));
      const result = await findAllFormations({ departementId: 'dep-1' });
      expect(result).toEqual(data);
      const [url, init] = getLastCall();
      expect(url).toContain('structure/formations');
      expect(init?.method ?? 'GET').toBe('GET');
    });
  });

  describe('niveaux', () => {
    it('findAllNiveaux', async () => {
      const data = { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(data));
      const result = await findAllNiveaux({ formationId: 'form-1' });
      expect(result).toEqual(data);
      const [url, init] = getLastCall();
      expect(url).toContain('structure/niveaux');
      expect(init?.method ?? 'GET').toBe('GET');
    });
  });

  describe('groupes', () => {
    it('findAllGroupes', async () => {
      const data = { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      (apiFetch as unknown as vi.Mock).mockResolvedValue(mockResponse(data));
      const result = await findAllGroupes({ niveauId: 'niv-1', semestreId: 'sem-1' });
      expect(result).toEqual(data);
      const [url, init] = getLastCall();
      expect(url).toContain('groupes');
      expect(init?.method ?? 'GET').toBe('GET');
    });
  });
});