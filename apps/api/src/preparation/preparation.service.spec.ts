// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de préparation du semestre (L4-12)

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from './preparation.service.js';
import { NiveauAnomalie } from './dto/preparation.dto.js';

type PrismaMock = {
  semestre: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function buildPrismaMock(): PrismaMock {
  return {
    semestre: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => {
      return cb({} as any);
    }),
  };
};

function buildModule(prismaMock: PrismaMock) {
  return {
    module: Test.createTestingModule({
      providers: [
        PreparationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }),
  };
};

const semestreId = 's1';

const makeSemestre = (overrides: any = {}) => ({
  id: semestreId,
  numero: 1,
  anneeId: 'a1',
  annee: { id: 'a1', numero: 2025, code: '2025-2026' },
  creneaux: [],
  groupes: [],
  enseignants: [],
  salles: [],
  modules: [],
  repartitions: [],
  contrainteInstances: [],
  verrous: [],
  exigencesSalle: [],
  indisponibilites: [],
  profilGeneration: [],
  ...overrides,
});

describe('PreparationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreparation', () => {
    it('should throw NotFoundException when semestre does not exist', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      await expect(service.getPreparation(semestreId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return all controls with bloquant anomalies when everything is missing', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(makeSemestre());

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      expect(result.semestreId).toBe(semestreId);
      expect(result.peutGenerer).toBe(false);
      expect(result.nbBloquants).toBeGreaterThan(0);
      expect(result.controles).toHaveLength(10);

      const c1 = result.controles[0];
      expect(c1.numero).toBe(1);
      expect(c1.niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c1.statut).toBe('NON_CONFORME');
      expect(c1.anomalies.length).toBeGreaterThan(0);

      const c10 = result.controles[9];
      expect(c10.numero).toBe(10);
      expect(c10.niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c10.statut).toBe('NON_CONFORME');
    });

    it('should return peutGenerer=true when all controls are conformes', async () => {
      const semestre = makeSemestre({
        creneaux: [{ estPause: false, jour: 'LUNDI' }],
        groupes: [
          {
            code: 'L1-INFO-A1',
            effectif: 30,
            niveau: { formation: { departement: { id: 'd1', code: 'INFO' } } },
          },
        ],
        enseignants: [{ id: 'e1' }],
        salles: [{ id: 'salle1' }],
        modules: [{ id: 'm1', code: 'MATH101', effectifMax: 30 }],
        repartitions: [
          { statut: 'VALIDEE', departement: { id: 'd1', code: 'INFO' } },
        ],
        contrainteInstances: [
          {
            nature: 'REGLE',
            actif: true,
            definition: { code: 'MAX_HOURS_PER_DAY', portee: 'GLOBALE' },
          },
        ],
        verrous: [],
        exigencesSalle: [],
        indisponibilites: [{ id: 'ind1' }],
        profilGeneration: [{ estParDefaut: true }],
      });

      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(semestre);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      expect(result.peutGenerer).toBe(true);
      expect(result.nbBloquants).toBe(0);
      expect(result.controles.every((c) => c.statut === 'CONFORME')).toBe(true);
    });

    it('should detect missing default profil as bloquant', async () => {
      const semestre = makeSemestre({
        creneaux: [{ estPause: false, jour: 'LUNDI' }],
        groupes: [
          {
            code: 'L1-INFO-A1',
            effectif: 30,
            niveau: { formation: { departement: { id: 'd1', code: 'INFO' } } },
          },
        ],
        enseignants: [{ id: 'e1' }],
        salles: [{ id: 'salle1' }],
        modules: [{ id: 'm1', code: 'MATH101', effectifMax: 30 }],
        repartitions: [
          { statut: 'VALIDEE', departement: { id: 'd1', code: 'INFO' } },
        ],
        contrainteInstances: [
          {
            nature: 'REGLE',
            actif: true,
            definition: { code: 'MAX_HOURS_PER_DAY', portee: 'GLOBALE' },
          },
        ],
        verrous: [],
        exigencesSalle: [],
        indisponibilites: [{ id: 'ind1' }],
        profilGeneration: [],
      });

      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(semestre);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      expect(result.peutGenerer).toBe(false);
      const c10 = result.controles[9];
      expect(c10.niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c10.anomalies[0].niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c10.anomalies[0].objet).toBe('Profil de génération');
    });

    it('should detect non-validée répartition as bloquant', async () => {
      const semestre = makeSemestre({
        creneaux: [{ estPause: false, jour: 'LUNDI' }],
        groupes: [
          {
            code: 'L1-INFO-A1',
            effectif: 30,
            niveau: { formation: { departement: { id: 'd1', code: 'INFO' } } },
          },
        ],
        enseignants: [{ id: 'e1' }],
        salles: [{ id: 'salle1' }],
        modules: [{ id: 'm1', code: 'MATH101', effectifMax: 30 }],
        repartitions: [
          { statut: 'BROUILLON', departement: { id: 'd1', code: 'INFO' } },
        ],
        contrainteInstances: [
          {
            nature: 'REGLE',
            actif: true,
            definition: { code: 'MAX_HOURS_PER_DAY', portee: 'GLOBALE' },
          },
        ],
        verrous: [],
        exigencesSalle: [],
        indisponibilites: [{ id: 'ind1' }],
        profilGeneration: [{ estParDefaut: true }],
      });

      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(semestre);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      expect(result.peutGenerer).toBe(false);
      const c4 = result.controles[3];
      expect(c4.niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c4.statut).toBe('NON_CONFORME');
      expect(c4.anomalies[0].objet).toBe('Répartition');
    });

    it('should detect invalid group code as bloquant', async () => {
      const semestre = makeSemestre({
        creneaux: [{ estPause: false, jour: 'LUNDI' }],
        groupes: [
          {
            code: 'INVALID_CODE',
            effectif: 30,
            niveau: { formation: { departement: { id: 'd1', code: 'INFO' } } },
          },
        ],
        enseignants: [{ id: 'e1' }],
        salles: [{ id: 'salle1' }],
        modules: [{ id: 'm1', code: 'MATH101', effectifMax: 30 }],
        repartitions: [
          { statut: 'VALIDEE', departement: { id: 'd1', code: 'INFO' } },
        ],
        contrainteInstances: [
          {
            nature: 'REGLE',
            actif: true,
            definition: { code: 'MAX_HOURS_PER_DAY', portee: 'GLOBALE' },
          },
        ],
        verrous: [],
        exigencesSalle: [],
        indisponibilites: [{ id: 'ind1' }],
        profilGeneration: [{ estParDefaut: true }],
      });

      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(semestre);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      expect(result.peutGenerer).toBe(false);
      const c2 = result.controles[1];
      expect(c2.niveau).toBe(NiveauAnomalie.BLOQUANT);
      expect(c2.anomalies.some((a) => a.objet === 'Groupe' && a.regle === 'EX-ORG-03')).toBe(true);
    });

    it('should return informational level for control 9 when no indisponibilites', async () => {
      const semestre = makeSemestre({
        creneaux: [{ estPause: false, jour: 'LUNDI' }],
        groupes: [
          {
            code: 'L1-INFO-A1',
            effectif: 30,
            niveau: { formation: { departement: { id: 'd1', code: 'INFO' } } },
          },
        ],
        enseignants: [{ id: 'e1' }],
        salles: [{ id: 'salle1' }],
        modules: [{ id: 'm1', code: 'MATH101', effectifMax: 30 }],
        repartitions: [
          { statut: 'VALIDEE', departement: { id: 'd1', code: 'INFO' } },
        ],
        contrainteInstances: [
          {
            nature: 'REGLE',
            actif: true,
            definition: { code: 'MAX_HOURS_PER_DAY', portee: 'GLOBALE' },
          },
        ],
        verrous: [],
        exigencesSalle: [],
        indisponibilites: [],
        profilGeneration: [{ estParDefaut: true }],
      });

      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(semestre);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PreparationService);

      const result = await service.getPreparation(semestreId);

      const c9 = result.controles[8];
      expect(c9.niveau).toBe(NiveauAnomalie.INFORMATIF);
      expect(c9.anomalies[0].niveau).toBe(NiveauAnomalie.INFORMATIF);
      expect(c9.anomalies[0].objet).toBe('Indisponibilité');
    });

  });

});
