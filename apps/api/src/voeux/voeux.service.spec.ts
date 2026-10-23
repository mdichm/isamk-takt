// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Vœux (L3-33)
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ContrainteInstanceService } from '../contraintes/contrainte-instance.service.js';
import { VoeuxService } from './voeux.service.js';
import {
  CreateVoeuDto,
  UpdateVoeuDto,
  VoeuQueryDto,
  VOEU_POIDS_VALUES,
} from './dto/voeux.dto.js';

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  semestre = {
    findUnique: vi.fn(),
  };
  enseignant = {
    findUnique: vi.fn(),
  };
  contrainteDefinition = {
    findUnique: vi.fn(),
  };
  contrainteInstance = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  };
  indisponibilite = {
    findMany: vi.fn(),
  };
  $transaction = vi.fn(async <T>(calls: Promise<T>[]): Promise<T[]> =>
    Promise.all(calls),
  );
}

// ============================================
// Mock ContrainteInstanceService
// ============================================

class MockContrainteInstanceService {
  createContrainteInstance = vi.fn();
  updateContrainteInstance = vi.fn();
  removeContrainteInstance = vi.fn();
}

function makeInstance(
  id: string,
  overrides: {
    semestreId?: string;
    enseignantId?: string;
    definitionId?: string;
    nature?: 'REGLE' | 'VOEU';
    poids?: number;
    actif?: boolean;
    creePar?: string;
    creeLe?: Date;
    params?: Record<string, unknown>;
    commentaire?: string | null;
  } = {},
) {
  return {
    id,
    semestreId: overrides.semestreId ?? 'uuid-semestre',
    enseignantId: overrides.enseignantId ?? 'uuid-ens-1',
    definitionId: overrides.definitionId ?? 'uuid-def-voeu',
    nature: overrides.nature ?? 'VOEU',
    poids: overrides.poids ?? 50,
    actif: overrides.actif ?? true,
    creePar: overrides.creePar ?? 'system',
    creeLe: overrides.creeLe ?? new Date('2026-01-01T00:00:00Z'),
    params: overrides.params ?? { code: 'TEACHER_AVOID_SLOT' },
    commentaire: overrides.commentaire ?? null,
  };
}

describe('VoeuxService (L3-33)', () => {
  let service: VoeuxService;
  let prisma: MockPrismaService;
  let contrainteInstanceService: MockContrainteInstanceService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    contrainteInstanceService = new MockContrainteInstanceService();
    service = new VoeuxService(
      prisma as unknown as PrismaService,
      contrainteInstanceService as unknown as ContrainteInstanceService,
    );
    vi.resetAllMocks();
  });
  describe('create', () => {
    const dto: CreateVoeuDto = {
      semestreId: 'uuid-semestre',
      enseignantId: 'uuid-ens-1',
      code: 'TEACHER_AVOID_SLOT',
      params: { jour: 'LUNDI', creneauDebut: '08:00', creneauFin: '10:00' },
      poids: 50,
      commentaire: 'Test vœu',
      actif: true,
    };

    const definition = { id: 'uuid-def-voeu', code: 'TEACHER_AVOID_SLOT' };

    beforeEach(() => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      prisma.enseignant.findUnique.mockResolvedValue({ id: 'uuid-ens-1' } as any);
      prisma.contrainteDefinition.findUnique.mockResolvedValue(definition as any);
      prisma.contrainteInstance.findFirst.mockResolvedValue(null);
      prisma.indisponibilite.findMany.mockResolvedValue([]);
      contrainteInstanceService.createContrainteInstance.mockResolvedValue(
        makeInstance('uuid-voeu', { semestreId: 'uuid-semestre' }),
      );
    });

    it('cree un vœu sans avertissement quand pas de conflit', async () => {
      const result = await service.create(dto);

      expect(result.id).toBe('uuid-voeu');
      expect(result.semestreId).toBe('uuid-semestre');
      expect(result.enseignantId).toBe('uuid-ens-1');
      expect(result.code).toBe('TEACHER_AVOID_SLOT');
      expect(result.poids).toBe(50);
      expect(result.avertissement).toBeUndefined();
      expect(contrainteInstanceService.createContrainteInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          semestreId: 'uuid-semestre',
          enseignantId: 'uuid-ens-1',
          nature: 'VOEU',
          poids: 50,
        }),
        'system',
      );
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lance NotFoundException si l enseignant est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: 'uuid-semestre' } as any);
      prisma.enseignant.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lance BadRequestException si le poids est invalide', async () => {
      await expect(
        service.create({ ...dto, poids: 100 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lance ConflictException si un vœu existe deja', async () => {
      prisma.contrainteInstance.findFirst.mockResolvedValue(
        makeInstance('uuid-existant'),
      );

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('retourne un avertissement quand le vœu contredit une indisponibilité', async () => {
      prisma.indisponibilite.findMany.mockResolvedValue([
        { id: 'uuid-ind', jour: 'LUNDI', creneauId: 'uuid-creneau' },
      ]);

      const result = await service.create(dto);

      expect(result.avertissement).toBeDefined();
      expect(result.avertissement).toContain('indisponibilité');
    });
  });

  describe('findAll', () => {
    it('retourne une liste paginée filtree par semestre', async () => {
      const instances = [makeInstance('v1'), makeInstance('v2')];
      prisma.contrainteInstance.findMany.mockResolvedValue(instances);
      prisma.contrainteInstance.count.mockResolvedValue(2);

      const result = await service.findAll({
        semestreId: 'uuid-semestre',
        page: 1,
        limit: 10,
      } as VoeuQueryDto);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.contrainteInstance.findMany).toHaveBeenCalledWith({
        where: { nature: 'VOEU', actif: true, semestreId: 'uuid-semestre' },
        skip: 0,
        take: 10,
        orderBy: { creeLe: 'desc' },
        include: { definition: true },
      });
    });
  });

  describe('findOne', () => {
    it('retourne le vœu par ID', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(
        makeInstance('uuid-voeu'),
      );

      const result = await service.findOne('uuid-voeu');

      expect(result.id).toBe('uuid-voeu');
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lance NotFoundException si l instance n est pas un vœu', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(
        makeInstance('uuid-regle', { nature: 'REGLE' }),
      );

      await expect(service.findOne('uuid-regle')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met a jour le vœu', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(
        makeInstance('uuid-voeu'),
      );
      contrainteInstanceService.updateContrainteInstance.mockResolvedValue(
        makeInstance('uuid-voeu', { poids: 75 }),
      );

      const result = await service.update('uuid-voeu', { poids: 75 } as UpdateVoeuDto);

      expect(result.poids).toBe(75);
      expect(contrainteInstanceService.updateContrainteInstance).toHaveBeenCalledWith(
        'uuid-voeu',
        expect.objectContaining({ poids: 75 }),
        'system',
      );
    });

    it('lance BadRequestException si le poids est invalide', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(
        makeInstance('uuid-voeu'),
      );

      await expect(
        service.update('uuid-voeu', { poids: 100 } as UpdateVoeuDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(null);

      await expect(
        service.update('inconnu', { poids: 75 } as UpdateVoeuDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime le vœu', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(
        makeInstance('uuid-voeu'),
      );
      contrainteInstanceService.removeContrainteInstance.mockResolvedValue(undefined);

      await service.remove('uuid-voeu');

      expect(contrainteInstanceService.removeContrainteInstance).toHaveBeenCalledWith(
        'uuid-voeu',
      );
    });

    it('lance NotFoundException si introuvable', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
