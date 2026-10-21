// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Repartitions (L2-06)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepartitionsService } from './repartitions.service.js';
import {
  CreateRepartitionDto,
  UpdateRepartitionDto,
} from './dto/repartition.dto.js';
import { ControleStatut, ControlesResponseDto } from './dto/repartition.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
  RepartitionStatut: { BROUILLON: 'BROUILLON', VALIDEE: 'VALIDEE', ROUVERTE: 'ROUVERTE' },
}));

describe('RepartitionsService', () => {
  let service: RepartitionsService;
  let prisma: any;
  let audit: any;

  const repartitionId = '550e8400-e29b-41d4-a716-446655440010';
  const semestreId = '550e8400-e29b-41d4-a716-446655440011';
  const departementId = '550e8400-e29b-41d4-a716-446655440012';

  beforeEach(() => {
    vi.clearAllMocks();

    audit = {
      auditTransaction: vi.fn(async (callback: any, _meta: any) => {
        return callback(prisma);
      }),
    };

    prisma = {
      semestre: {
        findUnique: vi.fn(),
      },
      departement: {
        findUnique: vi.fn(),
      },
      repartition: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      affectation: {
        findMany: vi.fn(),
      },
      moduleVolume: {
        findMany: vi.fn(),
      },
      snapshot: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      snapshotAffectation: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      snapshotCharge: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    service = new RepartitionsService(prisma, audit);
  });

  describe('createRepartition', () => {
    const dto: CreateRepartitionDto = {
      semestreId,
      departementId,
      statut: 'BROUILLON',
      libelle: 'Répartition L3 INFO S1',
    };

    it('devrait créer une répartition', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });
      prisma.repartition.findFirst.mockResolvedValue(null);
      prisma.repartition.create.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'BROUILLON',
        libelle: 'Répartition L3 INFO S1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createRepartition(dto, 'user-1');

      expect(result.id).toBe(repartitionId);
      expect(result.semestreId).toBe(semestreId);
      expect(result.departementId).toBe(departementId);
      expect(result.statut).toBe('BROUILLON');
      expect(result.libelle).toBe('Répartition L3 INFO S1');
      expect(prisma.repartition.create).toHaveBeenCalledWith({
        data: {
          semestreId,
          departementId,
          statut: 'BROUILLON',
          libelle: 'Répartition L3 INFO S1',
        },
      });
    });

    it('devrait utiliser BROUILLON par défaut si aucun statut fourni', async () => {
      const dtoSansStatut: CreateRepartitionDto = {
        semestreId,
        departementId,
      };

      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });
      prisma.repartition.findFirst.mockResolvedValue(null);
      prisma.repartition.create.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'BROUILLON',
        libelle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createRepartition(dtoSansStatut, 'user-1');

      expect(prisma.repartition.create).toHaveBeenCalledWith({
        data: {
          semestreId,
          departementId,
          statut: 'BROUILLON',
          libelle: null,
        },
      });
    });

    it('devrait lever NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.createRepartition(dto, 'user-1')).rejects.toThrow(
        'introuvable',
      );
    });

    it('devrait lever NotFoundException si le département est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.departement.findUnique.mockResolvedValue(null);

      await expect(service.createRepartition(dto, 'user-1')).rejects.toThrow(
        'introuvable',
      );
    });

    it('devrait lever ConflictException si la répartition existe déjà', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });
      prisma.repartition.findFirst.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
      });

      await expect(service.createRepartition(dto, 'user-1')).rejects.toThrow(
        'existe déjà',
      );
    });
  describe('findAllRepartitions', () => {
    it('devrait retourner une liste paginée', async () => {
      prisma.repartition.findMany.mockResolvedValue([
        {
          id: repartitionId,
          semestreId,
          departementId,
          statut: 'BROUILLON',
          libelle: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          semestre: { id: semestreId, numero: 1 },
          departement: { id: departementId, code: 'INFO', libelle: 'Informatique' },
        },
      ]);
      prisma.repartition.count.mockResolvedValue(1);

      const result = await service.findAllRepartitions({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(prisma.repartition.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          semestre: { select: { id: true, numero: true } },
          departement: { select: { id: true, code: true, libelle: true } },
        },
      });
    });

    it('devrait appliquer les filtres de statut, semestre et département', async () => {
      prisma.repartition.findMany.mockResolvedValue([]);
      prisma.repartition.count.mockResolvedValue(0);

      await service.findAllRepartitions({
        statut: 'VALIDEE',
        semestreId,
        departementId,
        search: 'INFO',
      });

      expect(prisma.repartition.findMany).toHaveBeenCalledWith({
        where: {
          statut: 'VALIDEE',
          semestreId,
          departementId,
          OR: [{ libelle: { contains: 'INFO', mode: 'insensitive' } }],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          semestre: { select: { id: true, numero: true } },
          departement: { select: { id: true, code: true, libelle: true } },
        },
      });
    });
  });

  describe('findRepartitionById', () => {
    it('devrait retourner la répartition trouvée', async () => {
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'BROUILLON',
        libelle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findRepartitionById(repartitionId);

      expect(result.id).toBe(repartitionId);
      expect(prisma.repartition.findUnique).toHaveBeenCalledWith({
        where: { id: repartitionId },
      });
    });

    it('devrait lever NotFoundException si la répartition est introuvable', async () => {
      prisma.repartition.findUnique.mockResolvedValue(null);

      await expect(
        service.findRepartitionById(repartitionId),
      ).rejects.toThrow('introuvable');
    });
  });

  describe('updateRepartition', () => {
    const updateDto: UpdateRepartitionDto = {
      statut: 'VALIDEE',
      libelle: 'Répartition modifiée',
    };

    it('devrait mettre à jour la répartition', async () => {
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'BROUILLON',
        libelle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.repartition.update.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'VALIDEE',
        libelle: 'Répartition modifiée',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateRepartition(repartitionId, updateDto, 'user-1');

      expect(result.statut).toBe('VALIDEE');
      expect(result.libelle).toBe('Répartition modifiée');
      expect(prisma.repartition.update).toHaveBeenCalledWith({
        where: { id: repartitionId },
        data: {
          statut: 'VALIDEE',
          libelle: 'Répartition modifiée',
        },
      });
    });

    it('devrait lever NotFoundException si la répartition est introuvable', async () => {
      prisma.repartition.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRepartition(repartitionId, updateDto, 'user-1'),
      ).rejects.toThrow('introuvable');
    });
  });

  describe('removeRepartition', () => {
    it('devrait supprimer la répartition', async () => {
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId,
        semestreId,
        departementId,
        statut: 'BROUILLON',
        libelle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.repartition.delete.mockResolvedValue({});

      await service.removeRepartition(repartitionId, 'user-1');

      expect(prisma.repartition.delete).toHaveBeenCalledWith({
        where: { id: repartitionId },
      });
    });

    it('devrait lever NotFoundException si la répartition est introuvable', async () => {
      prisma.repartition.findUnique.mockResolvedValue(null);

      await expect(
        service.removeRepartition(repartitionId, 'user-1'),
      ).rejects.toThrow('introuvable');
  });
    });
  });

  describe('createAffectation', () => {
    const dto = {
      enseignantId: 'enseignant-1',
      groupeId: 'groupe-1',
      moduleId: 'module-1',
      typeEnseignementId: 'type-1',
      seancesParSemaine: 2,
      dureeMinutes: 90,
    };

    beforeEach(() => {
      prisma.repartition = { findUnique: vi.fn() };
      prisma.enseignant = { findUnique: vi.fn() };
      prisma.module = { findUnique: vi.fn() };
      prisma.typeEnseignement = { findUnique: vi.fn() };
      prisma.groupe = { findUnique: vi.fn() };
      prisma.affectation = { findFirst: vi.fn(), create: vi.fn() };
    });

    it('devrait créer une affectation avec succès', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, semestreId, departementId,
        semestre: { id: semestreId, numero: 1 },
      });
      prisma.enseignant.findUnique.mockResolvedValue({
        id: 'enseignant-1', matricule: 'ENS001', isActive: true,
      });
      prisma.module.findUnique.mockResolvedValue({
        id: 'module-1', niveauId: 'niveau-1', semestreNumero: 1,
      });
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: 'type-1', activityTagId: null,
      });
      prisma.groupe.findUnique.mockResolvedValue({
        id: 'groupe-1', niveauId: 'niveau-1',
      });
      prisma.affectation.findFirst.mockResolvedValue(null);
      prisma.affectation.create.mockResolvedValue({
        id: 'affectation-1', repartitionId, enseignantId: 'enseignant-1',
        groupeId: 'groupe-1', moduleId: 'module-1', typeEnseignementId: 'type-1',
        activityTagId: null, volumeHebdoMinutes: 180, seancesParSemaine: 2,
        dureeMinutes: 90, estCmCommun: false, workingRevision: 1,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createAffectation(repartitionId, dto, currentUser);

      expect(result.id).toBe('affectation-1');
      expect(result.volumeHebdoMinutes).toBe(180);
    });

    it('devrait lever NotFoundException si la répartition est introuvable', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue(null);
      await expect(
        service.createAffectation(repartitionId, dto, currentUser),
      ).rejects.toThrow('introuvable');
    });

    it('devrait lever une erreur si l\'enseignant est inactif', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, semestreId, departementId,
        semestre: { id: semestreId, numero: 1 },
      });
      prisma.enseignant.findUnique.mockResolvedValue({
        id: 'enseignant-1', matricule: 'ENS001', isActive: false,
      });
      await expect(
        service.createAffectation(repartitionId, dto, currentUser),
      ).rejects.toThrow();
    });

    it('devrait lever une erreur en cas de doublon', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, semestreId, departementId,
        semestre: { id: semestreId, numero: 1 },
      });
      prisma.enseignant.findUnique.mockResolvedValue({
        id: 'enseignant-1', matricule: 'ENS001', isActive: true,
      });
      prisma.module.findUnique.mockResolvedValue({
        id: 'module-1', niveauId: 'niveau-1', semestreNumero: 1,
      });
      prisma.typeEnseignement.findUnique.mockResolvedValue({
        id: 'type-1', activityTagId: null,
      });
      prisma.affectation.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createAffectation(repartitionId, dto, currentUser),
      ).rejects.toThrow();
    });
  });  describe('findAllAffectations', () => {
    it('devrait retourner les affectations paginées', async () => {
      prisma.affectation = { findMany: vi.fn(), count: vi.fn() };
      prisma.affectation.findMany.mockResolvedValue([{
        id: 'affectation-1',
        enseignant: { id: 'e1', matricule: 'ENS001', nom: 'Test', prenom: 'User' },
        module: { id: 'm1', code: 'MOD1', libelle: 'Module 1' },
        typeEnseignement: { id: 't1', code: 'TD', libelle: 'TD' },
        groupe: { id: 'g1', code: 'G1', libelle: 'Groupe 1' },
        activityTag: { id: 'tg1', code: 'TAG1', libelle: 'Tag 1' },
      }]);
      prisma.affectation.count.mockResolvedValue(1);

      const result = await service.findAllAffectations(repartitionId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('updateAffectation', () => {
    it('devrait mettre à jour une affectation et incrémenter workingRevision', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.affectation = { findUnique: vi.fn(), update: vi.fn() };

      prisma.affectation.findUnique.mockResolvedValue({
        id: 'affectation-1', repartitionId,
        repartition: { departementId },
        enseignantId: 'enseignant-1', moduleId: 'module-1',
        typeEnseignementId: 'type-1', groupeId: null,
        activityTagId: null, seancesParSemaine: 2, dureeMinutes: 90,
        workingRevision: 1,
      });
      prisma.affectation.update.mockResolvedValue({
        id: 'affectation-1', repartitionId, enseignantId: 'enseignant-1',
        groupeId: null, moduleId: 'module-1', typeEnseignementId: 'type-1',
        activityTagId: null, volumeHebdoMinutes: 270, seancesParSemaine: 3,
        dureeMinutes: 90, estCmCommun: false, workingRevision: 2,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.updateAffectation('affectation-1', { seancesParSemaine: 3 }, currentUser);

      expect(result.workingRevision).toBe(2);
      expect(result.volumeHebdoMinutes).toBe(270);
      expect(prisma.affectation.update).toHaveBeenCalledWith({
        where: { id: 'affectation-1' },
        data: expect.objectContaining({
          seancesParSemaine: 3, volumeHebdoMinutes: 270, workingRevision: 2,
        }),
      });
    });
  });

  describe('removeAffectation', () => {
    it('devrait supprimer une affectation', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.affectation = { findUnique: vi.fn(), delete: vi.fn() };

      prisma.affectation.findUnique.mockResolvedValue({
        id: 'affectation-1', repartitionId, repartition: { departementId },
      });
      prisma.affectation.delete.mockResolvedValue({});

      await service.removeAffectation('affectation-1', currentUser);

      expect(prisma.affectation.delete).toHaveBeenCalledWith({
        where: { id: 'affectation-1' },
      });
    });
  });

  describe('getControles', () => {
    it('devrait retourner les contrôles de cohérence des volumes', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, departementId,
      });

      prisma.affectation.findMany.mockResolvedValue([
        {
          id: 'affectation-1', repartitionId, groupeId: 'groupe-1', moduleId: 'module-1',
          typeEnseignementId: 'type-cm', volumeHebdoMinutes: 90,
          groupe: { id: 'groupe-1', libelle: 'L3 INFO A' },
          module: { id: 'module-1', libelle: 'Algorithmique' },
          typeEnseignement: { id: 'type-cm', code: 'CM' },
        },
        {
          id: 'affectation-2', repartitionId, groupeId: 'groupe-1', moduleId: 'module-1',
          typeEnseignementId: 'type-cm', volumeHebdoMinutes: 45,
          groupe: { id: 'groupe-1', libelle: 'L3 INFO A' },
          module: { id: 'module-1', libelle: 'Algorithmique' },
          typeEnseignement: { id: 'type-cm', code: 'CM' },
        },
      ]);

      prisma.moduleVolume.findMany.mockResolvedValue([
        { id: 'mv-1', moduleId: 'module-1', type: 'CM', volume: 150 },
      ]);

      const result = await service.getControles(repartitionId, currentUser);

      expect(result.repartitionId).toBe(repartitionId);
      expect(result.controles).toHaveLength(1);
      expect(result.controles[0]).toMatchObject({
        groupeId: 'groupe-1',
        groupeLibelle: 'L3 INFO A',
        moduleId: 'module-1',
        moduleLibelle: 'Algorithmique',
        typeEnseignementId: 'type-cm',
        typeCode: 'CM',
        volumeAttendu: 150,
        volumeAffecte: 135,
        ecart: 15,
        statut: 'EXCEDENT',
      });
      expect(prisma.affectation.findMany).toHaveBeenCalledWith({
        where: { repartitionId },
        include: expect.objectContaining({
          groupe: { select: { id: true, libelle: true } },
          module: { select: { id: true, libelle: true } },
          typeEnseignement: { select: { id: true, code: true } },
        }),
      });
    });

    it('devrait classer NON_COUVERT quand le volume affecté est inférieur au attendu', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, departementId,
      });

      prisma.affectation.findMany.mockResolvedValue([
        {
          id: 'affectation-1', repartitionId, groupeId: null, moduleId: 'module-1',
          typeEnseignementId: 'type-td', volumeHebdoMinutes: 90,
          groupe: null,
          module: { id: 'module-1', libelle: 'Mathématiques' },
          typeEnseignement: { id: 'type-td', code: 'TD' },
        },
      ]);

      prisma.moduleVolume.findMany.mockResolvedValue([
        { id: 'mv-2', moduleId: 'module-1', type: 'TD', volume: 45 },
      ]);

      const result = await service.getControles(repartitionId, currentUser);

      expect(result.controles).toHaveLength(1);
      expect(result.controles[0].statut).toBe('NON_COUVERT');
      expect(result.controles[0].ecart).toBe(-45);
      expect(result.controles[0].volumeAttendu).toBe(45);
      expect(result.controles[0].volumeAffecte).toBe(90);
    });

    it('devrait classer COUVERT quand écart est nul', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, departementId,
      });

      prisma.affectation.findMany.mockResolvedValue([
        {
          id: 'affectation-1', repartitionId, groupeId: 'groupe-2', moduleId: 'module-2',
          typeEnseignementId: 'type-tp', volumeHebdoMinutes: 60,
          groupe: { id: 'groupe-2', libelle: 'L3 INFO B' },
          module: { id: 'module-2', libelle: 'Physique' },
          typeEnseignement: { id: 'type-tp', code: 'TP' },
        },
      ]);

      prisma.moduleVolume.findMany.mockResolvedValue([
        { id: 'mv-3', moduleId: 'module-2', type: 'TP', volume: 60 },
      ]);

      const result = await service.getControles(repartitionId, currentUser);

      expect(result.controles).toHaveLength(1);
      expect(result.controles[0].statut).toBe('COUVERT');
      expect(result.controles[0].ecart).toBe(0);
    });

    it('devrait lever 404 si la répartition est introuvable', async () => {
      const currentUser = { id: 'user-1', role: 'RESPONSABLE_DEPARTEMENT', departments: [departementId] };
      prisma.repartition.findUnique.mockResolvedValue(null);

      await expect(service.getControles('inconnu', currentUser)).rejects.toThrow(
        'Répartition inconnu introuvable',
      );
    });

    it('devrait lever 403 OUT_OF_SCOPE pour un responsable hors département', async () => {
      const currentUser = { id: 'user-2', role: 'RESPONSABLE_DEPARTEMENT', departments: ['autre-departement'] };
      prisma.repartition.findUnique.mockResolvedValue({
        id: repartitionId, departementId,
      });

      await expect(service.getControles(repartitionId, currentUser)).rejects.toThrow(
        'OUT_OF_SCOPE',
      );
    });
  });

  // ============================================
  // Tests de validation (L2-12)
  // ============================================

  describe('validateRepartition', () => {
    const currentUserResponsable = {
      id: 'user-1',
      role: 'RESPONSABLE_DEPARTEMENT',
      departments: [departementId],
    };
    const currentUserAdmin = {
      id: 'admin-1',
      role: 'ADMINISTRATEUR',
      departments: undefined,
    };

    const mockRepartition = {
      id: repartitionId,
      semestreId,
      departementId,
      statut: 'BROUILLON',
      departement: { id: departementId },
    };

    const mockControles: ControlesResponseDto = {
      repartitionId,
      controles: [
        {
          groupeId: null,
          groupeLibelle: null,
          moduleId: 'module-1',
          moduleLibelle: 'Mathématiques',
          typeEnseignementId: 'type-td',
          typeCode: 'TD',
          volumeAttendu: 90,
          volumeAffecte: 90,
          ecart: 0,
          statut: 'COUVERT' as ControleStatut,
        },
      ],
    };

    const mockAffectations = [
      {
        id: 'aff-1',
        repartitionId,
        enseignantId: 'ens-1',
        groupeId: null,
        moduleId: 'module-1',
        typeEnseignementId: 'type-td',
        activityTagId: null,
        volumeHebdoMinutes: 90,
        seancesParSemaine: 3,
        dureeMinutes: 30,
        estCmCommun: false,
        workingRevision: 1,
      },
    ];

    beforeEach(() => {
      prisma.repartition.findUnique.mockResolvedValue(mockRepartition);
      prisma.affectation.findMany.mockResolvedValue([]);
      prisma.moduleVolume.findMany.mockResolvedValue([]);
      prisma.snapshot.findFirst.mockResolvedValue(null);
      prisma.snapshot.create.mockResolvedValue({
        id: 'snap-1',
        repartitionId,
        tag: 'SNAP-1234567890',
        hash: 'abc123',
        valideParId: currentUserResponsable.id,
        valideLe: new Date(),
        parAdministrateur: false,
        repartitionStatut: 'VALIDEE',
        createdAt: new Date(),
      });
      prisma.snapshotAffectation.create.mockResolvedValue({ id: 'sa-1' });
      prisma.snapshotCharge.create.mockResolvedValue({ id: 'sc-1' });
      prisma.snapshotAffectation.findMany.mockResolvedValue(mockAffectations);
      prisma.snapshotCharge.findMany.mockResolvedValue([]);
    });

    it('devrait valider une répartition sans écart et créer un snapshot', async () => {
      prisma.repartition.findUnique.mockResolvedValue(mockRepartition);
      prisma.snapshot.findFirst.mockResolvedValue({
        id: 'snap-1',
        repartitionId,
        tag: 'SNAP-1234567890',
        hash: 'abc123',
        valideParId: currentUserResponsable.id,
        valideLe: new Date(),
        parAdministrateur: false,
        repartitionStatut: 'VALIDEE',
        createdAt: new Date(),
      });
      vi.spyOn(service, 'getControles').mockResolvedValue(mockControles);

      const result = await service.validateRepartition(repartitionId, currentUserResponsable);

      expect(result.repartitionId).toBe(repartitionId);
      expect(result.statut).toBe('VALIDEE');
      expect(result.parAdministrateur).toBe(false);
      expect(result.valideParId).toBe(currentUserResponsable.id);
      expect(result.affectations).toHaveLength(1);
      expect(prisma.repartition.update).toHaveBeenCalledWith({
        where: { id: repartitionId },
        data: { statut: 'VALIDEE' },
      });
      expect(prisma.snapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tag: expect.stringMatching(/^SNAP-/),
            hash: expect.any(String),
            parAdministrateur: false,
          }),
        }),
      );
    });

    it('devrait marquer parAdministrateur=true pour un Admin', async () => {
      prisma.repartition.findUnique.mockResolvedValue(mockRepartition);
      prisma.snapshot.findFirst.mockResolvedValue({
        id: 'snap-1',
        repartitionId,
        tag: 'SNAP-1234567890',
        hash: 'abc123',
        valideParId: currentUserAdmin.id,
        valideLe: new Date(),
        parAdministrateur: true,
        repartitionStatut: 'VALIDEE',
        createdAt: new Date(),
      });
      vi.spyOn(service, 'getControles').mockResolvedValue(mockControles);

      const result = await service.validateRepartition(repartitionId, currentUserAdmin);

      expect(result.parAdministrateur).toBe(true);
      expect(result.valideParId).toBe(currentUserAdmin.id);
    });

    it('devrait lever 422 REPARTITION_INVALID quand il reste un écart', async () => {
      prisma.repartition.findUnique.mockResolvedValue(mockRepartition);
      vi.spyOn(service, 'getControles').mockResolvedValue({
        repartitionId,
        controles: [
          {
            ...mockControles.controles[0],
            ecart: 45,
            statut: 'EXCEDENT' as ControleStatut,
          },
        ],
      } as ControlesResponseDto);

      await expect(
        service.validateRepartition(repartitionId, currentUserResponsable),
      ).rejects.toMatchObject({
        response: { code: 'REPARTITION_INVALID' },
      });
    });

    it('devrait lever 404 si la répartition est introuvable', async () => {
      prisma.repartition.findUnique.mockResolvedValue(null);

      await expect(
        service.validateRepartition('inconnu', currentUserResponsable),
      ).rejects.toThrow('Répartition inconnu introuvable');
    });

    it('devrait lever 403 OUT_OF_SCOPE pour un responsable hors département', async () => {
      const currentUserHorsPerimetre = {
        id: 'user-2',
        role: 'RESPONSABLE_DEPARTEMENT',
        departments: ['autre-departement'],
      };
      prisma.repartition.findUnique.mockResolvedValue(mockRepartition);

      await expect(
        service.validateRepartition(repartitionId, currentUserHorsPerimetre),
      ).rejects.toThrow('OUT_OF_SCOPE');
    });

    it('devrait lever 409 si la répartition est déjà validée', async () => {
      prisma.repartition.findUnique.mockResolvedValue({
        ...mockRepartition,
        statut: 'VALIDEE',
      });

      await expect(
        service.validateRepartition(repartitionId, currentUserResponsable),
      ).rejects.toThrow('déjà validée');
    });
  });
});
