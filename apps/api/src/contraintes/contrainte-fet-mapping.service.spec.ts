// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service ContrainteFetMapping (L4-06)
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type {
  ContrainteInstance,
  ContrainteDefinition,
} from '@takt/db';
import { ContrainteFetMappingService } from './contrainte-fet-mapping.service.js';

class MockPrismaService {
  semestre = {
    findUnique: vi.fn(),
  };
  contrainteInstance = {
    findMany: vi.fn(),
  };
}

function makeSemestre(id: string) {
  return { id, code: 'S1', libelle: 'Semestre 1' } as any;
}

function makeDefinition(
  code: string,
  overrides: {
    traductionFET?: 'FET_SUPPORTED' | 'FET_TRANSFORMED' | 'APPLICATION_ONLY';
    fetSupport?: 'NATIF' | 'PARTIEL' | 'AUCUN';
  } = {},
): ContrainteDefinition {
  return {
    id: 'uuid-definition',
    code,
    libelle: `Libelle ${code}`,
    categorie: 'SOUPLE',
    portee: 'GLOBALE',
    classe: 'SOFT_CONSTRAINT',
    traductionFET: overrides.traductionFET ?? 'FET_SUPPORTED',
    paramsSchema: { type: 'object', properties: {}, required: [] },
    fetSupport: overrides.fetSupport ?? 'NATIF',
    actif: true,
  } as ContrainteDefinition;
}

function makeInstance(
  id: string,
  definition: ContrainteDefinition,
  overrides: {
    poids?: number | null;
    actif?: boolean;
  } = {},
): ContrainteInstance & { definition: ContrainteDefinition } {
  return {
    id,
    semestreId: 'uuid-semestre',
    definitionId: definition.id,
    enseignantId: null,
    groupeId: null,
    salleId: null,
    moduleId: null,
    params: {},
    poids: overrides.poids ?? null,
    nature: 'REGLE',
    commentaire: null,
    actif: overrides.actif ?? true,
    creePar: 'system',
    creeLe: new Date(),
    definition,
  } as ContrainteInstance & { definition: ContrainteDefinition };
}

describe('ContrainteFetMappingService', () => {
  let service: ContrainteFetMappingService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new ContrainteFetMappingService(prisma as any);
  });

  describe('genererRapportFetMapping', () => {
    it('devrait lever NotFoundException si le semestre n\'existe pas', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);
      await expect(service.genererRapportFetMapping('uuid-inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait retourner un rapport vide si aucune contrainte active', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.semestreId).toBe('uuid-semestre');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.stats).toEqual({ TRADUITE: 0, PARTIELLE: 0, NON_TRADUITE: 0 });
    });

    it('devrait classer FET_SUPPORTED comme TRADUITE', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        makeInstance('inst-1', makeDefinition('MAX_HOURS_PER_DAY', { traductionFET: 'FET_SUPPORTED', fetSupport: 'NATIF' })),
      ]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].regleCode).toBe('MAX_HOURS_PER_DAY');
      expect(result.items[0].statut).toBe('TRADUITE');
      expect(result.items[0].controleeParApplication).toBe(false);
      expect(result.stats.TRADUITE).toBe(1);
    });

    it('devrait classer APPLICATION_ONLY comme NON_TRADUITE', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        makeInstance('inst-1', makeDefinition('CARPOOL', { traductionFET: 'APPLICATION_ONLY', fetSupport: 'AUCUN' })),
      ]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items[0].statut).toBe('NON_TRADUITE');
      expect(result.items[0].raison).toBe('Évaluée par l\'application (APPLICATION_ONLY)');
      expect(result.items[0].controleeParApplication).toBe(true);
      expect(result.stats.NON_TRADUITE).toBe(1);
    });

    it('devrait classer poids = 0 comme NON_TRADUITE', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        makeInstance('inst-1', makeDefinition('MAX_GAPS_PER_DAY', { traductionFET: 'FET_SUPPORTED', fetSupport: 'NATIF' }), { poids: 0 }),
      ]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items[0].statut).toBe('NON_TRADUITE');
      expect(result.items[0].raison).toBe('Contrainte inactivée (poids = 0)');
      expect(result.stats.NON_TRADUITE).toBe(1);
    });

    it('devrait classer fetSupport PARTIEL comme PARTIELLE', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        makeInstance('inst-1', makeDefinition('MIN_GAP_BETWEEN_ACTIVITIES', { traductionFET: 'FET_TRANSFORMED', fetSupport: 'PARTIEL' })),
      ]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items[0].statut).toBe('PARTIELLE');
      expect(result.items[0].raison).toBe('Support partiel par FET - traduction approximative');
      expect(result.stats.PARTIELLE).toBe(1);
    });

    it('devrait classer fetSupport AUCUN comme NON_TRADUITE', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        makeInstance('inst-1', makeDefinition('EQUIPEMENT_SOUHAITE', { traductionFET: 'FET_SUPPORTED', fetSupport: 'AUCUN' })),
      ]);
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items[0].statut).toBe('NON_TRADUITE');
      expect(result.items[0].raison).toBe('Aucun équivalent FET');
      expect(result.stats.NON_TRADUITE).toBe(1);
    });

    it('devrait ne pas inclure les contraintes inactives', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre('uuid-semestre'));
      prisma.contrainteInstance.findMany.mockImplementation(({ where }) => {
        const all = [
          makeInstance('inst-1', makeDefinition('MAX_HOURS_PER_DAY', { traductionFET: 'FET_SUPPORTED', fetSupport: 'NATIF' }), { actif: false }),
        ];
        return Promise.resolve(all.filter((i) => i.actif === (where.actif ?? true)));
      });
      const result = await service.genererRapportFetMapping('uuid-semestre');
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});