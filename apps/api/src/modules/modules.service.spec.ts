// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Modules/Types/Grades (L1-05)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModulesService } from './modules.service.js';
import {
  CreateTypeEnseignementDto,
  UpdateTypeEnseignementDto,
  CreateGradeDto,
  UpdateGradeDto,
  CreateModuleDto,
  UpdateModuleDto,
} from './dto/module.dto.js';
import {
  CreateModuleVolumeDto,
  UpdateModuleVolumeDto,
} from './dto/volume.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return { PrismaClient: PrismaClientMock };
});

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('ModulesService', () => {
  let service: ModulesService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const niveauId = '550e8400-e29b-41d4-a716-446655440010';
  const typeId = '550e8400-e29b-41d4-a716-446655440020';
  const gradeId = '550e8400-e29b-41d4-a716-446655440030';
  const moduleId = '550e8400-e29b-41d4-a716-446655440040';
  const volumeId = '550e8400-e29b-41d4-a716-446655440050';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      $transaction: vi.fn(async ([tx1, tx2]) => {
        const [res1, res2] = await Promise.all([
          tx1,
          tx2 instanceof Function ? tx2(prisma) : tx2,
        ]);
        return [res1, res2];
      }),
      typeEnseignement: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      grade: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      niveau: {
        findUnique: vi.fn(),
      },
      module: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      moduleVolume: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new ModulesService(prisma as any, audit as any);
  });

  // ============================================
  // Types d'enseignement
  // ============================================

  describe('createTypeEnseignement', () => {
    const dto: CreateTypeEnseignementDto = {
      code: 'CM',
      libelle: 'Cours magistral',
    };

    it('should create a type d\'enseignement successfully', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue(null);
      prisma.typeEnseignement.create.mockResolvedValue({
        id: typeId,
        code: 'CM',
        libelle: 'Cours magistral',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTypeEnseignement(dto, userId);

      expect(result.id).toBe(typeId);
      expect(result.code).toBe('CM');
      expect(prisma.typeEnseignement.create).toHaveBeenCalledWith({
        data: { code: 'CM', libelle: 'Cours magistral' },
      });
    });

    it('should throw Conflict when code already exists', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: 'other', code: 'CM', libelle: 'CM existant',
      });
      await expect(service.createTypeEnseignement(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('findAllTypesEnseignement', () => {
    it('should return all types ordered by code', async () => {
      prisma.typeEnseignement.findMany.mockResolvedValue([
        { id: typeId, code: 'CM', libelle: 'Cours magistral', createdAt: new Date(), updatedAt: new Date() },
        { id: 'other', code: 'TD', libelle: 'Travaux dirigés', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.findAllTypesEnseignement();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('CM');
    });
  });

  describe('updateTypeEnseignement', () => {
    it('should update a type d\'enseignement', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: typeId, code: 'CM', libelle: 'Cours magistral',
      });
      prisma.typeEnseignement.update.mockResolvedValue({
        id: typeId, code: 'CM', libelle: 'Cours magistral (revue)',
        createdAt: new Date(), updatedAt: new Date(),
      });

      const dto: UpdateTypeEnseignementDto = { libelle: 'Cours magistral (revue)' };
      const result = await service.updateTypeEnseignement(typeId, dto, userId);

      expect(result.libelle).toBe('Cours magistral (revue)');
    });

    it('should throw NotFound when type does not exist', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue(null);
      await expect(service.updateTypeEnseignement(typeId, {}, userId)).rejects.toThrow('non trouvé');
    });
  });

  describe('removeTypeEnseignement', () => {
    it('should delete a type with no modules', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: typeId, code: 'CM', modules: [],
      });

      await expect(service.removeTypeEnseignement(typeId, userId)).resolves.toBeUndefined();
      expect(prisma.typeEnseignement.delete).toHaveBeenCalledWith({ where: { id: typeId } });
    });

    it('should throw Conflict when type has modules', async () => {
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: typeId, code: 'CM', modules: [{ id: moduleId }],
      });
      await expect(service.removeTypeEnseignement(typeId, userId)).rejects.toThrow('modules');
    });

  // ============================================
  // Grades
  // ============================================

  describe('createGrade', () => {
    const dto: CreateGradeDto = {
      code: 'MCF',
      libelle: 'Maître de conférences',
    };

    it('should create a grade successfully', async () => {
      prisma.grade.findUnique.mockResolvedValue(null);
      prisma.grade.create.mockResolvedValue({
        id: gradeId, code: 'MCF', libelle: 'Maître de conférences',
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createGrade(dto, userId);

      expect(result.id).toBe(gradeId);
      expect(result.code).toBe('MCF');
    });

    it('should throw Conflict when code already exists', async () => {
      prisma.grade.findUnique.mockResolvedValue({ id: 'other', code: 'MCF' });
      await expect(service.createGrade(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('findAllGrades', () => {
    it('should return all grades ordered by code', async () => {
      prisma.grade.findMany.mockResolvedValue([
        { id: gradeId, code: 'MC', libelle: 'MC', createdAt: new Date(), updatedAt: new Date() },
        { id: 'other', code: 'PR', libelle: 'PR', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.findAllGrades();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('MC');
    });
  });

  describe('updateGrade', () => {
    it('should update a grade', async () => {
      prisma.grade.findUnique
        .mockResolvedValueOnce({ id: gradeId, code: 'MCF', libelle: 'Maître de conférences' })
        .mockResolvedValueOnce(null);
      prisma.grade.update.mockResolvedValue({
        id: gradeId, code: 'PR', libelle: 'Professeur',
        createdAt: new Date(), updatedAt: new Date(),
      });

      const dto: UpdateGradeDto = { code: 'PR', libelle: 'Professeur' };
      const result = await service.updateGrade(gradeId, dto, userId);

      expect(result.code).toBe('PR');
    });

    it('should throw NotFound when grade does not exist', async () => {
      prisma.grade.findUnique.mockResolvedValue(null);
      await expect(service.updateGrade(gradeId, {}, userId)).rejects.toThrow('non trouvé');
    });
  });

  describe('removeGrade', () => {
    it('should delete a grade with no modules', async () => {
      prisma.grade.findUnique.mockResolvedValue({
        id: gradeId, code: 'MCF', modules: [],
      });

      await expect(service.removeGrade(gradeId, userId)).resolves.toBeUndefined();
      expect(prisma.grade.delete).toHaveBeenCalledWith({ where: { id: gradeId } });
    });

    it('should throw Conflict when grade has modules', async () => {
      prisma.grade.findUnique.mockResolvedValue({
        id: gradeId, code: 'MCF', modules: [{ id: moduleId }],
      });
      await expect(service.removeGrade(gradeId, userId)).rejects.toThrow('modules');
    });
  });

  // ============================================
  // Modules
  // ============================================

  describe('createModule', () => {
    const dto: CreateModuleDto = {
      niveauId,
      typeId,
      code: 'INFO301',
      libelle: 'Algorithmique avancée',
      semestreNumero: 1,
      credits: 6,
    };

    it('should create a module successfully', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId, code: 'L3' });
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: typeId, code: 'CM' });
      prisma.module.findFirst.mockResolvedValue(null);
      prisma.module.create.mockResolvedValue({
        id: moduleId, niveauId, typeId, gradeId: null,
        code: 'INFO301', libelle: 'Algorithmique avancée',
        semestreNumero: 1, credits: 6, effectifMax: null,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createModule(dto, userId);

      expect(result.id).toBe(moduleId);
      expect(result.code).toBe('INFO301');
      expect(prisma.module.create).toHaveBeenCalledWith({
        data: {
          niveauId, typeId, gradeId: null,
          code: 'INFO301', libelle: 'Algorithmique avancée',
          semestreNumero: 1, credits: 6, effectifMax: null,
        },
      });
    });

    it('should throw NotFound when niveau does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      await expect(service.createModule(dto, userId)).rejects.toThrow('Niveau non trouvé');
    });

    it('should throw NotFound when type does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.typeEnseignement.findUnique.mockResolvedValue(null);
      await expect(service.createModule(dto, userId)).rejects.toThrow('Type d\'enseignement non trouvé');
    });

    it('should throw Conflict when code already exists for same niveau and semestre', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: typeId });
      prisma.module.findFirst.mockResolvedValue({ id: 'other', code: 'INFO301' });
      await expect(service.createModule(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('findAllModules', () => {
    it('should return paginated modules', async () => {
      prisma.module.findMany.mockResolvedValue([
        { id: moduleId, niveauId, typeId, gradeId: null, code: 'INFO301', libelle: 'Algo', semestreNumero: 1, credits: 6, effectifMax: null, originId: null, createdAt: new Date(), updatedAt: new Date(), type: { id: typeId, code: 'CM' }, grade: null },
      ]);
      prisma.module.count.mockResolvedValue(1);

      const result = await service.findAllModules({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findModuleById', () => {
    it('should return a module by id', async () => {
      prisma.module.findUnique.mockResolvedValue({
        id: moduleId, niveauId, typeId, gradeId: null,
        code: 'INFO301', libelle: 'Algo', semestreNumero: 1, credits: 6,
        effectifMax: null, originId: null, createdAt: new Date(), updatedAt: new Date(),
        type: { id: typeId, code: 'CM' }, grade: null,
      });

      const result = await service.findModuleById(moduleId);

      expect(result.id).toBe(moduleId);
      expect(result.code).toBe('INFO301');
    });

    it('should throw NotFound when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(service.findModuleById(moduleId)).rejects.toThrow('non trouvé');
    });
  });

  describe('updateModule', () => {
    it('should update a module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        id: moduleId, niveauId, typeId, gradeId: null,
        code: 'INFO301', libelle: 'Algo', semestreNumero: 1, credits: 6,
        effectifMax: null, originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.module.update.mockResolvedValue({
        id: moduleId, niveauId, typeId, gradeId: null,
        code: 'INFO301', libelle: 'Algo avancé', semestreNumero: 1, credits: 6,
        effectifMax: null, originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const dto: UpdateModuleDto = { libelle: 'Algo avancé' };
      const result = await service.updateModule(moduleId, dto, userId);

      expect(result.libelle).toBe('Algo avancé');
    });

    it('should throw NotFound when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(service.updateModule(moduleId, {}, userId)).rejects.toThrow('non trouvé');
    });
  });

  describe('removeModule', () => {
    it('should delete a module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        id: moduleId, code: 'INFO301',
      });

      await expect(service.removeModule(moduleId, userId)).resolves.toBeUndefined();
      expect(prisma.module.delete).toHaveBeenCalledWith({ where: { id: moduleId } });
    });

    it('should throw NotFound when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(service.removeModule(moduleId, userId)).rejects.toThrow('non trouvé');
    });
  });

  // ============================================
  // Module Volumes (L2-01)
  // ============================================

  describe('createModuleVolume', () => {
    it('should create a module volume', async () => {
      prisma.module.findUnique.mockResolvedValue({ id: moduleId });
      prisma.moduleVolume.findUnique.mockResolvedValue(null);
      prisma.moduleVolume.create.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'CM',
        volume: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: CreateModuleVolumeDto = {
        moduleId,
        type: 'CM',
        volume: 90,
      };
      const result = await service.createModuleVolume(moduleId, dto, userId);

      expect(result.id).toBe(volumeId);
      expect(result.type).toBe('CM');
      expect(result.volume).toBe(90);
    });

    it('should throw NotFound when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(
        service.createModuleVolume(moduleId, { moduleId, type: 'CM', volume: 90 }, userId),
      ).rejects.toThrow('non trouvé');
    });

    it('should throw Conflict when volume already exists for type', async () => {
      prisma.module.findUnique.mockResolvedValue({ id: moduleId });
      prisma.moduleVolume.findUnique.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'CM',
        volume: 90,
      });
      await expect(
        service.createModuleVolume(moduleId, { moduleId, type: 'CM', volume: 90 }, userId),
      ).rejects.toThrow('existe déjà');
    });

    it('should throw Conflict when volume is not multiple of 30', async () => {
      prisma.module.findUnique.mockResolvedValue({ id: moduleId });
      prisma.moduleVolume.findUnique.mockResolvedValue(null);
      await expect(
        service.createModuleVolume(moduleId, { moduleId, type: 'CM', volume: 45 }, userId),
      ).rejects.toThrow('multiple de 30');
    });
  });

  describe('findModuleVolumes', () => {
    it('should list module volumes', async () => {
      prisma.moduleVolume.findMany.mockResolvedValue([
        {
          id: volumeId,
          moduleId,
          type: 'CM',
          volume: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      prisma.moduleVolume.count.mockResolvedValue(1);

      const result = await service.findModuleVolumes(moduleId, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('CM');
    });
  });

  describe('findModuleVolumeById', () => {
    it('should get module volume by ID', async () => {
      prisma.moduleVolume.findUnique.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'TD',
        volume: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findModuleVolumeById(volumeId);

      expect(result.id).toBe(volumeId);
      expect(result.type).toBe('TD');
    });

    it('should throw NotFound when volume does not exist', async () => {
      prisma.moduleVolume.findUnique.mockResolvedValue(null);
      await expect(service.findModuleVolumeById(volumeId)).rejects.toThrow('non trouvé');
    });
  });

  describe('updateModuleVolume', () => {
    it('should update a module volume', async () => {
      prisma.moduleVolume.findUnique.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'CM',
        volume: 90,
      });
      prisma.moduleVolume.update.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'CM',
        volume: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: UpdateModuleVolumeDto = { volume: 120 };
      const result = await service.updateModuleVolume(volumeId, dto, userId);

      expect(result.volume).toBe(120);
    });
  });

  describe('removeModuleVolume', () => {
    it('should delete a module volume', async () => {
      prisma.moduleVolume.findUnique.mockResolvedValue({
        id: volumeId,
        moduleId,
        type: 'CM',
        volume: 90,
      });

      await expect(service.removeModuleVolume(volumeId, userId)).resolves.toBeUndefined();
      expect(prisma.moduleVolume.delete).toHaveBeenCalledWith({ where: { id: volumeId } });
    });

    it('should throw NotFound when deleting non-existent volume', async () => {
      prisma.moduleVolume.findUnique.mockResolvedValue(null);
      await expect(service.removeModuleVolume(volumeId, userId)).rejects.toThrow('non trouvé');
    });
  });
});
  });