// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service des profils de génération (L4-10)

import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ProfilsService } from './profils.service.js';

type PrismaMock = {
  semestre: { findUnique: ReturnType<typeof vi.fn> };
  profilGeneration: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function buildPrismaMock(): PrismaMock {
  const profilGenerationMock = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  return {
    semestre: { findUnique: vi.fn() },
    profilGeneration: profilGenerationMock,
    $transaction: vi.fn(async (cb: any) => {
      const tx = { profilGeneration: profilGenerationMock };
      return cb(tx);
    }),
  };
}

const auditService = {
  writeAudit: vi.fn(async (tx: any, data: any) => {}),
};

function buildModule(prismaMock: PrismaMock) {
  return {
    module: Test.createTestingModule({
      providers: [
        ProfilsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditService },
      ],
    }),
    auditService,
  };
}

const currentUser = { id: 'u1', role: 'GESTIONNAIRE', departments: [] };
const semestreId = 's1';
const profilId = 'p1';

const mockProfil = {
  id: profilId,
  semestreId,
  nom: 'Standard S1',
  numero: 1,
  estParDefaut: false,
  dureeLimiteMinutes: 120,
  preserverVerrous: false,
  engineVersion: '7.12.0',
  constructeurVersion: '1.0.0',
  graines: [10, 11, 12, 20, 21, 22],
  poidsScore: { remplissage: 40, compactage: 30 },
  valeursSnapshot: { nom: 'Standard S1', dureeLimiteMinutes: 120 },
  generations: [],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('ProfilsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProfil', () => {
    it('should create a profil when semestre exists', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prismaMock.profilGeneration.create.mockResolvedValue(mockProfil);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.createProfil(
        semestreId,
        { semestreId, nom: 'Standard S1', dureeLimiteMinutes: 120 },
        currentUser,
      );

      expect(result.id).toBe(profilId);
      expect(result.nom).toBe('Standard S1');
      expect(auditService.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when semestre does not exist', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.semestre.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      await expect(
        service.createProfil(semestreId, { semestreId, nom: 'X' }, currentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfils', () => {
    it('should return list of profils for a semestre', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findMany.mockResolvedValue([mockProfil]);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.getProfils(semestreId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(profilId);
    });
  });

  describe('getProfil', () => {
    it('should return a profil by id', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(mockProfil);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.getProfil(profilId);

      expect(result.id).toBe(profilId);
      expect(result.nom).toBe('Standard S1');
    });

    it('should throw NotFoundException when profil does not exist', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      await expect(service.getProfil('unknown')).rejects.toThrow(NotFoundException);
    });
  });
  describe('updateProfil', () => {
    it('should update in place when profil is not used by any generation', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(mockProfil);
      prismaMock.profilGeneration.update.mockResolvedValue({
        ...mockProfil,
        nom: 'Standard S1 v2',
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.updateProfil(
        profilId,
        { nom: 'Standard S1 v2' },
        currentUser,
      );

      expect(result.nom).toBe('Standard S1 v2');
      expect(auditService.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('should create a new version when profil is used by a generation', async () => {
      const usedProfil = { ...mockProfil, generations: [{ id: 'g1' }] };
      const newVersionProfil = { ...usedProfil, id: 'p2', numero: 2 };

      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(usedProfil);
      prismaMock.profilGeneration.create.mockResolvedValue(newVersionProfil);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.updateProfil(
        profilId,
        { nom: 'Standard S1 v2' },
        currentUser,
      );

      expect(result.numero).toBe(2);
      expect(result.id).toBe('p2');
      expect(prismaMock.profilGeneration.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.profilGeneration.update).not.toHaveBeenCalled();
      expect(auditService.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when profil does not exist', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      await expect(
        service.updateProfil('unknown', { nom: 'X' }, currentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefaultProfil', () => {
    it('should set the default profil and unset previous default', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(mockProfil);
      prismaMock.profilGeneration.update.mockResolvedValue({
        ...mockProfil,
        estParDefaut: true,
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.setDefaultProfil(
        semestreId,
        { profilId },
        currentUser,
      );

      expect(result.estParDefaut).toBe(true);
      expect(prismaMock.profilGeneration.updateMany).toHaveBeenCalledWith({
        where: { semestreId, estParDefaut: true },
        data: { estParDefaut: false },
      });
      expect(auditService.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when profil does not exist', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      await expect(
        service.setDefaultProfil(semestreId, { profilId: 'unknown' }, currentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when profil does not belong to semestre', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findUnique.mockResolvedValue({
        ...mockProfil,
        semestreId: 's2',
      });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      await expect(
        service.setDefaultProfil(semestreId, { profilId }, currentUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDefaultProfil', () => {
    it('should return the default profil when it exists', async () => {
      const defaultProfil = { ...mockProfil, estParDefaut: true };
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findFirst.mockResolvedValue(defaultProfil);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.getDefaultProfil(semestreId);

      expect(result).not.toBeNull();
      expect(result?.estParDefaut).toBe(true);
    });

    it('should return null when no default profil exists', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.profilGeneration.findFirst.mockResolvedValue(null);

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(ProfilsService);

      const result = await service.getDefaultProfil(semestreId);

      expect(result).toBeNull();
    });
  });
});