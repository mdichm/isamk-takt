import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  listCovoiturageGroupes,
  getCovoiturageGroupe,
  createCovoiturageGroupe,
  updateCovoiturageGroupe,
  deleteCovoiturageGroupe,
  type CovoiturageGroupe,
  type CreateCovoiturageInput,
  type UpdateCovoiturageInput,
} from './covoiturage';

describe('covoiturage API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCovoiturageGroupes', () => {
    it('should GET groupes without query', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }), { status: 200 }),
      );

      await listCovoiturageGroupes();

      expect(apiFetch).toHaveBeenCalledWith('/covoiturage?');
    });

    it('should GET groupes with semestreId and pagination', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }), { status: 200 }),
      );

      await listCovoiturageGroupes({ semestreId: 'sem-1', page: 2, limit: 20 });

      expect(apiFetch).toHaveBeenCalledWith(
        '/covoiturage?semestreId=sem-1&page=2&limit=20',
      );
    });
  });

  describe('getCovoiturageGroupe', () => {
    it('should GET a groupe by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'g-1',
            semestreId: 'sem-1',
            enseignantIds: ['e-1', 'e-2'],
            margeMinutes: 60,
            joursCommunsMin: 1,
            strict: false,
            createdAt: '2026-01-01T00:00:00Z',
          }),
          { status: 200 },
        ),
      );

      const groupe = await getCovoiturageGroupe('g-1');

      expect(apiFetch).toHaveBeenCalledWith('/covoiturage/g-1');
      expect(groupe).toMatchObject<CovoiturageGroupe>({
        id: 'g-1',
        semestreId: 'sem-1',
        enseignantIds: ['e-1', 'e-2'],
        margeMinutes: 60,
        joursCommunsMin: 1,
        strict: false,
        createdAt: '2026-01-01T00:00:00Z',
      });
    });
  });

  describe('createCovoiturageGroupe', () => {
    it('should POST a new groupe', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'g-1',
            semestreId: 'sem-1',
            enseignantIds: ['e-1', 'e-2'],
            margeMinutes: 60,
            joursCommunsMin: 1,
            strict: false,
            createdAt: '2026-01-01T00:00:00Z',
          }),
          { status: 201 },
        ),
      );

      const input: CreateCovoiturageInput = {
        semestreId: 'sem-1',
        enseignantIds: ['e-1', 'e-2'],
        margeMinutes: 60,
        strict: false,
      };

      await createCovoiturageGroupe(input);

      expect(apiFetch).toHaveBeenCalledWith('/covoiturage', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    });
  });

  describe('updateCovoiturageGroupe', () => {
    it('should PATCH a groupe', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'g-1',
            semestreId: 'sem-1',
            enseignantIds: ['e-1', 'e-2'],
            margeMinutes: 90,
            joursCommunsMin: 1,
            strict: true,
            createdAt: '2026-01-01T00:00:00Z',
          }),
          { status: 200 },
        ),
      );

      const input: UpdateCovoiturageInput = {
        margeMinutes: 90,
        strict: true,
      };

      await updateCovoiturageGroupe('g-1', input);

      expect(apiFetch).toHaveBeenCalledWith('/covoiturage/g-1', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    });
  });

  describe('deleteCovoiturageGroupe', () => {
    it('should DELETE a groupe', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteCovoiturageGroupe('g-1');

      expect(apiFetch).toHaveBeenCalledWith('/covoiturage/g-1', {
        method: 'DELETE',
      });
    });
  });
});
