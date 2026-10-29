// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Salles (L1-10)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalleService } from './salle.service.js';
import type {
  CreateTypeSalleDto,
  CreateSalleDto,
  CreateEquipementDto,
  AssignerEquipementsDto,
} from './dto/salle.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('SalleService', () => {
  let service: SalleService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conflitService: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const departementId = '550e8400-e29b-41d4-a716-446655440001';
  const typeSalleId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      typeSalle: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      salle: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      equipement: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      salleEquipement: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        count: vi.fn(),
      },
      departement: {
        findUnique: vi.fn(),
      },
    };

    audit = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conflitService = {
      recalculerConflitsSemestre: vi.fn().mockResolvedValue(undefined),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new SalleService(prisma as any, audit as any, conflitService as any, {
      verifyAnneeWritable: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  describe('Types de salle', () => {
    it('should create a type salle', async () => {
      const dto: CreateTypeSalleDto = {
        code: 'AMPHI',
        libelle: 'Amphithéâtre',
      };

      prisma.typeSalle.findFirst.mockResolvedValue(null);
      prisma.typeSalle.create.mockResolvedValue({
        id: 'ts-1', code: 'AMPHI', libelle: 'Amphithéâtre', estActive: true, originId: null,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createTypeSalle(dto, userId);

      expect(result.code).toBe('AMPHI');
      expect(result.libelle).toBe('Amphithéâtre');
      expect(prisma.typeSalle.create).toHaveBeenCalledWith({
        data: { code: 'AMPHI', libelle: 'Amphithéâtre', estActive: true, originId: null },
      });
    });

    it('should throw Conflict when type salle code already exists', async () => {
      const dto: CreateTypeSalleDto = {
        code: 'AMPHI',
        libelle: 'Amphithéâtre',
      };

      prisma.typeSalle.findFirst.mockResolvedValue({ id: 'ts-1', code: 'AMPHI' });

      await expect(service.createTypeSalle(dto, userId)).rejects.toThrow('existe déjà');
    });

    it('should list type salles with pagination', async () => {
      prisma.typeSalle.findMany.mockResolvedValue([
        { id: 'ts-1', code: 'AMPHI', libelle: 'Amphithéâtre', estActive: true, originId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prisma.typeSalle.count.mockResolvedValue(1);

      const result = await service.findAllTypeSalles({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should remove a type salle with no linked salles', async () => {
      prisma.typeSalle.findUnique.mockResolvedValue({ id: 'ts-1', code: 'AMPHI' });
      prisma.salle.count.mockResolvedValue(0);
      prisma.typeSalle.update.mockResolvedValue({ id: 'ts-1', estActive: false });

      await service.removeTypeSalle('ts-1', userId);

      expect(prisma.typeSalle.update).toHaveBeenCalledWith({
        where: { id: 'ts-1' },
        data: { estActive: false },
      });
    });

    it('should refuse removing a type salle used by salles', async () => {
      prisma.typeSalle.findUnique.mockResolvedValue({ id: 'ts-1', code: 'AMPHI' });
      prisma.salle.count.mockResolvedValue(3);

      await expect(service.removeTypeSalle('ts-1', userId)).rejects.toThrow('salle(s) utilisent ce type de salle');
    });
  });

  describe('Salles', () => {
    it('should create a salle', async () => {
      const dto: CreateSalleDto = {
        code: 'AMPHI-A',
        libelle: 'Amphithéâtre A',
        capaciteMax: 120,
        capaciteRecommandee: 100,
        departementId,
        typeSalleId,
      };

      prisma.salle.findFirst.mockResolvedValue(null);
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });
      prisma.typeSalle.findUnique.mockResolvedValue({ id: typeSalleId });
      prisma.salle.create.mockResolvedValue({
        id: 'salle-1', code: 'AMPHI-A', libelle: 'Amphithéâtre A', siteId: null,
        capaciteMax: 120, capaciteRecommandee: 100, accesPMR: false, commentaire: null,
        estActive: true, departementId, typeSalleId, originId: null,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createSalle(dto, userId);

      expect(result.code).toBe('AMPHI-A');
      expect(result.capaciteMax).toBe(120);
      expect(prisma.salle.create).toHaveBeenCalledWith({
        data: {
          code: 'AMPHI-A', libelle: 'Amphithéâtre A', siteId: null,
          capaciteMax: 120, capaciteRecommandee: 100, accesPMR: false,
          commentaire: null, estActive: true, departementId, typeSalleId, originId: null,
        },
      });
    });

    it('should throw BadRequest when capacite recommandee > capacite max', async () => {
      const dto: CreateSalleDto = {
        code: 'AMPHI-A',
        libelle: 'Amphithéâtre A',
        capaciteMax: 50,
        capaciteRecommandee: 100,
      };

      await expect(service.createSalle(dto, userId)).rejects.toThrow('dépasser la capacité maximale');
    });

    it('should list salles with pagination', async () => {
      prisma.salle.findMany.mockResolvedValue([
        { id: 'salle-1', code: 'AMPHI-A', libelle: 'Amphithéâtre A', site: null,
          capaciteMax: 120, capaciteRecommandee: 100, accesPMR: false, commentaire: null,
          estActive: true, departementId: null, typeSalleId: null, originId: null,
          createdAt: new Date(), updatedAt: new Date(),
          typeSalle: null, departement: null },
      ]);
      prisma.salle.count.mockResolvedValue(1);

      const result = await service.findAllSalles({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw Conflict when salle code already exists', async () => {
      const dto: CreateSalleDto = {
        code: 'AMPHI-A',
        libelle: 'Amphithéâtre A',
        capaciteMax: 120,
      };

      prisma.salle.findFirst.mockResolvedValue({ id: 'salle-1', code: 'AMPHI-A' });

      await expect(service.createSalle(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('Équipements', () => {
    it('should create an equipement', async () => {
      const dto: CreateEquipementDto = {
        code: 'VIDEOPROJ',
        libelle: 'Vidéo projecteur',
      };

      prisma.equipement.findFirst.mockResolvedValue(null);
      prisma.equipement.create.mockResolvedValue({
        id: 'eq-1', code: 'VIDEOPROJ', libelle: 'Vidéo projecteur', estActive: true, originId: null,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createEquipement(dto, userId);

      expect(result.code).toBe('VIDEOPROJ');
      expect(result.libelle).toBe('Vidéo projecteur');
    });

    it('should throw Conflict when equipement code already exists', async () => {
      const dto: CreateEquipementDto = {
        code: 'VIDEOPROJ',
        libelle: 'Vidéo projecteur',
      };

      prisma.equipement.findFirst.mockResolvedValue({ id: 'eq-1', code: 'VIDEOPROJ' });

      await expect(service.createEquipement(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('Assigner équipements', () => {
    it('should assign equipements to a salle', async () => {
      const dto: AssignerEquipementsDto = {
        equipementIds: ['eq-1', 'eq-2'],
      };

      prisma.salle.findUnique.mockResolvedValue({ id: 'salle-1', code: 'AMPHI-A' });
      prisma.equipement.findMany.mockResolvedValue([
        { id: 'eq-1', code: 'VIDEOPROJ' },
        { id: 'eq-2', code: 'TABLEAU' },
      ]);
      prisma.salleEquipement.deleteMany.mockResolvedValue({ count: 0 });
      prisma.salleEquipement.createMany.mockResolvedValue({ count: 2 });

      const result = await service.assignerEquipements('salle-1', dto, userId);

      expect(prisma.salleEquipement.deleteMany).toHaveBeenCalledWith({ where: { salleId: 'salle-1' } });
      expect(prisma.salleEquipement.createMany).toHaveBeenCalledWith({
        data: [
          { salleId: 'salle-1', equipementId: 'eq-1' },
          { salleId: 'salle-1', equipementId: 'eq-2' },
        ],
      });
      expect(result.code).toBe('AMPHI-A');
    });

    it('should throw NotFound when some equipements are missing', async () => {
      const dto: AssignerEquipementsDto = {
        equipementIds: ['eq-1', 'eq-999'],
      };

      prisma.salle.findUnique.mockResolvedValue({ id: 'salle-1', code: 'AMPHI-A' });
      prisma.equipement.findMany.mockResolvedValue([
        { id: 'eq-1', code: 'VIDEOPROJ' },
      ]);

      await expect(service.assignerEquipements('salle-1', dto, userId)).rejects.toThrow('introuvables');
    });
  });

  describe('Mise à jour salle', () => {
    it('recalcule les conflits sur toutes les versions non publiées quand la capacité change', async () => {
      const existing = { id: 'salle-1', code: 'AMPHI-A', capaciteMax: 100, capaciteRecommandee: null };
      prisma.salle.findUnique.mockResolvedValue(existing);
      prisma.salle.update.mockResolvedValue({ ...existing, capaciteMax: 120 });

      const result = await service.updateSalle('salle-1', { capaciteMax: 120 } as any, userId);

      expect(result.capaciteMax).toBe(120);
      expect(conflitService.recalculerConflitsSemestre).toHaveBeenCalledWith();
    });

    it('ne recalcule pas quand seule une caracteristique non capacitaire change', async () => {
      const existing = { id: 'salle-1', code: 'AMPHI-A', capaciteMax: 100, capaciteRecommandee: null };
      prisma.salle.findUnique.mockResolvedValue(existing);
      prisma.salle.update.mockResolvedValue({ ...existing, libelle: 'Amphi A renove' });

      await service.updateSalle('salle-1', { libelle: 'Amphi A renove' } as any, userId);

      expect(conflitService.recalculerConflitsSemestre).not.toHaveBeenCalled();
    });
  });
});