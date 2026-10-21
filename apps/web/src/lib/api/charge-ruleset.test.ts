import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findChargeRuleSets,
  findChargeRuleSet,
  createChargeRuleSet,
  updateChargeRuleSet,
  deleteChargeRuleSet,
  publishChargeRuleSet,
} from './charge-ruleset';
import type { ChargeRuleSet } from './charge-ruleset';

const ruleset: ChargeRuleSet = {
  id: 'rs-1',
  numero: 1,
  periode: 'SEMESTRIELLE',
  seuil: 1200,
  plafond: 2400,
  arrondi: 30,
  publieLe: null,
  anneeId: 'annee-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  referenceGrades: [],
  coefficients: [],
};

describe('charge-ruleset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findChargeRuleSets', () => {
    it('should GET all charge rulesets', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify([ruleset]), { status: 200 }),
      );

      const result = await findChargeRuleSets();

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rs-1');
    });
  });

  describe('findChargeRuleSet', () => {
    it('should GET a single charge ruleset by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 200 }),
      );

      const result = await findChargeRuleSet('rs-1');

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets/rs-1');
      expect(result.id).toBe('rs-1');
    });
  });

  describe('createChargeRuleSet', () => {
    it('should POST a new charge ruleset', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 201 }),
      );

      const input = {
        numero: 1,
        periode: 'SEMESTRIELLE' as const,
        seuil: 1200,
        plafond: 2400,
        arrondi: 30,
        anneeId: 'annee-1',
      };

      const result = await createChargeRuleSet(input);

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result.id).toBe('rs-1');
    });
  });

  describe('updateChargeRuleSet', () => {
    it('should PATCH a charge ruleset', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 200 }),
      );

      const result = await updateChargeRuleSet('rs-1', { seuil: 1300 });

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets/rs-1', {
        method: 'PATCH',
        body: JSON.stringify({ seuil: 1300 }),
      });
      expect(result.id).toBe('rs-1');
    });
  });

  describe('deleteChargeRuleSet', () => {
    it('should DELETE a charge ruleset by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteChargeRuleSet('rs-1');

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets/rs-1', {
        method: 'DELETE',
      });
    });
  });

  describe('publishChargeRuleSet', () => {
    it('should POST publish a charge ruleset', async () => {
      const published = { ...ruleset, publieLe: '2024-06-01T00:00:00Z' };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(published), { status: 200 }),
      );

      const result = await publishChargeRuleSet('rs-1');

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets/rs-1/publish', {
        method: 'POST',
      });
      expect(result.publieLe).toBe('2024-06-01T00:00:00Z');
    });
  });

  describe('newChargeRuleSetVersion', () => {
    it('should POST a new version of a charge ruleset', async () => {
      const next = { ...ruleset, id: 'rs-2', numero: 2, publieLe: null };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(next), { status: 201 }),
      );

      const { newChargeRuleSetVersion } = await import('./charge-ruleset');
      const result = await newChargeRuleSetVersion('rs-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/new-version',
        { method: 'POST' },
      );
      expect(result.numero).toBe(2);
    });
  });

  describe('createChargeReferenceGrade', () => {
    it('should POST a reference grade coefficient', async () => {
      const { createChargeReferenceGrade } = await import('./charge-ruleset');
      const grade = {
        id: 'rg-1',
        rulesetId: 'rs-1',
        gradeId: 'grade-1',
        coefficient: 1.5,
        createdAt: '2024-01-01T00:00:00Z',
      };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(grade), { status: 201 }),
      );

      const result = await createChargeReferenceGrade('rs-1', {
        gradeId: 'grade-1',
        coefficient: 1.5,
      });

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/reference-grades',
        {
          method: 'POST',
          body: JSON.stringify({ gradeId: 'grade-1', coefficient: 1.5 }),
        },
      );
      expect(result.gradeId).toBe('grade-1');
    });
  });

  describe('updateChargeReferenceGrade', () => {
    it('should PATCH a reference grade coefficient with gradeId', async () => {
      const { updateChargeReferenceGrade } = await import('./charge-ruleset');
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 200 }),
      );

      await updateChargeReferenceGrade('rs-1', 'grade-1', 1.5);

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/reference-grades?gradeId=grade-1',
        {
          method: 'PATCH',
          body: JSON.stringify({ coefficient: 1.5 }),
        },
      );
    });

    it('should PATCH the default reference grade (no gradeId)', async () => {
      const { updateChargeReferenceGrade } = await import('./charge-ruleset');
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 200 }),
      );

      await updateChargeReferenceGrade('rs-1', null, 1.2);

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/reference-grades?',
        {
          method: 'PATCH',
          body: JSON.stringify({ coefficient: 1.2 }),
        },
      );
    });
  });

  describe('deleteChargeReferenceGrade', () => {
    it('should DELETE a reference grade with gradeId', async () => {
      const { deleteChargeReferenceGrade } = await import('./charge-ruleset');
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteChargeReferenceGrade('rs-1', 'grade-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/reference-grades?gradeId=grade-1',
        { method: 'DELETE' },
      );
    });
  });

  describe('createChargeCoefficient', () => {
    it('should POST a type coefficient', async () => {
      const { createChargeCoefficient } = await import('./charge-ruleset');
      const coeff = {
        id: 'cc-1',
        rulesetId: 'rs-1',
        typeId: 'type-1',
        coefficient: 1.5,
        createdAt: '2024-01-01T00:00:00Z',
      };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(coeff), { status: 201 }),
      );

      const result = await createChargeCoefficient('rs-1', {
        typeId: 'type-1',
        coefficient: 1.5,
      });

      expect(apiFetch).toHaveBeenCalledWith('/charge/rulesets/rs-1/coefficients', {
        method: 'POST',
        body: JSON.stringify({ typeId: 'type-1', coefficient: 1.5 }),
      });
      expect(result.typeId).toBe('type-1');
    });
  });

  describe('updateChargeCoefficient', () => {
    it('should PATCH a type coefficient', async () => {
      const { updateChargeCoefficient } = await import('./charge-ruleset');
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(ruleset), { status: 200 }),
      );

      await updateChargeCoefficient('rs-1', 'type-1', 1.5);

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/coefficients/type-1',
        {
          method: 'PATCH',
          body: JSON.stringify({ coefficient: 1.5 }),
        },
      );
    });
  });

  describe('deleteChargeCoefficient', () => {
    it('should DELETE a type coefficient', async () => {
      const { deleteChargeCoefficient } = await import('./charge-ruleset');
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteChargeCoefficient('rs-1', 'type-1');

      expect(apiFetch).toHaveBeenCalledWith(
        '/charge/rulesets/rs-1/coefficients/type-1',
        { method: 'DELETE' },
      );
    });
  });
});