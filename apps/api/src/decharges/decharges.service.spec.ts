// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Décharges (L1-08)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DechargesService } from './decharges.service.js';
import {
  CreateDechargeDto,
  UpdateDechargeDto,
} from './dto/decharge.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('DechargesService', () => {
  let service: DechargesService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const dechargeId = '550e8400-e29b-41d4-a716-446655440010';
  const enseignantId = '550e8400-e29b-41d4-a716-446655440020';
  const semestreId = '550e8400-e29b-41d4-a716-446655440030';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      enseignant: {
        findUnique: vi.fn(),
      },
      semestre: {
        findUnique: vi.fn(),
      },
      decharge: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(async (calls: any[]) => {
        const results = await Promise.all(calls.map((c) =>
          typeof c === 'function' ? c(prisma) : c,
        ));
        return results;
      }),
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new DechargesService(prisma, audit);
  });

  describe('createDecharge', () => {
    it('devrait créer une décharge', async () => {
      const dto: CreateDechargeDto = {
        heures: 12.5,
        enseignantId,
        semestreId,
      };

      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
        nom: 'Dupont',
        prenom: 'Jean',
      });
      prisma.semestre.findUnique.mockResolvedValue({
        id: semestreId,
        numero: 1,
      });
      prisma.decharge.findFirst.mockResolvedValue(null);
      prisma.decharge.create.mockResolvedValue({
        id: dechargeId,
        heures: 12.5,
        enseignantId,
        semestreId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createDecharge(dto, userId);

      expect(result.id).toBe(dechargeId);
      expect(result.heures).toBe(12.5);
      expect(result.enseignantId).toBe(enseignantId);
      expect(result.semestreId).toBe(semestreId);
      expect(prisma.decharge.create).toHaveBeenCalledWith({
        data: {
          heures: 12.5,
          enseignantId,
          semestreId,
        },
      });
      expect(audit.auditTransaction).toHaveBeenCalled();
    });

    it('devrait lever NotFoundException si l’enseignant n’existe pas', async () => {
      const dto: CreateDechargeDto = {
        heures: 10,
        enseignantId,
        semestreId,
      };

      prisma.enseignant.findUnique.mockResolvedValue(null);

      await expect(service.createDecharge(dto, userId)).rejects.toThrow(
        'non trouvé',
      );
    });

    it('devrait lever NotFoundException si le semestre n’existe pas', async () => {
      const dto: CreateDechargeDto = {
        heures: 10,
        enseignantId,
        semestreId,
      };

      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.createDecharge(dto, userId)).rejects.toThrow(
        'non trouvé',
      );
    });

    it('devrait lever ConflictException si une décharge existe déjà', async () => {
      const dto: CreateDechargeDto = {
        heures: 10,
        enseignantId,
        semestreId,
      };

      prisma.enseignant.findUnique.mockResolvedValue({
        id: enseignantId,
        matricule: 'E12345',
      });
      prisma.semestre.findUnique.mockResolvedValue({
        id: semestreId,
        numero: 1,
      });
      prisma.decharge.findFirst.mockResolvedValue({
        id: 'existing-id',
        heures: 5,
        enseignantId,
        semestreId,
      });

      await expect(service.createDecharge(dto, userId)).rejects.toThrow(
        'déjà',
      );
    });
  describe('findAllDecharges', () => {
    it('devrait retourner une liste paginée de décharges', async () => {
      prisma.decharge.findMany.mockResolvedValue([
        {
          id: dechargeId,
          heures: 12.5,
          enseignantId,
          semestreId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      prisma.decharge.count.mockResolvedValue(1);

      const result = await service.findAllDecharges({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(dechargeId);
    });

    it('devrait filtrer par enseignantId quand fourni', async () => {
      prisma.decharge.findMany.mockResolvedValue([]);
      prisma.decharge.count.mockResolvedValue(0);

      await service.findAllDecharges({ page: 1, limit: 10, enseignantId });

      expect(prisma.decharge.findMany).toHaveBeenCalledWith({
        where: { enseignantId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('devrait filtrer par semestreId quand fourni', async () => {
      prisma.decharge.findMany.mockResolvedValue([]);
      prisma.decharge.count.mockResolvedValue(0);

      await service.findAllDecharges({ page: 1, limit: 10, semestreId });

      expect(prisma.decharge.findMany).toHaveBeenCalledWith({
        where: { semestreId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findDechargeById', () => {
    it('devrait retourner une décharge par ID', async () => {
      prisma.decharge.findUnique.mockResolvedValue({
        id: dechargeId,
        heures: 12.5,
        enseignantId,
        semestreId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findDechargeById(dechargeId);

      expect(result.id).toBe(dechargeId);
      expect(result.heures).toBe(12.5);
    });

    it('devrait lever NotFoundException si la décharge n’existe pas', async () => {
      prisma.decharge.findUnique.mockResolvedValue(null);

      await expect(service.findDechargeById(dechargeId)).rejects.toThrow(
        'non trouvée',
      );
    });
  });

  describe('updateDecharge', () => {
    it('devrait mettre à jour une décharge', async () => {
      const dto: UpdateDechargeDto = { heures: 20 };

      prisma.decharge.findUnique.mockResolvedValue({
        id: dechargeId,
        heures: 12.5,
        enseignantId,
        semestreId,
      });
      prisma.decharge.findFirst.mockResolvedValue(null);
      prisma.decharge.update.mockResolvedValue({
        id: dechargeId,
        heures: 20,
        enseignantId,
        semestreId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateDecharge(dechargeId, dto, userId);

      expect(result.heures).toBe(20);
      expect(prisma.decharge.update).toHaveBeenCalledWith({
        where: { id: dechargeId },
        data: { heures: 20 },
      });
      expect(audit.auditTransaction).toHaveBeenCalled();
    });

    it('devrait lever NotFoundException si la décharge n’existe pas', async () => {
      prisma.decharge.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDecharge(dechargeId, { heures: 20 }, userId),
      ).rejects.toThrow('non trouvée');
    });

    it('devrait lever ConflictException en cas de doublon enseignant/semestre', async () => {
      const nouveauSemestreId = '550e8400-e29b-41d4-a716-446655440099';
      prisma.decharge.findUnique.mockResolvedValue({
        id: dechargeId,
        heures: 12.5,
        enseignantId,
        semestreId,
      });
      prisma.decharge.findFirst.mockResolvedValue({
        id: 'other-id',
        heures: 5,
        enseignantId,
        semestreId: nouveauSemestreId,
      });

      await expect(
        service.updateDecharge(dechargeId, { semestreId: nouveauSemestreId }, userId),
      ).rejects.toThrow('déjà');
    });
  });

  describe('removeDecharge', () => {
    it('devrait supprimer une décharge', async () => {
      prisma.decharge.findUnique.mockResolvedValue({
        id: dechargeId,
        heures: 12.5,
        enseignantId,
        semestreId,
      });
      prisma.decharge.delete.mockResolvedValue({});

      await service.removeDecharge(dechargeId, userId);

      expect(prisma.decharge.delete).toHaveBeenCalledWith({
        where: { id: dechargeId },
      });
      expect(audit.auditTransaction).toHaveBeenCalled();
    });

    it('devrait lever NotFoundException si la décharge n’existe pas', async () => {
      prisma.decharge.findUnique.mockResolvedValue(null);

      await expect(service.removeDecharge(dechargeId, userId)).rejects.toThrow(
        'non trouvée',
      );
    });
  });
});
  });