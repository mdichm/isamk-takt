// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service ExigencesSalle (L3-43)
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ExigencesSalleService } from './exigences-salle.service.js';

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  semestre = {
    findUnique: vi.fn(),
  };
  salle = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  };
  exigenceSalleActivite = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
  $transaction = vi.fn(async <T>(calls: Promise<T>[]): Promise<T[]> =>
    Promise.all(calls),
  );
}

function makeExigence(
  id: string,
  overrides: {
    semestreId?: string;
    affectationKey?: string;
    salleImposeeId?: string | null;
    creePar?: string;
  } = {},
) {
  return {
    id,
    semestreId: overrides.semestreId ?? 'uuid-semestre',
    affectationKey:
      overrides.affectationKey ??
      'groupe-1:module-1:type-1:enseignant-1',
    salleImposeeId: overrides.salleImposeeId ?? null,
    salleImposee: overrides.salleImposeeId ? { code: 'AMPHI-A' } : null,
    autorisees: [],
    creePar: overrides.creePar ?? 'uuid-user',
    creeLe: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('ExigencesSalleService (L3-43)', () => {
  let service: ExigencesSalleService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new ExigencesSalleService(prisma as unknown as PrismaService);
    vi.resetAllMocks();
  });

  describe('create', () => {
    const dto = {
      semestreId: 'uuid-semestre',
      affectationKey: 'groupe-1:module-1:type-1:enseignant-1',
      salleImposeeId: 'uuid-salle',
      autorisees: ['uuid-salle'],
    };

    it('crée une exigence de salle', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'uuid-semestre',
      } as any);
      prisma.salle.findUnique.mockResolvedValue({ id: 'uuid-salle' } as any);
      prisma.salle.findMany.mockResolvedValue([{ id: 'uuid-salle' }]);
      prisma.exigenceSalleActivite.findFirst.mockResolvedValue(null);
      prisma.exigenceSalleActivite.create.mockResolvedValue(
        makeExigence('uuid-exigence', { semestreId: 'uuid-semestre' }),
      );

      const result = await service.create(dto as any, 'uuid-user');

      expect(result.id).toBe('uuid-exigence');
      expect(result.semestreId).toBe('uuid-semestre');
      expect(result.affectationKey).toBe(dto.affectationKey);
      expect(prisma.exigenceSalleActivite.create).toHaveBeenCalledTimes(1);
      const createArgs = prisma.exigenceSalleActivite.create.mock.calls[0];
      expect(createArgs[0]).toMatchObject({
        data: {
          semestreId: 'uuid-semestre',
          affectationKey: dto.affectationKey,
          salleImposeeId: 'uuid-salle',
          creePar: 'uuid-user',
          autorisees: { create: [{ salleId: 'uuid-salle' }] },
        },
      });
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);
      await expect(service.create(dto as any, 'uuid-user')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lance NotFoundException si la salle imposée est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'uuid-semestre',
      } as any);
      prisma.salle.findUnique.mockResolvedValue(null);
      await expect(service.create(dto as any, 'uuid-user')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lance BadRequestException si une salle autorisée est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'uuid-semestre',
      } as any);
      prisma.salle.findUnique.mockResolvedValue({ id: 'uuid-salle' } as any);
      prisma.salle.findMany.mockResolvedValue([]);
      await expect(service.create(dto as any, 'uuid-user')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lance ConflictException si une exigence existe déjà', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'uuid-semestre',
      } as any);
      prisma.salle.findUnique.mockResolvedValue({ id: 'uuid-salle' } as any);
      prisma.salle.findMany.mockResolvedValue([{ id: 'uuid-salle' }]);
      prisma.exigenceSalleActivite.findFirst.mockResolvedValue(
        makeExigence('uuid-existant'),
      );
      await expect(service.create(dto as any, 'uuid-user')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
  describe('findAll', () => {
    it('retourne une liste paginée filtrée par semestre', async () => {
      const exigences = [makeExigence('e1'), makeExigence('e2')];
      prisma.exigenceSalleActivite.findMany.mockResolvedValue(exigences);
      prisma.exigenceSalleActivite.count.mockResolvedValue(2);

      const result = await service.findAll({
        semestreId: 'uuid-semestre',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.exigenceSalleActivite.findMany).toHaveBeenCalledWith({
        where: { semestreId: 'uuid-semestre' },
        skip: 0,
        take: 10,
        orderBy: { creeLe: 'desc' },
        include: expect.anything(),
      });
    });
  });

  describe('findOne', () => {
    it('retourne l\'exigence par ID', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(
        makeExigence('uuid-exigence'),
      );
      const result = await service.findOne('uuid-exigence');
      expect(result.id).toBe('uuid-exigence');
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(null);
      await expect(service.findOne('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met à jour l\'exigence', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(
        makeExigence('uuid-exigence'),
      );
      prisma.salle.findUnique.mockResolvedValue({ id: 'uuid-salle' } as any);
      prisma.salle.findMany.mockResolvedValue([{ id: 'uuid-salle' }]);
      prisma.exigenceSalleActivite.update.mockResolvedValue(
        makeExigence('uuid-exigence', { salleImposeeId: 'uuid-salle' }),
      );

      const result = await service.update('uuid-exigence', {
        salleImposeeId: 'uuid-salle',
        autorisees: ['uuid-salle'],
      } as any);

      expect(result.salleImposeeId).toBe('uuid-salle');
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(null);
      await expect(
        service.update('inconnu', {} as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime l\'exigence', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(
        makeExigence('uuid-exigence'),
      );
      await service.remove('uuid-exigence');
      expect(prisma.exigenceSalleActivite.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-exigence' },
      });
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.exigenceSalleActivite.findUnique.mockResolvedValue(null);
      await expect(service.remove('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

