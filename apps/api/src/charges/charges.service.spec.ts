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
});
