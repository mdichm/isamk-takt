// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Correspondance d'affichage Ramadan (L1-22)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreneauxAffichageService } from './creneaux-affichage.service.js';
import type {
  CreateCreneauAffichageDto,
  UpdateCreneauAffichageDto,
  DuplicateCreneauxAffichageDto,
} from './dto/creneaux-affichage.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
  GrilleAffichage: { RAMADAN: 'RAMADAN', NORMALE: 'NORMALE' },
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('CreneauxAffichageService', () => {
  let service: CreneauxAffichageService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const semestreId = '550e8400-e29b-41d4-a716-446655440001';
  const creneauId = '550e8400-e29b-41d4-a716-446655440002';
  const affichageId = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      creneau: { findUnique: vi.fn() },
      creneauAffichage: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
      semestre: { findUnique: vi.fn() },
    };
    audit = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new CreneauxAffichageService(prisma as any, audit as any);
  });

  it('should create a creneau affichage', async () => {
    const dto: CreateCreneauAffichageDto = {
      creneauId,
      heureDebut: '07:30:00',
      heureFin: '09:00:00',
    };
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId,
      semestreId,
      jour: 'LUNDI',
      ordre: 1,
      estPause: false,
    });
    prisma.creneauAffichage.findFirst.mockResolvedValue(null);
    prisma.creneauAffichage.findMany.mockResolvedValue([]);
    prisma.creneauAffichage.create.mockResolvedValue({
      id: affichageId,
      creneauId,
      grille: 'RAMADAN',
      heureDebut: new Date('1970-01-01T07:30:00Z'),
      heureFin: new Date('1970-01-01T09:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.create(dto, userId);
    expect(result.id).toBe(affichageId);
    expect(result.grille).toBe('RAMADAN');
  });

  it('should throw NotFound when creneau does not exist', async () => {
    prisma.creneau.findUnique.mockResolvedValue(null);
    await expect(
      service.create(
        { creneauId: 'unknown', heureDebut: '07:30:00', heureFin: '09:00:00' },
        userId,
      ),
    ).rejects.toThrow('introuvable');
  });

  it('should throw Conflict when creneau is a pause', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId,
      semestreId,
      jour: 'LUNDI',
      ordre: 2,
      estPause: true,
    });
    await expect(
      service.create({ creneauId, heureDebut: '07:30:00', heureFin: '09:00:00' }, userId),
    ).rejects.toThrow('pause');
  });

  it('should throw Conflict when affichage already exists for creneau', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId,
      semestreId,
      jour: 'LUNDI',
      ordre: 1,
      estPause: false,
    });
    prisma.creneauAffichage.findFirst.mockResolvedValue({ id: affichageId });
    await expect(
      service.create({ creneauId, heureDebut: '07:30:00', heureFin: '09:00:00' }, userId),
    ).rejects.toThrow('déjà');
  });

  it('should throw Conflict when affichages overlap', async () => {
    prisma.creneau.findUnique.mockResolvedValue({
      id: creneauId,
      semestreId,
      jour: 'LUNDI',
      ordre: 3,
      estPause: false,
    });
    prisma.creneauAffichage.findFirst.mockResolvedValue(null);
    prisma.creneauAffichage.findMany.mockResolvedValue([
      {
        id: 'other',
        creneauId: 'other-creneau',
        heureDebut: new Date('1970-01-01T08:00:00Z'),
        heureFin: new Date('1970-01-01T09:00:00Z'),
        creneau: { ordre: 2, estPause: false },
      },
    ]);
    await expect(
      service.create({ creneauId, heureDebut: '08:30:00', heureFin: '09:30:00' }, userId),
    ).rejects.toThrow('chevauche');
  });

  it('should find all creneaux affichage with pagination', async () => {
    prisma.creneauAffichage.findMany.mockResolvedValue([
      {
        id: affichageId,
        creneauId,
        grille: 'RAMADAN',
        heureDebut: new Date('1970-01-01T07:30:00Z'),
        heureFin: new Date('1970-01-01T09:00:00Z'),
        creneau: { id: creneauId, semestreId, jour: 'LUNDI', ordre: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    prisma.creneauAffichage.count.mockResolvedValue(1);
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('should find one creneau affichage by id', async () => {
    prisma.creneauAffichage.findUnique.mockResolvedValue({
      id: affichageId,
      creneauId,
      grille: 'RAMADAN',
      heureDebut: new Date('1970-01-01T07:30:00Z'),
      heureFin: new Date('1970-01-01T09:00:00Z'),
      creneau: { id: creneauId, semestreId, jour: 'LUNDI', ordre: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.findOne(affichageId);
    expect(result.id).toBe(affichageId);
  });

  it('should throw NotFound when affichage does not exist', async () => {
    prisma.creneauAffichage.findUnique.mockResolvedValue(null);
    await expect(service.findOne('unknown')).rejects.toThrow('introuvable');
  });

  it('should update a creneau affichage', async () => {
    prisma.creneauAffichage.findUnique.mockResolvedValue({
      id: affichageId,
      creneauId,
      grille: 'RAMADAN',
      heureDebut: new Date('1970-01-01T07:30:00Z'),
      heureFin: new Date('1970-01-01T09:00:00Z'),
      creneau: { id: creneauId, semestreId, jour: 'LUNDI', ordre: 1, estPause: false },
    });
    prisma.creneauAffichage.findMany.mockResolvedValue([]);
    prisma.creneauAffichage.update.mockResolvedValue({
      id: affichageId,
      creneauId,
      grille: 'RAMADAN',
      heureDebut: new Date('1970-01-01T07:30:00Z'),
      heureFin: new Date('1970-01-01T09:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dto: UpdateCreneauAffichageDto = { heureFin: '09:30:00' };
    const result = await service.update(affichageId, dto, userId);
    expect(result.id).toBe(affichageId);
    expect(result.heureFin).toMatch(/09:30:00|10:30:00|11:30:00/);
  });

  it('should remove a creneau affichage', async () => {
    prisma.creneauAffichage.findUnique.mockResolvedValue({
      id: affichageId,
      creneauId,
      grille: 'RAMADAN',
      heureDebut: new Date('1970-01-01T07:30:00Z'),
      heureFin: new Date('1970-01-01T09:00:00Z'),
      creneau: { id: creneauId, semestreId, jour: 'LUNDI', ordre: 1 },
    });
    await service.remove(affichageId, userId);
    expect(prisma.creneauAffichage.delete).toHaveBeenCalledWith({ where: { id: affichageId } });
  });

  it('should throw BadRequest when source and cible are the same for duplicate', async () => {
    await expect(
      service.duplicate(
        { sourceSemestreId: semestreId, cibleSemestreId: semestreId },
        userId,
      ),
    ).rejects.toThrow('doivent être différents');
  });

  it('should duplicate creneaux affichage', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440004';
    const dto: DuplicateCreneauxAffichageDto = {
      sourceSemestreId: semestreId,
      cibleSemestreId,
    };
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneauAffichage.count.mockResolvedValue(0);
    prisma.creneauAffichage.findMany.mockResolvedValue([
      {
        id: affichageId,
        creneauId,
        grille: 'RAMADAN',
        heureDebut: new Date('1970-01-01T07:30:00Z'),
        heureFin: new Date('1970-01-01T09:00:00Z'),
        creneau: { id: creneauId, semestreId, jour: 'LUNDI', ordre: 1 },
      },
    ]);
    prisma.creneauAffichage.create.mockResolvedValue({ id: 'new-affichage' });

    const result = await service.duplicate(dto, userId);

    expect(result.created).toBe(1);
    expect(result.creneauAffichageIds).toEqual(['new-affichage']);
  });

  it('should throw Conflict when cible not empty and remplacer is false', async () => {
    const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440004';
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: semestreId, numero: 1 })
      .mockResolvedValueOnce({ id: cibleSemestreId, numero: 2 });
    prisma.creneauAffichage.count.mockResolvedValue(3);

    await expect(
      service.duplicate(
        { sourceSemestreId: semestreId, cibleSemestreId },
        userId,
      ),
    ).rejects.toThrow('déjà des affichages');
  });
});
