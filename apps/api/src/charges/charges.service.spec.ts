// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service API des charges et agrégations (L2-10)

import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ChargesService } from './charges.service.js';

type PrismaMock = {
  annee: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  repartition: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  enseignant: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  chargeRuleSet: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function buildPrismaMock(): PrismaMock {
  return {
    annee: {
      findFirst: vi.fn(),
    },
    repartition: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    enseignant: {
      findUnique: vi.fn(),
    },
    chargeRuleSet: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb()),
  };
}

const auditService = {
  auditTransaction: vi.fn(async (cb: any) => cb()),
};

function buildModule(prismaMock: PrismaMock) {
  return {
    module: Test.createTestingModule({
      providers: [
        ChargesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditService },
      ],
    }),
    auditService,
  };
}

describe('ChargesService', () => {
  describe('findAllCharges', () => {
    it('should throw NotFoundException when no active year', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.findAllCharges(
          { page: 1, limit: 10 },
          { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
        ),
      ).rejects.toThrow('Aucune année scolaire active');
    });

    it('should return empty result when no semesters', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [],
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      const result = await service.findAllCharges(
        { page: 1, limit: 10 },
        { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return empty result when no repartitions', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [
          { id: 's1', numero: 1, nbSemaines: 14 },
          { id: 's2', numero: 2, nbSemaines: 14 },
        ],
      });
      prismaMock.repartition.findMany.mockResolvedValue([]);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      const result = await service.findAllCharges(
        { page: 1, limit: 10 },
        { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should enforce RBAC for Responsable out of scope', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [{ id: 's1', numero: 1, nbSemaines: 14 }],
      });
      prismaMock.repartition.findMany.mockResolvedValue([]);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.findAllCharges(
          { page: 1, limit: 10, departementId: 'dept-other' },
          { id: 'u1', role: 'RESPONSABLE_DEPARTEMENT', departments: [] },
        ),
      ).rejects.toThrow('OUT_OF_SCOPE');
    });
  });

  describe('findChargeByEnseignant', () => {
    it('should throw NotFoundException for unknown enseignant', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.enseignant.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.findChargeByEnseignant('unknown-id', {
          id: 'u1',
          role: 'GESTIONNAIRE',
          departments: [],
        }),
      ).rejects.toThrow('introuvable');
    });

    it('should enforce RBAC for Responsable out of scope', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.enseignant.findUnique.mockResolvedValue({
        id: 'e1',
        departementId: 'd1',
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.findChargeByEnseignant('e1', {
          id: 'u1',
          role: 'RESPONSABLE_DEPARTEMENT',
          departments: ['d2'],
        }),
      ).rejects.toThrow('OUT_OF_SCOPE');
    });
  });

  describe('getAnnualCharges', () => {
    it('should throw NotFoundException when no active year', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.getAnnualCharges(
          undefined,
          { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
        ),
      ).rejects.toThrow('Aucune année scolaire active');
    });

    it('should return empty result when less than 2 semesters', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [{ id: 's1', numero: 1, nbSemaines: 14 }],
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      const result = await service.getAnnualCharges(
        undefined,
        { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return empty result when no repartitions', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [
          { id: 's1', numero: 1, nbSemaines: 14 },
          { id: 's2', numero: 2, nbSemaines: 14 },
        ],
      });
      prismaMock.repartition.findMany.mockResolvedValue([]);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      const result = await service.getAnnualCharges(
        undefined,
        { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('should calculate annual charges with S1 and S2 sources', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [
          { id: 's1', numero: 1, nbSemaines: 14 },
          { id: 's2', numero: 2, nbSemaines: 14 },
        ],
      });
      prismaMock.chargeRuleSet.findFirst.mockResolvedValue({
        id: 'rs1',
        numero: 1,
        periode: 'ANNUELLE',
        seuil: 4,
        plafond: 20,
        arrondi: 2,
        referenceGrades: [
          { gradeId: 'g1', coefficient: 192 },
        ],
        coefficients: [
          { typeId: 't1', coefficient: 1.0 },
        ],
      });
      prismaMock.repartition.findMany.mockResolvedValue([
        {
          id: 'r1',
          semestreId: 's1',
          departementId: 'd1',
          statut: 'VALIDEE',
          affectations: [
            {
              id: 'a1',
              enseignantId: 'e1',
              moduleId: 'm1',
              typeEnseignementId: 't1',
              groupeId: null,
              estCmCommun: false,
              volumeHebdoMinutes: 600,
              seancesParSemaine: 2,
              dureeMinutes: 60,
              enseignant: {
                id: 'e1',
                matricule: 'M001',
                nom: 'Doe',
                prenom: 'John',
                departementId: 'd1',
                departement: { id: 'd1', libelle: 'Math' },
                grade: { id: 'g1' },
                decharges: [
                  { heures: 5, semestreId: 's1' },
                  { heures: 3, semestreId: 's2' },
                ],
              },
              module: { id: 'm1' },
              typeEnseignement: { id: 't1' },
              groupe: null,
            },
          ],
        },
        {
          id: 'r2',
          semestreId: 's2',
          departementId: 'd1',
          statut: 'VALIDEE',
          affectations: [
            {
              id: 'a2',
              enseignantId: 'e1',
              moduleId: 'm1',
              typeEnseignementId: 't1',
              groupeId: null,
              estCmCommun: false,
              volumeHebdoMinutes: 600,
              seancesParSemaine: 2,
              dureeMinutes: 60,
              enseignant: {
                id: 'e1',
                matricule: 'M001',
                nom: 'Doe',
                prenom: 'John',
                departementId: 'd1',
                departement: { id: 'd1', libelle: 'Math' },
                grade: { id: 'g1' },
                decharges: [
                  { heures: 5, semestreId: 's1' },
                  { heures: 3, semestreId: 's2' },
                ],
              },
              module: { id: 'm1' },
              typeEnseignement: { id: 't1' },
              groupe: null,
            },
          ],
        },
      ]);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      const result = await service.getAnnualCharges(
        undefined,
        { id: 'u1', role: 'GESTIONNAIRE', departments: [] },
      );

      expect(result.total).toBe(1);
      expect(result.data[0].enseignantId).toBe('e1');
      expect(result.data[0].s1.source).toBe('SNAPSHOT_VALIDE');
      expect(result.data[0].s2.source).toBe('SNAPSHOT_VALIDE');
      expect(result.data[0].divergence).toBe(false);
    });

    it('should enforce RBAC for Responsable out of scope', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.annee.findFirst.mockResolvedValue({
        id: 'a1',
        statut: 'ACTIVE',
        semestres: [
          { id: 's1', numero: 1, nbSemaines: 14 },
          { id: 's2', numero: 2, nbSemaines: 14 },
        ],
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ChargesService);

      await expect(
        service.getAnnualCharges(
          'dept-other',
          { id: 'u1', role: 'RESPONSABLE_DEPARTEMENT', departments: [] },
        ),
      ).rejects.toThrow('OUT_OF_SCOPE');
    });
  });
});
