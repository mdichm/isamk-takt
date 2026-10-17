// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Structure académique (L1-03)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StructureService } from './structure.service.js';
import {
  CreateDepartementDto,
  UpdateDepartementDto,
} from './dto/structure.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return {
    PrismaClient: PrismaClientMock,
  };
});

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('StructureService', () => {
  let service: StructureService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const anneeId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      annee: { findUnique: vi.fn() },
      departement: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      formation: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      niveau: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new StructureService(prisma as any, audit as any);
  });

  describe('Départements', () => {
    it('should create a departement', async () => {
      const dto: CreateDepartementDto = {
        anneeId,
        code: 'INFO',
        libelle: 'Informatique',
      };

      prisma.annee.findUnique.mockResolvedValue({ id: anneeId, numero: 2026, code: '2026-2027' });
      prisma.departement.findFirst.mockResolvedValue(null);
      prisma.departement.create.mockResolvedValue({
        id: 'dep-1', anneeId, code: 'INFO', libelle: 'Informatique', originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createDepartement(dto, userId);

      expect(result.code).toBe('INFO');
      expect(result.libelle).toBe('Informatique');
      expect(prisma.departement.create).toHaveBeenCalledWith({
        data: {
          anneeId, code: 'INFO', libelle: 'Informatique', originId: null,
        },
      });
    });

    it('should throw Conflict when departement code already exists', async () => {
      const dto: CreateDepartementDto = {
        anneeId, code: 'INFO', libelle: 'Informatique',
      };

      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findFirst.mockResolvedValue({ id: 'dep-1', code: 'INFO' });

      await expect(service.createDepartement(dto, userId)).rejects.toThrow('existe déjà');
    });

    it('should find all departements with pagination', async () => {
      prisma.departement.findMany.mockResolvedValue([
        { id: 'dep-1', anneeId, code: 'INFO', libelle: 'Informatique', originId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prisma.departement.count.mockResolvedValue(1);

      const result = await service.findAllDepartements({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should find departement by id', async () => {
      prisma.departement.findUnique.mockResolvedValue({
        id: 'dep-1', anneeId, code: 'INFO', libelle: 'Informatique', originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.findDepartementById('dep-1');

      expect(result.id).toBe('dep-1');
      expect(result.code).toBe('INFO');
    });

    it('should throw NotFound when departement not found', async () => {
      prisma.departement.findUnique.mockResolvedValue(null);

      await expect(service.findDepartementById('unknown')).rejects.toThrow('non trouvé');
    });

    it('should update a departement', async () => {
      const dto: UpdateDepartementDto = { code: 'MATH', libelle: 'Mathématiques' };

      prisma.departement.findUnique.mockResolvedValue({
        id: 'dep-1', anneeId, code: 'INFO', libelle: 'Informatique', originId: null,
      });
      prisma.departement.findFirst.mockResolvedValue(null);
      prisma.departement.update.mockResolvedValue({
        id: 'dep-1', anneeId, code: 'MATH', libelle: 'Mathématiques', originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.updateDepartement('dep-1', dto, userId);

      expect(result.code).toBe('MATH');
      expect(result.libelle).toBe('Mathématiques');
    });

    it('should remove a departement with no formations', async () => {
      prisma.departement.findUnique.mockResolvedValue({
        id: 'dep-1', code: 'INFO', formations: [],
      });
      prisma.departement.delete.mockResolvedValue({ id: 'dep-1' });

      await service.removeDepartement('dep-1', userId);

      expect(prisma.departement.delete).toHaveBeenCalledWith({ where: { id: 'dep-1' } });
    });

    it('should refuse removal when departement has formations', async () => {
      prisma.departement.findUnique.mockResolvedValue({
        id: 'dep-1', code: 'INFO', formations: [{ id: 'form-1', code: 'L3-INFO' }],
      });

      await expect(service.removeDepartement('dep-1', userId)).rejects.toThrow('référencé');
    });
  });

  describe('Formations', () => {
    it('should create a formation', async () => {
      const dto = {
        departementId: 'dep-1',
        code: 'L3-INFO',
        libelle: 'Licence 3 Informatique',
      };

      prisma.departement.findUnique.mockResolvedValue({ id: 'dep-1' });
      prisma.formation.findFirst.mockResolvedValue(null);
      prisma.formation.create.mockResolvedValue({
        id: 'form-1', departementId: 'dep-1', code: 'L3-INFO', libelle: 'Licence 3 Informatique', originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createFormation(dto, userId);

      expect(result.code).toBe('L3-INFO');
      expect(result.libelle).toBe('Licence 3 Informatique');
    });

    it('should list formations by departement', async () => {
      prisma.formation.findMany.mockResolvedValue([
        { id: 'form-1', departementId: 'dep-1', code: 'L3-INFO', libelle: 'Licence 3 Informatique', originId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prisma.formation.count.mockResolvedValue(1);

      const result = await service.findAllFormations({ departementId: 'dep-1', page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should refuse removal when formation has niveaux', async () => {
      prisma.formation.findUnique.mockResolvedValue({
        id: 'form-1', code: 'L3-INFO', niveaux: [{ id: 'niv-1', code: 'L3' }],
      });

      await expect(service.removeFormation('form-1', userId)).rejects.toThrow('référencé');
    });
  });

  describe('Niveaux', () => {
    it('should create a niveau', async () => {
      const dto = {
        formationId: 'form-1',
        code: 'L3',
        libelle: 'Licence 3',
      };

      prisma.formation.findUnique.mockResolvedValue({ id: 'form-1' });
      prisma.niveau.findFirst.mockResolvedValue(null);
      prisma.niveau.create.mockResolvedValue({
        id: 'niv-1', formationId: 'form-1', code: 'L3', libelle: 'Licence 3', originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createNiveau(dto, userId);

      expect(result.code).toBe('L3');
      expect(result.libelle).toBe('Licence 3');
    });

    it('should list niveaux by formation', async () => {
      prisma.niveau.findMany.mockResolvedValue([
        { id: 'niv-1', formationId: 'form-1', code: 'L3', libelle: 'Licence 3', originId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prisma.niveau.count.mockResolvedValue(1);

      const result = await service.findAllNiveaux({ formationId: 'form-1', page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should remove a niveau', async () => {
      prisma.niveau.findUnique.mockResolvedValue({
        id: 'niv-1', code: 'L3', formationId: 'form-1',
      });
      prisma.niveau.delete.mockResolvedValue({ id: 'niv-1' });

      await service.removeNiveau('niv-1', userId);

      expect(prisma.niveau.delete).toHaveBeenCalledWith({ where: { id: 'niv-1' } });
    });
  });
});