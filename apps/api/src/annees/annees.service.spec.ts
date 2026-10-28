// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Années (L1-02)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnneesService } from './annees.service.js';
import { CreateAnneeDto, UpdateAnneeDto, AnneeResponseDto, TransitionAnneeDto, TransitionResponseDto } from './dto/annee.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return { PrismaClient: PrismaClientMock };
});

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

vi.mock('../creneaux/creneau.service.js', () => ({
  CreneauService: vi.fn(),
}));

describe('AnneesService', () => {
  let service: AnneesService;
  let prisma: any;
  let audit: any;
  let creneau: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const anneeId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      annee: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      versionEdt: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    creneau = {};

    service = new AnneesService(prisma as any, audit as any, creneau as any);
  });

  describe('createAnnee', () => {
    it('should create an annee with statut PREPARATION', async () => {
      const dto: CreateAnneeDto = { numero: 2026, code: '2026-2027' };

      prisma.annee.findUnique.mockResolvedValue(null);
      prisma.annee.create.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'PREPARATION', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createAnnee(dto, userId);

      expect(result.statut).toBe('PREPARATION');
      expect(result.code).toBe('2026-2027');
      expect(prisma.annee.create).toHaveBeenCalledWith({
        data: { numero: 2026, code: '2026-2027', nbSemaines: 14, statut: 'PREPARATION' },
      });
    });

    it('should throw Conflict when code already exists', async () => {
      const dto: CreateAnneeDto = { numero: 2026, code: '2026-2027' };

      prisma.annee.findUnique.mockResolvedValue({ id: 'other', code: '2026-2027' });

      await expect(service.createAnnee(dto, userId)).rejects.toThrow('existe déjà');
    });

    it('should throw Conflict when numero already exists', async () => {
      const dto: CreateAnneeDto = { numero: 2026, code: '2026-2027' };

      prisma.annee.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'other', numero: 2026 });

      await expect(service.createAnnee(dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('findAllAnnees', () => {
    it('should list annees with pagination', async () => {
      const annees = [
        { id: 'a1', numero: 2026, code: '2026-2027', nbSemaines: 14, statut: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      ];
      prisma.annee.findMany.mockResolvedValue(annees);
      prisma.annee.count.mockResolvedValue(1);

      const result = await service.findAllAnnees({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0].statut).toBe('ACTIVE');
    });

    it('should filter by statut', async () => {
      prisma.annee.findMany.mockResolvedValue([]);
      prisma.annee.count.mockResolvedValue(0);

      await service.findAllAnnees({ statut: 'ACTIVE' });

      expect(prisma.annee.findMany).toHaveBeenCalledWith({
        where: { statut: 'ACTIVE' },
        skip: 0,
        take: 10,
        orderBy: { numero: 'desc' },
      });
    });
  });

  describe('findAnneeById', () => {
    it('should return an annee by id', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'PREPARATION', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.findAnneeById(anneeId);

      expect(result.id).toBe(anneeId);
      expect(result.statut).toBe('PREPARATION');
    });

    it('should throw NotFound when annee does not exist', async () => {
      prisma.annee.findUnique.mockResolvedValue(null);

      await expect(service.findAnneeById(anneeId)).rejects.toThrow('non trouvée');
    });
  });

  describe('updateAnnee', () => {
    const dto: UpdateAnneeDto = { code: '2026-2028', statut: 'ACTIVE' };

    it('should update an annee', async () => {
      prisma.annee.findUnique
        .mockResolvedValueOnce({ id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14, statut: 'PREPARATION', createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce(null); // le nouveau code n'existe pas encore
      prisma.annee.update.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2028', nbSemaines: 14,
        statut: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.updateAnnee(anneeId, dto, userId);

      expect(result.code).toBe('2026-2028');
      expect(result.statut).toBe('ACTIVE');
      expect(prisma.annee.update).toHaveBeenCalledWith({
        where: { id: anneeId },
        data: { code: '2026-2028', statut: 'ACTIVE' },
      });
    });

    it('should throw NotFound when annee does not exist', async () => {
      prisma.annee.findUnique.mockResolvedValue(null);

      await expect(service.updateAnnee(anneeId, dto, userId)).rejects.toThrow('non trouvée');
    });

    it('should throw Conflict when code already used by another annee', async () => {
      prisma.annee.findUnique
        .mockResolvedValueOnce({ id: anneeId, code: '2026-2027' })
        .mockResolvedValueOnce({ id: 'other', code: '2026-2028' });

      await expect(service.updateAnnee(anneeId, dto, userId)).rejects.toThrow('existe déjà');
    });
  });

  describe('removeAnnee', () => {
    it('should remove an annee without semestres', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', semestres: [],
      });

      await service.removeAnnee(anneeId, userId);

      expect(prisma.annee.delete).toHaveBeenCalledWith({ where: { id: anneeId } });
    });

    it('should throw NotFound when annee does not exist', async () => {
      prisma.annee.findUnique.mockResolvedValue(null);

      await expect(service.removeAnnee(anneeId, userId)).rejects.toThrow('non trouvée');
    });

    it('should throw Conflict when annee has semestres', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', semestres: [{ id: 's1', numero: 1 }],
      });

      await expect(service.removeAnnee(anneeId, userId)).rejects.toThrow('semestres');
    });
  });

  describe('activerAnnee (L1-02)', () => {
    const transitionDto: TransitionAnneeDto = { action: 'ACTIVER' };

    it('should activate an annee in PREPARATION', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'PREPARATION',
      });
      prisma.annee.findFirst.mockResolvedValue(null);
      prisma.annee.update.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.activerAnnee(anneeId, transitionDto, userId);

      expect((result as AnneeResponseDto).statut).toBe('ACTIVE');
      expect(prisma.annee.update).toHaveBeenCalledWith({
        where: { id: anneeId },
        data: { statut: 'ACTIVE' },
      });
    });

    it('should throw NotFound when annee does not exist', async () => {
      prisma.annee.findUnique.mockResolvedValue(null);

      await expect(service.activerAnnee(anneeId, transitionDto, userId)).rejects.toThrow('non trouvée');
    });

    it('should throw Conflict when annee is already ACTIVE', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });

      await expect(service.activerAnnee(anneeId, transitionDto, userId)).rejects.toThrow('déjà active');
    });

    it('should throw Conflict when another annee is already ACTIVE', async () => {
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'PREPARATION',
      });
      prisma.annee.findFirst.mockResolvedValue({
        id: 'other', code: '2025-2026', statut: 'ACTIVE',
      });

      await expect(service.activerAnnee(anneeId, transitionDto, userId)).rejects.toThrow('déjà active');
    });

    it('should cloturer an ACTIVE annee with confirmation', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2026-2027' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });
      prisma.versionEdt.findMany.mockResolvedValue([]);
      prisma.versionEdt.updateMany.mockResolvedValue({ count: 0 });
      prisma.annee.update.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'CLOTUREE', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.activerAnnee(anneeId, clotureDto, userId);

      expect(result).toEqual({
        anneeId,
        de: 'ACTIVE',
        vers: 'CLOTUREE',
        versionsArchivees: 0,
      });
      expect(prisma.annee.update).toHaveBeenCalledWith({
        where: { id: anneeId },
        data: {
          statut: 'CLOTUREE',
          closedAt: expect.any(Date),
          closedBy: userId,
        },
      });
    });

    it('should throw BadRequest when CLOTURER without confirmation', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });

      await expect(service.activerAnnee(anneeId, clotureDto, userId)).rejects.toThrow('confirmation');
    });

    it('should throw Conflict when annee is already CLOTUREE', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2026-2027' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'CLOTUREE',
      });

      await expect(service.activerAnnee(anneeId, clotureDto, userId)).rejects.toThrow('déjà clôturée');
    });

    it('should throw BadRequest when confirmation does not match code (CONFIRMATION_MISMATCH)', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2025-2026' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });

      await expect(service.activerAnnee(anneeId, clotureDto, userId)).rejects.toThrow('confirmation');
    });

    it('should throw BadRequest when a version is EN_VALIDATION', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2026-2027' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });
      prisma.versionEdt.findMany.mockResolvedValue([{ id: 'v1' }]);

      await expect(service.activerAnnee(anneeId, clotureDto, userId)).rejects.toThrow('EN_VALIDATION');
    });

    it('should archive non-published versions with motif clôture and return count', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2026-2027' };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });
      prisma.versionEdt.findMany.mockResolvedValue([]);
      prisma.versionEdt.updateMany.mockResolvedValue({ count: 3 });
      prisma.annee.update.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'CLOTUREE', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.activerAnnee(anneeId, clotureDto, userId);

      expect(result).toEqual({
        anneeId,
        de: 'ACTIVE',
        vers: 'CLOTUREE',
        versionsArchivees: 3,
      });
      expect(prisma.versionEdt.updateMany).toHaveBeenCalledWith({
        where: {
          semestre: { anneeId },
          statut: { not: 'PUBLIE' },
        },
        data: {
          statut: 'ARCHIVE',
          motif: 'clôture',
          publieLe: expect.any(Date),
        },
      });
    });

    it('should populate closedAt and closedBy on CLOTURER', async () => {
      const clotureDto: TransitionAnneeDto = { action: 'CLOTURER', confirmation: '2026-2027', motif: "Fin d'année" };
      prisma.annee.findUnique.mockResolvedValue({
        id: anneeId, code: '2026-2027', statut: 'ACTIVE',
      });
      prisma.versionEdt.findMany.mockResolvedValue([]);
      prisma.versionEdt.updateMany.mockResolvedValue({ count: 0 });
      prisma.annee.update.mockResolvedValue({
        id: anneeId, numero: 2026, code: '2026-2027', nbSemaines: 14,
        statut: 'CLOTUREE', createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.activerAnnee(anneeId, clotureDto, userId);

      expect((result as TransitionResponseDto).anneeId).toBe(anneeId);
      expect(prisma.annee.update).toHaveBeenCalledWith({
        where: { id: anneeId },
        data: {
          statut: 'CLOTUREE',
          closedAt: expect.any(Date),
          closedBy: userId,
        },
      });
      // Verify audit was called with closedAt/closedBy in nouvelleValeur
      expect(audit.auditTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          nouvelleValeur: expect.objectContaining({
            statut: 'CLOTUREE',
            closedAt: expect.any(Date),
            closedBy: userId,
          }),
        }),
      );
    });
  });
});
