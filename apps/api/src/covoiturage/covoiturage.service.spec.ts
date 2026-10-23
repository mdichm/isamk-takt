// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service GroupeCovoiturage (L3-41)
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CovoiturageService } from './covoiturage.service.js';

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  semestre = {
    findUnique: vi.fn(),
  };
  enseignant = {
    findMany: vi.fn(),
  };
  groupeCovoiturage = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  };
  $transaction = vi.fn(async <T>(calls: Promise<T>[]): Promise<T[]> =>
    Promise.all(calls),
  );
}

function makeGroupe(
  id: string,
  overrides: {
    semestreId?: string;
    enseignantIds?: string[];
    margeMinutes?: number;
    joursCommunsMin?: number;
    strict?: boolean;
  } = {},
) {
  return {
    id,
    semestreId: overrides.semestreId ?? 'uuid-semestre',
    enseignantIds: overrides.enseignantIds ?? ['uuid-ens-1', 'uuid-ens-2'],
    margeMinutes: overrides.margeMinutes ?? 60,
    joursCommunsMin: overrides.joursCommunsMin ?? 1,
    strict: overrides.strict ?? false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('CovoiturageService (L3-41)', () => {
  let service: CovoiturageService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new CovoiturageService(prisma as unknown as PrismaService);
    vi.resetAllMocks();
  });

  describe('create', () => {
    const dto = {
      semestreId: 'uuid-semestre',
      enseignantIds: ['uuid-ens-1', 'uuid-ens-2'],
      margeMinutes: 60,
      joursCommunsMin: 1,
      strict: false,
    };

    it('cree un groupe de covoiturage', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      prisma.enseignant.findMany.mockResolvedValue([
        { id: 'uuid-ens-1' },
        { id: 'uuid-ens-2' },
      ]);
      prisma.groupeCovoiturage.findFirst.mockResolvedValue(null);
      prisma.groupeCovoiturage.create.mockResolvedValue(
        makeGroupe('uuid-groupe', { semestreId: 'uuid-semestre' }),
      );

      const result = await service.create(dto as any);

      expect(result.id).toBe('uuid-groupe');
      expect(result.semestreId).toBe('uuid-semestre');
      expect(result.enseignantIds).toEqual(['uuid-ens-1', 'uuid-ens-2']);
      expect(result.strict).toBe(false);
      expect(prisma.groupeCovoiturage.create).toHaveBeenCalledWith({
        data: {
          semestreId: 'uuid-semestre',
          enseignantIds: ['uuid-ens-1', 'uuid-ens-2'],
          margeMinutes: 60,
          joursCommunsMin: 1,
          strict: false,
        },
      });
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lance BadRequestException avec moins de deux enseignants', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      await expect(
        service.create({ ...dto, enseignantIds: ['uuid-ens-1'] } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lance BadRequestException si un enseignant est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      prisma.enseignant.findMany.mockResolvedValue([{ id: 'uuid-ens-1' }]);

      await expect(service.create(dto as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lance ConflictException si un groupe existe deja pour ces enseignants', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      prisma.enseignant.findMany.mockResolvedValue([
        { id: 'uuid-ens-1' },
        { id: 'uuid-ens-2' },
      ]);
      prisma.groupeCovoiturage.findFirst.mockResolvedValue(
        makeGroupe('uuid-existant'),
      );

      await expect(service.create(dto as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('retourne une liste paginée filtree par semestre', async () => {
      const groupes = [makeGroupe('g1'), makeGroupe('g2')];
      prisma.groupeCovoiturage.findMany.mockResolvedValue(groupes);
      prisma.groupeCovoiturage.count.mockResolvedValue(2);

      const result = await service.findAll({
        semestreId: 'uuid-semestre',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.groupeCovoiturage.findMany).toHaveBeenCalledWith({
        where: { semestreId: 'uuid-semestre' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('retourne le groupe par ID', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(
        makeGroupe('uuid-groupe'),
      );

      const result = await service.findOne('uuid-groupe');

      expect(result.id).toBe('uuid-groupe');
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met a jour le groupe', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(
        makeGroupe('uuid-groupe'),
      );
      prisma.enseignant.findMany.mockResolvedValue([
        { id: 'uuid-ens-1' },
        { id: 'uuid-ens-2' },
      ]);
      prisma.groupeCovoiturage.update.mockResolvedValue(
        makeGroupe('uuid-groupe', { strict: true }),
      );

      const result = await service.update('uuid-groupe', { strict: true } as any);

      expect(result.strict).toBe(true);
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(null);

      await expect(
        service.update('inconnu', { strict: true } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime le groupe', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(
        makeGroupe('uuid-groupe'),
      );

      await service.remove('uuid-groupe');

      expect(prisma.groupeCovoiturage.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-groupe' },
      });
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.groupeCovoiturage.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
