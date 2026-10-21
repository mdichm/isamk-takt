import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findAllCharges,
  findChargeByEnseignant,
  findAnnualCharges,
  findChargeGlobale,
} from './charges';

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

  describe('findAnnualCharges', () => {
    it('should GET annual charges without filters', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ data: [], total: 0 }),
          { status: 200 },
        ),
      );

      await findAnnualCharges();

      expect(apiFetch).toHaveBeenCalledWith('/charges/annuelles');
    });

    it('should GET annual charges with filters', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({ data: [], total: 0 }),
          { status: 200 },
        ),
      );

      await findAnnualCharges({ departementId: 'd-1', enseignantId: 'e-1' });

      expect(apiFetch).toHaveBeenCalledWith(
        '/charges/annuelles?departementId=d-1&enseignantId=e-1',
      );
    });
  });

  describe('findChargeGlobale', () => {
    it('should GET charge globale by enseignant id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            enseignantId: 'e-1',
            matricule: 'ENS001',
            nom: 'Doe',
            prenom: 'John',
            totalVolumeBrut: 200,
            totalChargeCalculee: 240,
            totalChargeReference: 360,
            totalDecharges: 0,
            totalServiceDu: 360,
            totalEcart: -120,
            totalHeuresSup: 0,
            alerteDepassement: false,
            calculPartiel: false,
            parDepartement: [],
          }),
          { status: 200 },
        ),
      );

      await findChargeGlobale('e-1');

      expect(apiFetch).toHaveBeenCalledWith('/enseignants/e-1/charge-globale');
    });
  });
});