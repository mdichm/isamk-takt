// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du générateur de grille horaire (L1-18)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnneesService } from './annees.service.js';
import type { GenerateCreneauxDto } from './dto/generate-creneaux.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
  Prisma: {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

vi.mock('../creneaux/creneau.service.js', () => ({
  CreneauService: vi.fn(),
}));

describe('AnneesService - generateCreneaux (L1-18)', () => {
  let service: AnneesService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const semestreId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      semestre: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      creneau: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };
    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };
    service = new AnneesService(prisma as any, audit as any, {} as any, {
      verifyAnneeWritable: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  it('should generate creneaux deterministically with 30-minute slots', async () => {
    const dto: GenerateCreneauxDto = {
      jours: [
        {
          jour: 'LUNDI',
          heureDebut: '08:00:00',
          heureFin: '12:00:00',
        },
      ],
      dryRun: true,
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });

    const result = await service.generateCreneaux(semestreId, dto, userId);

    expect(result.semestreId).toBe(semestreId);
    expect(result.total).toBe(8);
    expect(result.parJour).toHaveLength(1);
    expect(result.parJour[0]).toEqual({ jour: 'LUNDI', count: 8 });
    expect(result.creneaux[0]).toEqual({
      jour: 'LUNDI',
      ordre: 1,
      heureDebut: '08:00:00',
      heureFin: '08:30:00',
      estPause: false,
    });
    expect(result.creneaux[7]).toEqual({
      jour: 'LUNDI',
      ordre: 8,
      heureDebut: '11:30:00',
      heureFin: '12:00:00',
      estPause: false,
    });
    expect(prisma.creneau.deleteMany).not.toHaveBeenCalled();
    expect(prisma.creneau.create).not.toHaveBeenCalled();
    expect(prisma.semestre.update).not.toHaveBeenCalled();
  });

  it('should mark pauses as estPause=true', async () => {
    const dto: GenerateCreneauxDto = {
      jours: [
        {
          jour: 'MARDI',
          heureDebut: '08:00:00',
          heureFin: '10:00:00',
          pauses: [
            { debut: '09:00:00', fin: '09:30:00' },
          ],
        },
      ],
      dryRun: true,
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });

    const result = await service.generateCreneaux(semestreId, dto, userId);

    expect(result.total).toBe(4);
    const pauses = result.creneaux.filter((c) => c.estPause);
    expect(pauses).toHaveLength(1);
    expect(pauses[0]).toEqual({
      jour: 'MARDI',
      ordre: 3,
      heureDebut: '09:00:00',
      heureFin: '09:30:00',
      estPause: true,
    });
  });

  it('should throw NotFound when semestre does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValue(null);
    await expect(
      service.generateCreneaux(semestreId, { jours: [], dryRun: true } as GenerateCreneauxDto, userId),
    ).rejects.toThrow('introuvable');
  });

  it('should throw BadRequest when duration is not a multiple of 30 minutes', async () => {
    const dto: GenerateCreneauxDto = {
      jours: [
        {
          jour: 'LUNDI',
          heureDebut: '08:00:00',
          heureFin: '08:45:00',
        },
      ],
      dryRun: true,
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    await expect(service.generateCreneaux(semestreId, dto, userId)).rejects.toThrow(
      'multiple positif de 30 minutes',
    );
  });

  it('should throw BadRequest when pause is outside the day range', async () => {
    const dto: GenerateCreneauxDto = {
      jours: [
        {
          jour: 'LUNDI',
          heureDebut: '08:00:00',
          heureFin: '12:00:00',
          pauses: [
            { debut: '07:00:00', fin: '07:30:00' },
          ],
        },
      ],
      dryRun: true,
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    await expect(service.generateCreneaux(semestreId, dto, userId)).rejects.toThrow(
      'comprise strictement entre',
    );
  });

  it('should write to database when dryRun is false', async () => {
    const dto: GenerateCreneauxDto = {
      jours: [
        {
          jour: 'LUNDI',
          heureDebut: '08:00:00',
          heureFin: '09:00:00',
        },
      ],
      dryRun: false,
    };
    prisma.semestre.findUnique.mockResolvedValue({ id: semestreId, numero: 1 });
    prisma.creneau.create.mockResolvedValue({
      id: 'creneau-1',
      semestreId,
      jour: 'LUNDI',
      ordre: 1,
      heureDebut: new Date('1970-01-01T08:00:00Z'),
      heureFin: new Date('1970-01-01T08:30:00Z'),
      estPause: false,
      estActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.generateCreneaux(semestreId, dto, userId);

    expect(result.total).toBe(2);
    expect(prisma.creneau.deleteMany).toHaveBeenCalledWith({ where: { semestreId } });
    expect(prisma.creneau.create).toHaveBeenCalledTimes(2);
    expect(prisma.semestre.update).toHaveBeenCalledWith({
      where: { id: semestreId },
      data: { grilleParams: expect.anything() },
    });
    expect(audit.auditTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        userId,
        action: 'CREATE',
        objetType: 'Semestre',
        objetId: semestreId,
      }),
    );
  });
});
