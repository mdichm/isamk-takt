// SPDX-License-Identifier: AGPL-3.0-only
// eslint-disable @typescript-eslint/no-explicit-any
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndisponibiliteService } from './indisponibilite.service.js';

vi.mock('@takt/db', () => ({ PrismaClient: class {} }));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('IndisponibiliteService', () => {
  let service: IndisponibiliteService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conflitService: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const semestreId = '550e8400-e29b-41d4-a716-446655440001';
  const enseignantId = '550e8400-e29b-41d4-a716-446655440002';
  const salleId = '550e8400-e29b-41d4-a716-446655440003';
  const indispoId = '550e8400-e29b-41d4-a716-446655440004';

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      semestre: { findUnique: vi.fn() },
      enseignant: { findUnique: vi.fn() },
      salle: { findUnique: vi.fn() },
      indisponibilite: {
        findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(),
        update: vi.fn(), count: vi.fn(), findMany: vi.fn(),
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
    service = new IndisponibiliteService(prisma as any, audit as any, conflitService as any);
  });

  it('should create an indisponibility for an enseignant', async () => {
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.enseignant.findUnique.mockResolvedValue({ id: enseignantId, matricule: 'E001' });
    prisma.indisponibilite.findFirst.mockResolvedValue(null);
    prisma.indisponibilite.create.mockResolvedValue({
      id: indispoId, semestreId, jour: 'LUNDI', ordre: 3,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.createIndisponibilite({
      semestreId, jour: 'LUNDI', ordre: 3, enseignantId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, userId);

    expect(result.id).toBe(indispoId);
    expect(result.enseignantId).toBe(enseignantId);
    expect(result.salleId).toBeUndefined();
    expect(conflitService.recalculerConflitsSemestre).toHaveBeenCalledWith(semestreId);
  });

  it('should create an indisponibility for a salle', async () => {
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.salle.findUnique.mockResolvedValue({ id: salleId, code: 'AMPHI-A' });
    prisma.indisponibilite.findFirst.mockResolvedValue(null);
    prisma.indisponibilite.create.mockResolvedValue({
      id: indispoId, semestreId, jour: 'MARDI', ordre: 1,
      enseignantId: null, salleId, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.createIndisponibilite({
      semestreId, jour: 'MARDI', ordre: 1, salleId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, userId);

    expect(result.id).toBe(indispoId);
    expect(result.salleId).toBe(salleId);
    expect(result.enseignantId).toBeUndefined();
  });

  it('should throw BadRequest when neither enseignantId nor salleId is provided (XOR)', async () => {
    await expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.createIndisponibilite({ semestreId, jour: 'LUNDI', ordre: 1 } as any, userId),
    ).rejects.toThrow('XOR');
  });

  it('should throw BadRequest when both enseignantId and salleId are provided (XOR)', async () => {
    await expect(
      service.createIndisponibilite({
        semestreId, jour: 'LUNDI', ordre: 1, enseignantId, salleId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, userId),
    ).rejects.toThrow('XOR');
  });

  it('should throw NotFound when semestre does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValue(null);

    await expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.createIndisponibilite({ semestreId, jour: 'LUNDI', ordre: 1, enseignantId } as any, userId),
    ).rejects.toThrow('introuvable');
  });

  it('should throw NotFound when enseignant does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.enseignant.findUnique.mockResolvedValue(null);

    await expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.createIndisponibilite({ semestreId, jour: 'LUNDI', ordre: 1, enseignantId } as any, userId),
    ).rejects.toThrow('introuvable');
  });

  it('should throw Conflict when indisponibility already exists', async () => {
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.enseignant.findUnique.mockResolvedValue({ id: enseignantId, matricule: 'E001' });
    prisma.indisponibilite.findFirst.mockResolvedValue({ id: indispoId });

    await expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.createIndisponibilite({ semestreId, jour: 'LUNDI', ordre: 3, enseignantId } as any, userId),
    ).rejects.toThrow('déjà');
  });

  it('should find all indisponibilites with pagination', async () => {
    prisma.indisponibilite.findMany.mockResolvedValue([{
      id: indispoId, semestreId, jour: 'LUNDI', ordre: 3,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    }]);
    prisma.indisponibilite.count.mockResolvedValue(1);

    const result = await service.findAllIndisponibilites({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('should find indisponibilite by id', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue({
      id: indispoId, semestreId, jour: 'LUNDI', ordre: 3,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.findIndisponibiliteById(indispoId);

    expect(result.id).toBe(indispoId);
  });

  it('should throw NotFound when indisponibilite not found', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue(null);
    await expect(service.findIndisponibiliteById('unknown')).rejects.toThrow('introuvable');
  });

  it('should update an indisponibility', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue({
      id: indispoId, semestreId, jour: 'LUNDI', ordre: 3,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    prisma.indisponibilite.findFirst.mockResolvedValue(null);
    prisma.indisponibilite.update.mockResolvedValue({
      id: indispoId, semestreId, jour: 'MARDI', ordre: 4,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await service.updateIndisponibilite(indispoId, { jour: 'MARDI', ordre: 4 } as any, userId);

    expect(result.jour).toBe('MARDI');
    expect(result.ordre).toBe(4);
    expect(conflitService.recalculerConflitsSemestre).toHaveBeenCalledWith(semestreId);
  });

  it('should throw NotFound when updating unknown indisponibilite', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue(null);
    await expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.updateIndisponibilite('unknown', { jour: 'LUNDI' } as any, userId),
    ).rejects.toThrow('introuvable');
  });

  it('should remove (soft delete) an indisponibility', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue({
      id: indispoId, semestreId, jour: 'LUNDI', ordre: 3,
      enseignantId, salleId: null, estActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    await service.removeIndisponibilite(indispoId, userId);

    expect(prisma.indisponibilite.update).toHaveBeenCalledWith({
      where: { id: indispoId }, data: { estActive: false },
    });
    expect(conflitService.recalculerConflitsSemestre).toHaveBeenCalledWith(semestreId);
  });

  it('should throw NotFound when removing unknown indisponibilite', async () => {
    prisma.indisponibilite.findUnique.mockResolvedValue(null);
    await expect(service.removeIndisponibilite('unknown', userId)).rejects.toThrow('introuvable');
  });
});