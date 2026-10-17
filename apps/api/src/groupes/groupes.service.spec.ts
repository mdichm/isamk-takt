// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Groupes (L1-04)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupesService } from './groupes.service.js';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return { PrismaClient: PrismaClientMock };
});

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('GroupesService', () => {
  let service: GroupesService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const niveauId = '550e8400-e29b-41d4-a716-446655440010';
  const semestreId = '550e8400-e29b-41d4-a716-446655440020';
  const groupeId = '550e8400-e29b-41d4-a716-446655440030';
  const parentId = '550e8400-e29b-41d4-a716-446655440040';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      niveau: { findUnique: vi.fn() },
      semestre: { findUnique: vi.fn() },
      groupe: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
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

    service = new GroupesService(prisma as any, audit as any);
  });

  describe('createGroupe', () => {
    const dto: CreateGroupeDto = {
      niveauId,
      semestreId,
      type: 'SECTION',
      code: 'INFO-L3-S1',
      libelle: 'L3 Informatique Semestre 1',
      effectif: 30,
    };

    it('should create a groupe successfully', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId, code: 'L3' });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.create.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 Informatique Semestre 1',
        effectif: 30, originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createGroupe(dto, userId);

      expect(result.id).toBe(groupeId);
      expect(result.code).toBe('INFO-L3-S1');
      expect(result.type).toBe('SECTION');
      expect(prisma.groupe.create).toHaveBeenCalledWith({
        data: {
          niveauId, semestreId, parentId: null,
          type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 Informatique Semestre 1', effectif: 30,
        },
      });
    });

    it('should throw NotFound when niveau does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      await expect(service.createGroupe(dto, userId)).rejects.toThrow('Niveau non trouvé');
    });

    it('should throw NotFound when semestre does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue(null);
      await expect(service.createGroupe(dto, userId)).rejects.toThrow('Semestre non trouvé');
    });

    it('should throw Conflict when code already exists for same niveau and semestre', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue({ id: 'other', code: 'INFO-L3-S1' });
      await expect(service.createGroupe(dto, userId)).rejects.toThrow('existe déjà');
    });

    it('should throw NotFound when parent does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.findUnique.mockResolvedValue(null);
      const dtoWithParent: CreateGroupeDto = { ...dto, parentId };
      await expect(service.createGroupe(dtoWithParent, userId)).rejects.toThrow('Groupe parent non trouvé');
    });

    it('should throw Conflict when parent belongs to a different niveau', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.findUnique.mockResolvedValue({ id: parentId, niveauId: 'other-niveau' });
      const dtoWithParent: CreateGroupeDto = { ...dto, parentId };
      await expect(service.createGroupe(dtoWithParent, userId)).rejects.toThrow('même niveau');
    });
  });

  describe('findAllGroupes', () => {
    it('should list groupes with pagination', async () => {
      const groupes = [
        { id: 'g1', niveauId, semestreId, parentId: null, type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30, originId: null, createdAt: new Date(), updatedAt: new Date() },
      ];
      prisma.groupe.findMany.mockResolvedValue(groupes);
      prisma.groupe.count.mockResolvedValue(1);

      const result = await service.findAllGroupes({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findGroupeById', () => {
    it('should return a groupe by id', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.findGroupeById(groupeId);

      expect(result.id).toBe(groupeId);
      expect(result.code).toBe('INFO-L3-S1');
    });

    it('should throw NotFound when groupe does not exist', async () => {
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(service.findGroupeById(groupeId)).rejects.toThrow('non trouvé');
    });
  });

  describe('updateGroupe', () => {
    const updateDto: UpdateGroupeDto = { code: 'INFO-L3-S2', libelle: 'L3 S2', effectif: 35 };

    it('should update a groupe successfully', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.update.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S2', libelle: 'L3 S2', effectif: 35,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.updateGroupe(groupeId, updateDto, userId);

      expect(result.code).toBe('INFO-L3-S2');
      expect(result.effectif).toBe(35);
    });

    it('should throw Conflict when new code already exists', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.groupe.findFirst.mockResolvedValue({ id: 'other', code: 'INFO-L3-S2' });
      await expect(service.updateGroupe(groupeId, updateDto, userId)).rejects.toThrow('existe déjà');
    });

    it('should throw Conflict when creating a cycle via parent', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      vi.spyOn(service as any, 'isDescendantOf').mockResolvedValue(true);
      const dtoWithParent: UpdateGroupeDto = { ...updateDto, parentId };
      await expect(service.updateGroupe(groupeId, dtoWithParent, userId)).rejects.toThrow('cycle');
    });
  });

  describe('removeGroupe', () => {
    it('should delete a groupe with no children', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.groupe.count.mockResolvedValue(0);

      await expect(service.removeGroupe(groupeId, userId)).resolves.toBeUndefined();
      expect(prisma.groupe.delete).toHaveBeenCalledWith({ where: { id: groupeId } });
    });

    it('should throw Conflict when groupe has children', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'L3 S1', effectif: 30,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.groupe.count.mockResolvedValue(2);
      await expect(service.removeGroupe(groupeId, userId)).rejects.toThrow('sous-groupes');
    });
  });

  describe('getClosure', () => {
    it('should return soi, ancetres and descendants', async () => {
      const groupe = {
        id: groupeId, niveauId, semestreId, parentId,
        type: 'GROUPE', code: 'INFO-L3-S1-G1', libelle: 'Groupe 1', effectif: 15,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      };
      const parent = {
        id: parentId, niveauId, semestreId, parentId: null,
        type: 'SECTION', code: 'INFO-L3-S1', libelle: 'Section', effectif: 45,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      };
      const enfant = {
        id: 'enfant-1', niveauId, semestreId, parentId: groupeId,
        type: 'SOUS_GROUPE', code: 'INFO-L3-S1-G1-SG1', libelle: 'Sous-groupe 1', effectif: 8,
        originId: null, createdAt: new Date(), updatedAt: new Date(),
      };

      prisma.groupe.findUnique
        .mockResolvedValueOnce(groupe)
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce(null);
      prisma.groupe.findMany.mockResolvedValue([enfant]);

      const result = await service.getClosure(groupeId);

      expect(result.soi.id).toBe(groupeId);
      expect(result.ancetres).toHaveLength(1);
      expect(result.ancetres[0].id).toBe(parentId);
      expect(result.descendants).toHaveLength(1);
      expect(result.descendants[0].id).toBe('enfant-1');
    });
  });
});