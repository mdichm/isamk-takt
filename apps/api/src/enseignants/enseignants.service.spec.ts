// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Enseignants (L1-07)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnseignantsService } from './enseignants.service.js';
import {
  CreateEnseignantDto,
  UpdateEnseignantDto,
  AssignModulesDto,
} from './dto/enseignant.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('EnseignantsService', () => {
  let service: EnseignantsService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const enseignantId = '550e8400-e29b-41d4-a716-446655440010';
  const anneeId = '550e8400-e29b-41d4-a716-446655440020';
  const departementId = '550e8400-e29b-41d4-a716-446655440030';
  const gradeId = '550e8400-e29b-41d4-a716-446655440040';
  const moduleId = '550e8400-e29b-41d4-a716-446655440050';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      enseignant: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      enseignantModule: {
        createMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      module: {
        findMany: vi.fn(),
      },
      annee: {
        findUnique: vi.fn(),
      },
      departement: {
        findUnique: vi.fn(),
      },
      grade: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async ([tx1, tx2]) => {
        const [res1, res2] = await Promise.all([
          tx1,
          tx2 instanceof Function ? tx2(prisma) : tx2,
        ]);
        return [res1, res2];
      }),
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new EnseignantsService(prisma, audit);
  });

  describe('createEnseignant', () => {
    it('devrait créer un enseignant', async () => {
      const dto: CreateEnseignantDto = {
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        anneeId,
        departementId,
        gradeId,
        moduleIds: [moduleId],
      };

      prisma.enseignant.findFirst.mockResolvedValue(null);
      prisma.enseignant.findUnique.mockResolvedValueOnce(null);
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId, anneeId });
      prisma.grade.findUnique.mockResolvedValue({ id: gradeId });
      prisma.enseignant.create.mockResolvedValue({ id: enseignantId });
      prisma.enseignantModule.createMany.mockResolvedValue({ count: 1 });
      prisma.enseignant.findUnique.mockResolvedValueOnce({
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        telephone: null,
        isActive: true,
        anneeId,
        departementId,
        gradeId,
        enseignantModules: [{ moduleId }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createEnseignant(dto, userId);

      expect(result.matricule).toBe('E12345');
      expect(result.moduleIds).toContain(moduleId);
      expect(prisma.enseignant.create).toHaveBeenCalled();
    });

    it('devrait lever ConflictException si le matricule existe déjà', async () => {
      const dto: CreateEnseignantDto = {
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        anneeId,
        departementId,
      };

      prisma.enseignant.findFirst.mockResolvedValue({ id: enseignantId, matricule: 'E12345' });

      await expect(service.createEnseignant(dto, userId)).rejects.toThrow(
        'existe déjà',
      );
    });

    it('devrait lever ConflictException si l’email existe déjà', async () => {
      const dto: CreateEnseignantDto = {
        matricule: 'E12346',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        anneeId,
        departementId,
      };

      prisma.enseignant.findFirst.mockResolvedValue(null);
      prisma.enseignant.findUnique.mockResolvedValue({ id: 'other', email: 'jean.dupont@univ.fr' });

      await expect(service.createEnseignant(dto, userId)).rejects.toThrow(
        'déjà utilisé',
      );
    });
  });

  describe('findAllEnseignants', () => {
    it('devrait retourner une liste paginée', async () => {
      const enseignants = [
        {
          id: enseignantId,
          matricule: 'E12345',
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@univ.fr',
          telephone: null,
          isActive: true,
          anneeId,
          departementId,
          gradeId,
          enseignantModules: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.enseignant.findMany.mockResolvedValue(enseignants);
      prisma.enseignant.count.mockResolvedValue(1);

      const result = await service.findAllEnseignants({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findEnseignantById', () => {
    it('devrait retourner l’enseignant trouvé', async () => {
      const expected = {
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        telephone: null,
        isActive: true,
        anneeId,
        departementId,
        gradeId,
        moduleIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.enseignant.findUnique.mockResolvedValue({
        ...expected,
        enseignantModules: [],
      });

      const result = await service.findEnseignantById(enseignantId);

      expect(result).toEqual(expected);
    });

    it('devrait lever NotFoundException si l’enseignant n’existe pas', async () => {
      prisma.enseignant.findUnique.mockResolvedValue(null);

      await expect(service.findEnseignantById(enseignantId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });

  describe('updateEnseignant', () => {
    it('devrait mettre à jour l’enseignant', async () => {
      const existing = {
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        anneeId,
        departementId,
        gradeId,
      };
      const dto: UpdateEnseignantDto = { nom: 'Martin' };

      prisma.enseignant.findUnique.mockResolvedValueOnce(existing);
      prisma.enseignant.findFirst.mockResolvedValue(null);
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId, anneeId });
      prisma.enseignant.update.mockResolvedValue({ ...existing, nom: 'Martin', enseignantModules: [] });
      prisma.enseignant.findUnique.mockResolvedValueOnce({
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Martin',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        telephone: null,
        isActive: true,
        anneeId,
        departementId,
        gradeId,
        enseignantModules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateEnseignant(enseignantId, dto, userId);

      expect(result.nom).toBe('Martin');
    });

    it('devrait lever NotFoundException si l’enseignant n’existe pas', async () => {
      prisma.enseignant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEnseignant(enseignantId, { nom: 'Martin' }, userId),
      ).rejects.toThrow('non trouvé');
    });
  });

  describe('removeEnseignant', () => {
    it('devrait désactiver l’enseignant', async () => {
      const existing = {
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        enseignantModules: [],
      };

      prisma.enseignant.findUnique.mockResolvedValue(existing);

      await service.removeEnseignant(enseignantId, userId);

      expect(prisma.enseignant.update).toHaveBeenCalledWith({
        where: { id: enseignantId },
        data: { isActive: false },
      });
    });

    it('devrait lever NotFoundException si l’enseignant n’existe pas', async () => {
      prisma.enseignant.findUnique.mockResolvedValue(null);

      await expect(service.removeEnseignant(enseignantId, userId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });

  describe('assignModules', () => {
    it('devrait assigner des modules à l’enseignant', async () => {
      const dto: AssignModulesDto = { moduleIds: [moduleId] };

      prisma.enseignant.findUnique.mockResolvedValueOnce({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.module.findMany.mockResolvedValue([{ id: moduleId }]);
      prisma.enseignantModule.createMany.mockResolvedValue({ count: 1 });
      prisma.enseignant.findUnique.mockResolvedValueOnce({
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@univ.fr',
        telephone: null,
        isActive: true,
        anneeId,
        departementId,
        gradeId,
        enseignantModules: [{ moduleId }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.assignModules(enseignantId, dto, userId);

      expect(result.moduleIds).toContain(moduleId);
      expect(prisma.enseignantModule.createMany).toHaveBeenCalled();
    });

    it('devrait lever NotFoundException si un module est introuvable', async () => {
      const dto: AssignModulesDto = { moduleIds: ['nonexistent-id'] };

      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.module.findMany.mockResolvedValue([]);

      await expect(service.assignModules(enseignantId, dto, userId)).rejects.toThrow(
        'introuvables',
      );
    });
  });

  describe('unassignModule', () => {
    it('devrait désassigner un module', async () => {
      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.enseignantModule.findUnique.mockResolvedValue({
        enseignantId,
        moduleId,
      });
      prisma.enseignantModule.delete.mockResolvedValue({});

      await service.unassignModule(enseignantId, moduleId, userId);

      expect(prisma.enseignantModule.delete).toHaveBeenCalledWith({
        where: { enseignantId_moduleId: { enseignantId, moduleId } },
      });
    });

    it('devrait lever NotFoundException si l’assignation n’existe pas', async () => {
      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.enseignantModule.findUnique.mockResolvedValue(null);

      await expect(
        service.unassignModule(enseignantId, moduleId, userId),
      ).rejects.toThrow('pas assigné');
    });
  });
});
