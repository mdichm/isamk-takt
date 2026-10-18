import { describe, it, expect } from 'vitest';
import {
  departementSchema,
  formationSchema,
  niveauSchema,
  groupeSchema,
} from './structure';

describe('départementSchema', () => {
  it('should accept a valid departement', () => {
    const result = departementSchema.safeParse({
      anneeId: '550e8400-e29b-41d4-a716-446655440001',
      code: 'INFO',
      libelle: 'Informatique',
      ordre: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ordre).toBe(1);
    }
  });

  it('should accept departement without ordre', () => {
    const result = departementSchema.safeParse({
      anneeId: '550e8400-e29b-41d4-a716-446655440001',
      code: 'INFO',
      libelle: 'Informatique',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing anneeId', () => {
    const result = departementSchema.safeParse({
      code: 'INFO',
      libelle: 'Informatique',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative ordre', () => {
    const result = departementSchema.safeParse({
      anneeId: '550e8400-e29b-41d4-a716-446655440001',
      code: 'INFO',
      libelle: 'Informatique',
      ordre: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('formationSchema', () => {
  it('should accept a valid formation', () => {
    const result = formationSchema.safeParse({
      departementId: '550e8400-e29b-41d4-a716-446655440002',
      code: 'L3-INFO',
      libelle: 'Licence 3 Informatique',
      ordre: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing departementId', () => {
    const result = formationSchema.safeParse({
      code: 'L3-INFO',
      libelle: 'Licence 3 Informatique',
    });
    expect(result.success).toBe(false);
  });
});

describe('niveauSchema', () => {
  it('should accept a valid niveau', () => {
    const result = niveauSchema.safeParse({
      formationId: '550e8400-e29b-41d4-a716-446655440003',
      code: 'L3',
      libelle: 'Licence 3',
      ordre: 1,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing formationId', () => {
    const result = niveauSchema.safeParse({
      code: 'L3',
      libelle: 'Licence 3',
    });
    expect(result.success).toBe(false);
  });
});

describe('groupeSchema', () => {
  it('should accept a valid groupe', () => {
    const result = groupeSchema.safeParse({
      niveauId: '550e8400-e29b-41d4-a716-446655440004',
      semestreId: '550e8400-e29b-41d4-a716-446655440005',
      type: 'SECTION',
      code: 'L3-INFO-G1',
      libelle: 'L3 Informatique G1',
      ordre: 3,
    });
    expect(result.success).toBe(true);
  });

  it('should accept groupe without ordre', () => {
    const result = groupeSchema.safeParse({
      niveauId: '550e8400-e29b-41d4-a716-446655440004',
      semestreId: '550e8400-e29b-41d4-a716-446655440005',
      type: 'SECTION',
      code: 'L3-INFO-G1',
      libelle: 'L3 Informatique G1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid code format', () => {
    const result = groupeSchema.safeParse({
      niveauId: '550e8400-e29b-41d4-a716-446655440004',
      semestreId: '550e8400-e29b-41d4-a716-446655440005',
      type: 'SECTION',
      code: 'invalid code',
      libelle: 'Test',
    });
    expect(result.success).toBe(false);
  });
});