import { describe, it, expect } from 'vitest';
import {
  departementSchema,
  formationSchema,
  niveauSchema,
  groupeSchema,
} from '@/lib/validation/structure';

describe('Zod validation schemas', () => {
  describe('departementSchema', () => {
    it('accepts valid input', () => {
      const valid = {
        anneeId: '123e4567-e89b-12d3-a456-426614174000',
        code: 'INFO',
        libelle: 'Informatique',
        ordre: 1,
        originId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(() => departementSchema.parse(valid)).not.toThrow();
    });

    it('rejects missing anneeId', () => {
      const invalid = { code: 'INFO', libelle: 'Informatique' };
      expect(() => departementSchema.parse(invalid)).toThrow();
    });

    it('rejects invalid uuid for anneeId', () => {
      const invalid = { anneeId: 'not-a-uuid', code: 'INFO', libelle: 'Informatique' };
      expect(() => departementSchema.parse(invalid)).toThrow();
    });

    it('rejects code too long', () => {
      const invalid = {
        anneeId: '123e4567-e89b-12d3-a456-426614174000',
        code: 'A'.repeat(51),
        libelle: 'Informatique',
      };
      expect(() => departementSchema.parse(invalid)).toThrow();
    });
  });

  describe('formationSchema', () => {
    it('accepts valid input', () => {
      const valid = {
        departementId: '123e4567-e89b-12d3-a456-426614174000',
        code: 'L3-INFO',
        libelle: 'Licence 3 Informatique',
        ordre: 0,
      };
      expect(() => formationSchema.parse(valid)).not.toThrow();
    });

    it('rejects missing departementId', () => {
      const invalid = { code: 'L3-INFO', libelle: 'Licence 3 Informatique' };
      expect(() => formationSchema.parse(invalid)).toThrow();
    });
  });

  describe('niveauSchema', () => {
    it('accepts valid input', () => {
      const valid = {
        formationId: '123e4567-e89b-12d3-a456-426614174000',
        code: 'L3',
        libelle: 'Licence 3',
        ordre: 2,
      };
      expect(() => niveauSchema.parse(valid)).not.toThrow();
    });

    it('rejects missing formationId', () => {
      const invalid = { code: 'L3', libelle: 'Licence 3' };
      expect(() => niveauSchema.parse(invalid)).toThrow();
    });
  });

  describe('groupeSchema', () => {
    it('accepts valid input', () => {
      const valid = {
        niveauId: '123e4567-e89b-12d3-a456-426614174000',
        semestreId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'SECTION' as const,
        code: 'L1-INFO-G1',
        libelle: 'Groupe 1',
        effectif: '30',
        ordre: 1,
      };
      expect(() => groupeSchema.parse(valid)).not.toThrow();
    });

    it('rejects invalid type', () => {
      const invalid = {
        niveauId: '123e4567-e89b-12d3-a456-426614174000',
        semestreId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'INVALID',
        code: 'L1-INFO-G1',
        libelle: 'Groupe 1',
      };
      expect(() => groupeSchema.parse(invalid)).toThrow();
    });

    it('rejects code not matching regex', () => {
      const invalid = {
        niveauId: '123e4567-e89b-12d3-a456-426614174000',
        semestreId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'SECTION' as const,
        code: 'invalid code!',
        libelle: 'Groupe 1',
      };
      expect(() => groupeSchema.parse(invalid)).toThrow();
    });
  });
});