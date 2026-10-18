// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Groupes (L1-04, L1-08)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { GroupesService } from './groupes.service.js';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto.js';
import { DuplicateGroupesDto } from './dto/groupe-duplicate.dto.js';

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
      prisma.semestre.findUnique.mockResolvedValue({
        id: semestreId,
        numero: 1,
      });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.create.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 Informatique Semestre 1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createGroupe(dto, userId);

      expect(result.id).toBe(groupeId);
      expect(result.code).toBe('INFO-L3-S1');
      expect(result.type).toBe('SECTION');
      expect(prisma.groupe.create).toHaveBeenCalledWith({
        data: {
          niveauId,
          semestreId,
          parentId: null,
          type: 'SECTION',
          code: 'INFO-L3-S1',
          libelle: 'L3 Informatique Semestre 1',
          effectif: 30,
          ordre: 0,
        },
      });
    });

    it('should throw NotFound when niveau does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      await expect(service.createGroupe(dto, userId)).rejects.toThrow(
        'Niveau non trouvé',
      );
    });

    it('should throw NotFound when semestre does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue(null);
      await expect(service.createGroupe(dto, userId)).rejects.toThrow(
        'Semestre non trouvé',
      );
    });

    it('should throw Conflict when code already exists for same niveau and semestre', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue({
        id: 'other',
        code: 'INFO-L3-S1',
      });
      await expect(service.createGroupe(dto, userId)).rejects.toThrow(
        'existe déjà',
      );
    });

    it('should throw NotFound when parent does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.findUnique.mockResolvedValue(null);
      const dtoWithParent: CreateGroupeDto = { ...dto, parentId };
      await expect(service.createGroupe(dtoWithParent, userId)).rejects.toThrow(
        'Groupe parent non trouvé',
      );
    });

    it('should throw Conflict when parent belongs to a different niveau', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: niveauId });
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.findUnique.mockResolvedValue({
        id: parentId,
        niveauId: 'other-niveau',
      });
      const dtoWithParent: CreateGroupeDto = { ...dto, parentId };
      await expect(service.createGroupe(dtoWithParent, userId)).rejects.toThrow(
        'même niveau',
      );
    });
  });

  describe('findAllGroupes', () => {
    it('should list groupes with pagination', async () => {
      const groupes = [
        {
          id: 'g1',
          niveauId,
          semestreId,
          parentId: null,
          type: 'SECTION',
          code: 'INFO-L3-S1',
          libelle: 'L3 S1',
          effectif: 30,
          originId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findGroupeById(groupeId);

      expect(result.id).toBe(groupeId);
      expect(result.code).toBe('INFO-L3-S1');
    });

    it('should throw NotFound when groupe does not exist', async () => {
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(service.findGroupeById(groupeId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });

  describe('updateGroupe', () => {
    const updateDto: UpdateGroupeDto = {
      code: 'INFO-L3-S2',
      libelle: 'L3 S2',
      effectif: 35,
    };

    it('should update a groupe successfully', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.update.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S2',
        libelle: 'L3 S2',
        effectif: 35,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateGroupe(groupeId, updateDto, userId);

      expect(result.code).toBe('INFO-L3-S2');
      expect(result.effectif).toBe(35);
    });

    it('should throw Conflict when new code already exists', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.groupe.findFirst.mockResolvedValue({
        id: 'other',
        code: 'INFO-L3-S2',
      });
      await expect(
        service.updateGroupe(groupeId, updateDto, userId),
      ).rejects.toThrow('existe déjà');
    });

    it('should throw Conflict when creating a cycle via parent', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(service as any, 'isDescendantOf').mockResolvedValue(true);
      const dtoWithParent: UpdateGroupeDto = { ...updateDto, parentId };
      await expect(
        service.updateGroupe(groupeId, dtoWithParent, userId),
      ).rejects.toThrow('cycle');
    });
  });

  describe('removeGroupe', () => {
    it('should delete a groupe with no children', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.groupe.count.mockResolvedValue(0);

      await expect(
        service.removeGroupe(groupeId, userId),
      ).resolves.toBeUndefined();
      expect(prisma.groupe.delete).toHaveBeenCalledWith({
        where: { id: groupeId },
      });
    });

    it('should throw Conflict when groupe has children', async () => {
      prisma.groupe.findUnique.mockResolvedValue({
        id: groupeId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'L3 S1',
        effectif: 30,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.groupe.count.mockResolvedValue(2);
      await expect(service.removeGroupe(groupeId, userId)).rejects.toThrow(
        'sous-groupes',
      );
    });
  });

  describe('getClosure', () => {
    it('should return soi, ancetres and descendants', async () => {
      const groupe = {
        id: groupeId,
        niveauId,
        semestreId,
        parentId,
        type: 'GROUPE',
        code: 'INFO-L3-S1-G1',
        libelle: 'Groupe 1',
        effectif: 15,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const parent = {
        id: parentId,
        niveauId,
        semestreId,
        parentId: null,
        type: 'SECTION',
        code: 'INFO-L3-S1',
        libelle: 'Section',
        effectif: 45,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const enfant = {
        id: 'enfant-1',
        niveauId,
        semestreId,
        parentId: groupeId,
        type: 'SOUS_GROUPE',
        code: 'INFO-L3-S1-G1-SG1',
        libelle: 'Sous-groupe 1',
        effectif: 8,
        originId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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

  describe('codeSuggestion', () => {
    it('should suggest L3-INFO-1 when no groupe exists yet', async () => {
      prisma.niveau.findUnique.mockResolvedValue({
        id: niveauId,
        code: 'L3',
        formation: { departement: { id: 'dep-info', code: 'INFO' } },
      });
      prisma.groupe.findMany.mockResolvedValue([]);

      const result = await service.codeSuggestion(niveauId);

      expect(result.suggestedCode).toBe('L3-INFO-1');
      expect(result.niveauCode).toBe('L3');
      expect(result.departementCode).toBe('INFO');
      expect(result.departementId).toBe('dep-info');
      expect(prisma.groupe.findMany).toHaveBeenCalledWith({
        where: { niveauId },
        select: { code: true },
      });
    });

    it('should suggest the next free segment 3 skipping used codes', async () => {
      prisma.niveau.findUnique.mockResolvedValue({
        id: niveauId,
        code: 'L3',
        formation: { departement: { id: 'dep-info', code: 'INFO' } },
      });
      prisma.groupe.findMany.mockResolvedValue([
        { code: 'L3-INFO-1' },
        { code: 'L3-INFO-2' },
        { code: 'L3-INFO-4' },
      ]);

      const result = await service.codeSuggestion(niveauId, semestreId);

      expect(result.suggestedCode).toBe('L3-INFO-3');
      expect(prisma.groupe.findMany).toHaveBeenCalledWith({
        where: { niveauId, semestreId },
        select: { code: true },
      });
    });

    it('should throw NotFound when niveau does not exist', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      await expect(service.codeSuggestion(niveauId)).rejects.toThrow(
        'Niveau non trouvé',
      );
    });
  });

  describe('duplicateGroupes', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const niveauId = '550e8400-e29b-41d4-a716-446655440010';
    const groupeId = '550e8400-e29b-41d4-a716-446655440030';
    const sourceSemestreId = '550e8400-e29b-41d4-a716-446655440020';
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440025';
    const enfantId = '550e8400-e29b-41d4-a716-446655440050';
    const petitEnfantId = '550e8400-e29b-41d4-a716-446655440055';

    const dto: DuplicateGroupesDto = {
      sourceSemestreId,
      cibleSemestreId,
      reinitialiserEffectifs: false,
    };

    const section = {
      id: groupeId,
      niveauId,
      semestreId: sourceSemestreId,
      parentId: null,
      type: 'SECTION' as const,
      code: 'INFO-L3-S1',
      libelle: 'L3 Informatique Semestre 1',
      effectif: 30,
      originId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const enfant = {
      id: enfantId,
      niveauId,
      semestreId: sourceSemestreId,
      parentId: groupeId,
      type: 'GROUPE' as const,
      code: 'INFO-L3-S1-G1',
      libelle: 'Groupe 1',
      effectif: 15,
      originId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const petitEnfant = {
      id: petitEnfantId,
      niveauId,
      semestreId: sourceSemestreId,
      parentId: enfantId,
      type: 'SOUS_GROUPE' as const,
      code: 'INFO-L3-S1-G1-SG1',
      libelle: 'Sous-groupe 1',
      effectif: 8,
      originId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const creeSection = {
      ...section,
      id: 'cible-section-1',
      semestreId: cibleSemestreId,
      originId: groupeId,
    };
    const creeEnfant = {
      ...enfant,
      id: 'cible-enfant-1',
      semestreId: cibleSemestreId,
      parentId: 'cible-section-1',
      originId: enfantId,
    };
    const creePetitEnfant = {
      ...petitEnfant,
      id: 'cible-sous-1',
      semestreId: cibleSemestreId,
      parentId: 'cible-enfant-1',
      originId: petitEnfantId,
    };

    beforeEach(() => {
      prisma.semestre.findUnique
        .mockResolvedValueOnce({ id: sourceSemestreId, numero: 1 })
        .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    });

    it('should duplicate parents before children with mapped parent ids and originId', async () => {
      // Ordre volontairement mélangé en entrée : le tris parents-enfants doit s'appliquer
      prisma.groupe.findMany.mockResolvedValue([section, petitEnfant, enfant]);
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.create
        .mockResolvedValueOnce(creeSection)
        .mockResolvedValueOnce(creeEnfant)
        .mockResolvedValueOnce(creePetitEnfant);

      const result = await service.duplicateGroupes(dto, userId);

      expect(result.crees).toHaveLength(3);
      expect(result.ignorés).toHaveLength(0);
      expect(result.avertissements).toHaveLength(0);

      const appels = prisma.groupe.create.mock.calls.map(
        (appel: any) => appel[0].data,
      );
      expect(appels[0].parentId).toBeNull();
      expect(appels[0].originId).toBe(groupeId);
      expect(appels[0].semestreId).toBe(cibleSemestreId);
      expect(appels[0].effectif).toBe(30);
      expect(appels[1].parentId).toBe('cible-section-1');
      expect(appels[1].originId).toBe(enfantId);
      expect(appels[2].parentId).toBe('cible-enfant-1');
      expect(appels[2].originId).toBe(petitEnfantId);
      expect(appels.map((data: any) => data.originId)).toEqual([
        groupeId,
        enfantId,
        petitEnfantId,
      ]);
    });

    it('should ignore groupes already duplicated (idempotence via originId)', async () => {
      const dejaDuplique = { ...creeSection, originId: groupeId };
      prisma.groupe.findMany.mockResolvedValue([section]);
      prisma.groupe.findFirst.mockResolvedValue(dejaDuplique);

      const result = await service.duplicateGroupes(dto, userId);

      expect(result.crees).toHaveLength(0);
      expect(result.ignorés).toHaveLength(1);
      expect(result.ignorés[0].id).toBe('cible-section-1');
      expect(prisma.groupe.create).not.toHaveBeenCalled();
    });

    it('should reinitialize effectifs to 0 and emit warnings when flag is set', async () => {
      prisma.groupe.findMany.mockResolvedValue([section]);
      prisma.groupe.findFirst.mockResolvedValue(null);
      prisma.groupe.create.mockResolvedValueOnce(creeSection);

      const result = await service.duplicateGroupes(
        { ...dto, reinitialiserEffectifs: true },
        userId,
      );

      const appels = prisma.groupe.create.mock.calls.map(
        (appel: any) => appel[0].data,
      );
      expect(appels[0].effectif).toBe(0);
      expect(result.avertissements).toHaveLength(1);
      expect(result.avertissements[0]).toContain('Effectif réinitialisé à 0');
    });

    it('should throw Conflict when the same code exists with a different originId', async () => {
      const bloquant = {
        ...section,
        id: 'autre-id-cible',
        originId: 'autre-origin',
      };
      prisma.groupe.findMany.mockResolvedValue([section]);
      prisma.groupe.findFirst.mockResolvedValue(bloquant);

      await expect(service.duplicateGroupes(dto, userId)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.groupe.create).not.toHaveBeenCalled();
    });

    it('should throw NotFound when the source semestre does not exist', async () => {
      prisma.semestre.findUnique.mockReset();
      prisma.semestre.findUnique.mockResolvedValue(null);
      await expect(service.duplicateGroupes(dto, userId)).rejects.toThrow(
        'Semestre source non trouvé',
      );
    });

    it('should throw NotFound when the cible semestre does not exist', async () => {
      prisma.semestre.findUnique.mockReset();
      prisma.semestre.findUnique
        .mockResolvedValueOnce({ id: sourceSemestreId, numero: 1 })
        .mockResolvedValueOnce(null);
      await expect(service.duplicateGroupes(dto, userId)).rejects.toThrow(
        'Semestre cible non trouvé',
      );
    });
  });
});
