// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service ContrainteDefinition (L3-05)
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { ContrainteDefinition } from '@takt/db';
import { ContrainteDefinitionService } from './contrainte-definition.service.js';

// ============================================
// Mock PrismaService minimal pour les tests unitaires
// ============================================

class MockPrismaService {
  contrainteDefinition = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  };
}

function makeDefinition(
  code: string,
  categorie: 'DURE' | 'SOUPLE',
  paramsSchema: Record<string, unknown>,
): ContrainteDefinition {
  return {
    id: 'uuid-definition',
    code,
    libelle: `Libelle ${code}`,
    categorie,
    portee: 'GLOBALE',
    classe: categorie === 'DURE' ? 'HARD_CONSTRAINT' : 'SOFT_CONSTRAINT',
    traductionFET: 'FET_SUPPORTED',
    paramsSchema,
    fetSupport: 'NATIF',
    actif: true,
  } as ContrainteDefinition;
}

// ============================================
// Tests unitaires
// ============================================

describe('ContrainteDefinitionService (L3-05 - regles_gen)', () => {
  let service: ContrainteDefinitionService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new ContrainteDefinitionService(prisma as unknown as PrismaService);
  });

  describe('validateParams - MAX_HOURS_PER_DAY', () => {
    const def = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', {
      type: 'object',
      properties: { heures: { type: 'integer', minimum: 1, maximum: 24 } },
      required: ['heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { heures: 8 })).not.toThrow();
    });

    it('rejette le paramètre manquant', () => {
      expect(() => service.validateParams(def, {})).toThrow(
        'Paramètre requis manquant : heures',
      );
    });

    it('rejette une valeur hors bornes', () => {
      expect(() => service.validateParams(def, { heures: 30 })).toThrow(
        'Le paramètre heures doit être <= 24',
      );
    });

    it('rejette une valeur non entière', () => {
      expect(() => service.validateParams(def, { heures: 8.5 })).toThrow(
        'Le paramètre heures doit être un entier',
      );
    });
  });

  describe('validateParams - MIN_HOURS_PER_DAY', () => {
    const def = makeDefinition('MIN_HOURS_PER_DAY', 'DURE', {
      type: 'object',
      properties: {
        heures: { type: 'integer', minimum: 0, maximum: 24 },
        joursVidesAutorises: { type: 'boolean' },
      },
      required: ['heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() =>
        service.validateParams(def, { heures: 4, joursVidesAutorises: true }),
      ).not.toThrow();
    });

    it('rejette le paramètre requis manquant', () => {
      expect(() => service.validateParams(def, { joursVidesAutorises: true })).toThrow(
        'Paramètre requis manquant : heures',
      );
    });
  });

  describe('validateParams - MAX_CONTINUOUS_HOURS', () => {
    const def = makeDefinition('MAX_CONTINUOUS_HOURS', 'DURE', {
      type: 'object',
      properties: { heures: { type: 'integer', minimum: 1, maximum: 12 } },
      required: ['heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { heures: 6 })).not.toThrow();
    });

    it('rejette une valeur inférieure au minimum', () => {
      expect(() => service.validateParams(def, { heures: 0 })).toThrow(
        'Le paramètre heures doit être >= 1',
      );
    });
  });

  describe('validateParams - MIN_CONTINUOUS_HOURS', () => {
    const def = makeDefinition('MIN_CONTINUOUS_HOURS', 'SOUPLE', {
      type: 'object',
      properties: { heures: { type: 'integer', minimum: 1, maximum: 12 } },
      required: ['heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { heures: 2 })).not.toThrow();
    });
  });

  describe('validateParams - MAX_GAPS_PER_DAY', () => {
    const def = makeDefinition('MAX_GAPS_PER_DAY', 'DURE', {
      type: 'object',
      properties: { creux: { type: 'integer', minimum: 0, maximum: 10 } },
      required: ['creux'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { creux: 2 })).not.toThrow();
    });

    it('rejette une valeur négative', () => {
      expect(() => service.validateParams(def, { creux: -1 })).toThrow(
        'Le paramètre creux doit être >= 0',
      );
    });
  });

  describe('validateParams - MAX_GAPS_PER_WEEK', () => {
    const def = makeDefinition('MAX_GAPS_PER_WEEK', 'DURE', {
      type: 'object',
      properties: { creux: { type: 'integer', minimum: 0, maximum: 50 } },
      required: ['creux'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { creux: 8 })).not.toThrow();
    });
  });

  describe('validateParams - MAX_DAYS_PER_WEEK', () => {
    const def = makeDefinition('MAX_DAYS_PER_WEEK', 'DURE', {
      type: 'object',
      properties: { jours: { type: 'integer', minimum: 1, maximum: 6 } },
      required: ['jours'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { jours: 5 })).not.toThrow();
    });

    it('rejette une valeur supérieure au maximum', () => {
      expect(() => service.validateParams(def, { jours: 7 })).toThrow(
        'Le paramètre jours doit être <= 6',
      );
    });
  });

  describe('validateParams - MIN_DAYS_PER_WEEK', () => {
    const def = makeDefinition('MIN_DAYS_PER_WEEK', 'DURE', {
      type: 'object',
      properties: { jours: { type: 'integer', minimum: 1, maximum: 6 } },
      required: ['jours'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { jours: 3 })).not.toThrow();
    });
  });

  describe('validateParams - MAX_SPAN_PER_DAY', () => {
    const def = makeDefinition('MAX_SPAN_PER_DAY', 'SOUPLE', {
      type: 'object',
      properties: { heures: { type: 'integer', minimum: 1, maximum: 12 } },
      required: ['heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() => service.validateParams(def, { heures: 9 })).not.toThrow();
    });
  });

  describe('validateParams - MAX_HOURS_IN_INTERVAL', () => {
    const def = makeDefinition('MAX_HOURS_IN_INTERVAL', 'DURE', {
      type: 'object',
      properties: {
        debut: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
        fin: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
        heures: { type: 'integer', minimum: 0, maximum: 24 },
      },
      required: ['debut', 'fin', 'heures'],
      additionalProperties: false,
    });

    it('accepte des paramètres valides', () => {
      expect(() =>
        service.validateParams(def, { debut: '12:00', fin: '14:00', heures: 3 }),
      ).not.toThrow();
    });

    it('rejette le paramètre requis manquant', () => {
      expect(() =>
        service.validateParams(def, { debut: '12:00', fin: '14:00' }),
      ).toThrow('Paramètre requis manquant : heures');
    });
  });

  describe('findOneByCode', () => {
    it('lève une NotFoundException si la définition est introuvable', async () => {
      prisma.contrainteDefinition.findUnique.mockResolvedValue(null);
      await expect(service.findOneByCode('UNKNOWN_CODE')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('retourne le DTO si la définition est trouvée', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', {
        type: 'object',
        properties: { heures: { type: 'integer' } },
        required: ['heures'],
      });
      prisma.contrainteDefinition.findUnique.mockResolvedValue(def);
      const result = await service.findOneByCode('MAX_HOURS_PER_DAY');
      expect(result.code).toBe('MAX_HOURS_PER_DAY');
      expect(result.fetSupport).toBe('NATIF');
    });
  });
});
