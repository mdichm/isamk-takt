// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Compatibilité (L1-11)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompatService } from './compat.service.js';
import type {
  CreateSalleActivityTagDto,
  CreateExigenceEquipementDto,
  UpdateExigenceEquipementDto,
} from './dto/compat.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
  ExigenceNiveau: { OBLIGATOIRE: 'OBLIGATOIRE', SOUHAITE: 'SOUHAITE' },
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('CompatService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: CompatService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const salleId = '550e8400-e29b-41d4-a716-446655440100';
  const tagId = '550e8400-e29b-41d4-a716-446655440101';
  const moduleId = '550e8400-e29b-41d4-a716-446655440102';
  const typeId = '550e8400-e29b-41d4-a716-446655440103';
  const equipementId = '550e8400-e29b-41d4-a716-446655440104';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      salle: { findUnique: vi.fn() },
      activityTag: { findUnique: vi.fn() },
      salleActivityTag: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), count: vi.fn(), findMany: vi.fn() },
      module: { findUnique: vi.fn() },
      typeEnseignement: { findUnique: vi.fn() },
      equipement: { findUnique: vi.fn() },
      exigenceEquipement: {
        findFirst: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    audit = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new CompatService(prisma as any, audit as any);
  });
  describe('Salle / Activity Tag', () => {
    it('should create a salle activity tag', async () => {
      const dto: CreateSalleActivityTagDto = { salleId, activityTagId: tagId };

      prisma.salle.findUnique.mockResolvedValue({ id: salleId, code: 'AMPHI-A' });
      prisma.activityTag.findUnique.mockResolvedValue({ id: tagId, code: 'PROJECTION' });
      prisma.salleActivityTag.findFirst.mockResolvedValue(null);
      prisma.salleActivityTag.create.mockResolvedValue({ salleId, activityTagId: tagId });

      const result = await service.createSalleActivityTag(dto, userId);

      expect(result).toEqual({ salleId, activityTagId: tagId });
      expect(prisma.salleActivityTag.create).toHaveBeenCalledWith({
        data: { salleId, activityTagId: tagId },
      });
      expect(audit.auditTransaction).toHaveBeenCalled();
    });

    it('should throw NotFound when salle is missing', async () => {
      const dto: CreateSalleActivityTagDto = { salleId, activityTagId: tagId };

      prisma.salle.findUnique.mockResolvedValue(null);

      await expect(service.createSalleActivityTag(dto, userId)).rejects.toThrow('Salle non trouvée');
    });

    it('should throw NotFound when tag is missing', async () => {
      const dto: CreateSalleActivityTagDto = { salleId, activityTagId: tagId };

      prisma.salle.findUnique.mockResolvedValue({ id: salleId, code: 'AMPHI-A' });
      prisma.activityTag.findUnique.mockResolvedValue(null);

      await expect(service.createSalleActivityTag(dto, userId)).rejects.toThrow('Activity tag non trouvé');
    });

    it('should throw Conflict when tag already authorized', async () => {
      const dto: CreateSalleActivityTagDto = { salleId, activityTagId: tagId };

      prisma.salle.findUnique.mockResolvedValue({ id: salleId, code: 'AMPHI-A' });
      prisma.activityTag.findUnique.mockResolvedValue({ id: tagId, code: 'PROJECTION' });
      prisma.salleActivityTag.findFirst.mockResolvedValue({ salleId, activityTagId: tagId });

      await expect(service.createSalleActivityTag(dto, userId)).rejects.toThrow('déjà autorisé');
    });

    it('should list salle activity tags with pagination', async () => {
      prisma.salleActivityTag.findMany.mockResolvedValue([{ salleId, activityTagId: tagId }]);
      prisma.salleActivityTag.count.mockResolvedValue(1);

      const result = await service.findAllSalleActivityTags({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should get a salle activity tag by ids', async () => {
      prisma.salleActivityTag.findFirst.mockResolvedValue({ salleId, activityTagId: tagId });

      const result = await service.findSalleActivityTag(salleId, tagId);

      expect(result).toEqual({ salleId, activityTagId: tagId });
    });

    it('should throw NotFound when getting missing salle activity tag', async () => {
      prisma.salleActivityTag.findFirst.mockResolvedValue(null);

      await expect(service.findSalleActivityTag(salleId, tagId)).rejects.toThrow('non trouvée');
    });

    it('should remove a salle activity tag', async () => {
      prisma.salleActivityTag.findFirst.mockResolvedValue({ salleId, activityTagId: tagId });
      prisma.salleActivityTag.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeSalleActivityTag(salleId, tagId, userId);

      expect(prisma.salleActivityTag.deleteMany).toHaveBeenCalledWith({ where: { salleId, activityTagId: tagId } });
    });

    it('should throw NotFound when removing missing salle activity tag', async () => {
      prisma.salleActivityTag.findFirst.mockResolvedValue(null);

      await expect(service.removeSalleActivityTag(salleId, tagId, userId)).rejects.toThrow('non trouvée');
    });
  });

  describe('Exigences d\'équipement', () => {
    it('should create an exigence equipement', async () => {
      const dto: CreateExigenceEquipementDto = { moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' };

      prisma.module.findUnique.mockResolvedValue({ id: moduleId, code: 'M1' });
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: typeId, code: 'CM' });
      prisma.equipement.findUnique.mockResolvedValue({ id: equipementId, code: 'VIDEOPROJ' });
      prisma.exigenceEquipement.findFirst.mockResolvedValue(null);
      prisma.exigenceEquipement.create.mockResolvedValue({ moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' });

      const result = await service.createExigenceEquipement(dto, userId);

      expect(result.niveau).toBe('OBLIGATOIRE');
      expect(prisma.exigenceEquipement.create).toHaveBeenCalledWith({
        data: { moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' },
      });
    });

    it('should default niveau to OBLIGATOIRE', async () => {
      const dto: CreateExigenceEquipementDto = { moduleId, typeEnseignementId: typeId, equipementId };

      prisma.module.findUnique.mockResolvedValue({ id: moduleId });
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: typeId });
      prisma.equipement.findUnique.mockResolvedValue({ id: equipementId });
      prisma.exigenceEquipement.findFirst.mockResolvedValue(null);
      prisma.exigenceEquipement.create.mockResolvedValue({ moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' });

      await service.createExigenceEquipement(dto, userId);

      expect(prisma.exigenceEquipement.create).toHaveBeenCalledWith({
        data: { moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' },
      });
    });

    it('should throw Conflict when exigence already exists', async () => {
      const dto: CreateExigenceEquipementDto = { moduleId, typeEnseignementId: typeId, equipementId };

      prisma.module.findUnique.mockResolvedValue({ id: moduleId });
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: typeId });
      prisma.equipement.findUnique.mockResolvedValue({ id: equipementId });
      prisma.exigenceEquipement.findFirst.mockResolvedValue({ moduleId, typeEnseignementId: typeId, equipementId });

      await expect(service.createExigenceEquipement(dto, userId)).rejects.toThrow('existe déjà');
    });

    it('should list exigences equipement with pagination and filter', async () => {
      prisma.exigenceEquipement.findMany.mockResolvedValue([{ moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' }]);
      prisma.exigenceEquipement.count.mockResolvedValue(1);

      const result = await service.findAllExigencesEquipement({ page: 1, limit: 10, moduleId });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.exigenceEquipement.findMany).toHaveBeenCalledWith({
        where: { moduleId },
        skip: 0,
        take: 10,
        orderBy: [{ moduleId: 'asc' }, { typeEnseignementId: 'asc' }, { equipementId: 'asc' }],
      });
    });

    it('should update niveau of an exigence equipement', async () => {
      prisma.exigenceEquipement.findFirst.mockResolvedValue({ moduleId, typeEnseignementId: typeId, equipementId, niveau: 'OBLIGATOIRE' });
      prisma.exigenceEquipement.updateMany.mockResolvedValue({ count: 1 });

      const dto: UpdateExigenceEquipementDto = { niveau: 'SOUHAITE' };
      const result = await service.updateExigenceEquipement(moduleId, typeId, equipementId, dto, userId);

      expect(result.niveau).toBe('SOUHAITE');
      expect(prisma.exigenceEquipement.updateMany).toHaveBeenCalledWith({
        where: { moduleId, typeEnseignementId: typeId, equipementId },
        data: { niveau: 'SOUHAITE' },
      });
    });

    it('should throw NotFound when updating missing exigence', async () => {
      prisma.exigenceEquipement.findFirst.mockResolvedValue(null);

      const dto: UpdateExigenceEquipementDto = { niveau: 'SOUHAITE' };
      await expect(service.updateExigenceEquipement(moduleId, typeId, equipementId, dto, userId)).rejects.toThrow('non trouvée');
    });

    it('should remove an exigence equipement', async () => {
      prisma.exigenceEquipement.findFirst.mockResolvedValue({ moduleId, typeEnseignementId: typeId, equipementId });
      prisma.exigenceEquipement.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeExigenceEquipement(moduleId, typeId, equipementId, userId);

      expect(prisma.exigenceEquipement.deleteMany).toHaveBeenCalledWith({ where: { moduleId, typeEnseignementId: typeId, equipementId } });
    });

    it('should throw NotFound when removing missing exigence', async () => {
      prisma.exigenceEquipement.findFirst.mockResolvedValue(null);

      await expect(service.removeExigenceEquipement(moduleId, typeId, equipementId, userId)).rejects.toThrow('non trouvée');
    });
  });
});

