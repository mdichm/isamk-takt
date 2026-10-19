// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Créneaux (L1-17)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreneauService } from './creneau.service.js';
import type {
  CreateCreneauDto,
  UpdateCreneauDto,
} from './dto/creneau.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('CreneauService', () => {
  let service: CreneauService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const semestreId = '550e8400-e29b-41d4-a716-446655440001';
  const creneauId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      semestre: { findUnique: vi.fn() },
      creneau: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    audit = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new CreneauService(prisma as any, audit as any);
  });

  it('should create a creneau', async () => {
    const dto: CreateCreneauDto = {
      semestreId,
      jour: 'LUNDI',
      ordre: 1,
      heureDebut: '08:00:00',
      heureFin: '08:30:00',
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.creneau.findFirst.mockResolvedValue(null);
    prisma.creneau.findMany.mockResolvedValue([]);
    prisma.creneau.create.mockResolvedValue({
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await service.createCreneau(dto, userId);
    expect(result.id).toBe(creneauId);
  });

  it('should throw NotFound when semestre does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValue(null);
    await expect(service.createCreneau({
      semestreId: 'unknown', jour: 'LUNDI', ordre: 1,
      heureDebut: '08:00:00', heureFin: '08:30:00',
    } as CreateCreneauDto, userId)).rejects.toThrow('introuvable');
  });

  it('should find all creneaux with pagination', async () => {
    prisma.creneau.findMany.mockResolvedValue([{
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    }]);
    prisma.creneau.count.mockResolvedValue(1);
    const result = await service.findAllCreneaux({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should find creneau by id', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await service.findCreneauById(creneauId);
    expect(result.id).toBe(creneauId);
  });

  it('should throw NotFound when creneau not found', async () => {
    prisma.creneau.findUnique.mockResolvedValue(null);
    await expect(service.findCreneauById('unknown')).rejects.toThrow('introuvable');
  });

  it('should update a creneau', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    prisma.creneau.findFirst.mockResolvedValue(null);
    prisma.creneau.update.mockResolvedValue({
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 2,
      heureDebut: new Date('1970-01-01T09:00:00Z'),
      heureFin: new Date('1970-01-01T09:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await service.updateCreneau(creneauId, { ordre: 2, heureDebut: '09:00:00', heureFin: '09:30:00' } as UpdateCreneauDto, userId);
    expect(result.ordre).toBe(2);
  });

  it('should remove (soft delete) a creneau', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId, semestreId, jour: 'LUNDI', ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    prisma.creneau.update.mockResolvedValue({});
    await service.removeCreneau(creneauId, userId);
    expect(prisma.creneau.update).toHaveBeenCalledWith({
      where: { id: creneauId }, data: { estActive: false },
    });
  });

  // ============================================
  // Duplication de créneaux (L1-19)
  // ============================================

  it('should duplicate creneaux from source to empty cible', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440003';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneau.count.mockResolvedValue(0);
    prisma.creneau.findMany.mockResolvedValue([
      {
        id: creneauId, semestreId: semestreId, jour: 'LUNDI', ordre: 1,
        heureDebut: new Date('1970-01-01T08:00:00Z'),
        heureFin: new Date('1970-01-01T08:30:00Z'),
        estPause: false, estActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'creneau-2', semestreId: semestreId, jour: 'LUNDI', ordre: 2,
        heureDebut: new Date('1970-01-01T08:30:00Z'),
        heureFin: new Date('1970-01-01T09:00:00Z'),
        estPause: false, estActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    prisma.creneau.create.mockResolvedValueOnce({ id: 'new-creneau-1' });
    prisma.creneau.create.mockResolvedValueOnce({ id: 'new-creneau-2' });

    const result = await service.duplicate(semestreId, cibleSemestreId, userId, false);

    expect(result.created).toBe(2);
    expect(result.creneauIds).toEqual(['new-creneau-1', 'new-creneau-2']);
    expect(prisma.creneau.create).toHaveBeenCalledTimes(2);
  });

  it('should throw Conflict when cible is not empty and remplacer is false', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440003';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneau.count.mockResolvedValue(3);

    await expect(
      service.duplicate(semestreId, cibleSemestreId, userId, false),
    ).rejects.toThrow('déjà des créneaux');
  });

  it('should duplicate with remplacer when cible is not empty', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440003';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneau.count.mockResolvedValue(3);
    prisma.creneau.deleteMany.mockResolvedValue({ count: 3 });
    prisma.creneau.findMany.mockResolvedValue([
      {
        id: creneauId, semestreId: semestreId, jour: 'LUNDI', ordre: 1,
        heureDebut: new Date('1970-01-01T08:00:00Z'),
        heureFin: new Date('1970-01-01T08:30:00Z'),
        estPause: false, estActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    prisma.creneau.create.mockResolvedValue({ id: 'new-creneau' });

    const result = await service.duplicate(semestreId, cibleSemestreId, userId, true);

    expect(result.created).toBe(1);
    expect(prisma.creneau.deleteMany).toHaveBeenCalledWith({
      where: { semestreId: cibleSemestreId },
    });
    expect(prisma.creneau.create).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFound when source semestre does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.duplicate('unknown-source', 'unknown-cible', userId, false),
    ).rejects.toThrow('introuvable');
  });

  it('should throw NotFound when cible semestre does not exist', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440003';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce(null);

    await expect(
      service.duplicate(semestreId, cibleSemestreId, userId, false),
    ).rejects.toThrow('introuvable');
  });

  it('should throw BadRequest when source and cible are the same', async () => {
    await expect(
      service.duplicate(semestreId, semestreId, userId, false),
    ).rejects.toThrow('doivent être différents');
  });

  it('should return 0 when source has no creneaux', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440003';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneau.count.mockResolvedValue(0);
    prisma.creneau.findMany.mockResolvedValue([]);

    const result = await service.duplicate(semestreId, cibleSemestreId, userId, false);

    expect(result.created).toBe(0);
    expect(result.creneauIds).toEqual([]);
    expect(prisma.creneau.create).not.toHaveBeenCalled();
  });
});
