// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires de VoeuxEvalService (L3-35).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VoeuxEvalService } from './voeux-eval.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { MetricsService } from '../common/metrics/metrics.service.js';
import { type ConflictContext, OccupancyIndex } from '@takt/conflict-engine';

const mockPrismaService = {
  versionEdt: {
    findUnique: vi.fn(),
  },
  enseignant: {
    findUnique: vi.fn(),
  },
  contrainteInstance: {
    findMany: vi.fn(),
  },
};

const mockConflitService = {
  getConflictContext: vi.fn(),
};

const mockMetricsService = {
  observeVoeuxSatisfaction: vi.fn(),
};

describe('VoeuxEvalService', () => {
  let service: VoeuxEvalService;

  const baseCtx: ConflictContext = {
    versionId: 'v1',
    grille: {
      consecutifs: (jour: string, creneauDebut: string, nb: number): string[] | null => {
        const start = parseInt(creneauDebut.replace('c', ''), 10);
        const slots: string[] = [];
        for (let i = 0; i < nb; i++) slots.push(`${jour}|c${start + i}`);
        return slots;
      },
    },
    occ: new OccupancyIndex(),
    indispo: {} as any,
    reqs: {} as any,
    snapshot: {} as any,
    verrous: {} as any,
    salles: new Map(),
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux: new Map(),
    groupeEffectifs: new Map(),
    covoiturageGroupes: new Map(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoeuxEvalService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConflitService, useValue: mockConflitService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get(VoeuxEvalService);
    vi.clearAllMocks();
  });

  it('retourne un score VoeuEvalScoreDto', async () => {
    mockPrismaService.versionEdt.findUnique.mockResolvedValue({
      id: 'v1',
      semestreId: 'sem1',
    });
    mockPrismaService.enseignant.findUnique.mockResolvedValue({
      id: 'e1',
    });
    mockPrismaService.contrainteInstance.findMany.mockResolvedValue([]);
    mockConflitService.getConflictContext.mockResolvedValue(baseCtx);

    const result = await service.score('v1', 'e1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    });

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('details');
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.enseignantId).toBe('e1');
    expect(result.semestreId).toBe('sem1');
    expect(mockMetricsService.observeVoeuxSatisfaction).toHaveBeenCalledWith(
      'e1',
      'sem1',
      expect.any(Number),
    );
  });

  it('lève NotFoundException si la version est introuvable', async () => {
    mockPrismaService.versionEdt.findUnique.mockResolvedValue(null);

    await expect(
      service.score('v1', 'e1', { enseignantId: 'e1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève NotFoundException si l\'enseignant est introuvable', async () => {
    mockPrismaService.versionEdt.findUnique.mockResolvedValue({
      id: 'v1',
      semestreId: 'sem1',
    });
    mockPrismaService.enseignant.findUnique.mockResolvedValue(null);

    await expect(
      service.score('v1', 'e1', { enseignantId: 'e1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delta retourne avant, apres et delta', async () => {
    mockPrismaService.versionEdt.findUnique.mockResolvedValue({
      id: 'v1',
      semestreId: 'sem1',
    });
    mockPrismaService.enseignant.findUnique.mockResolvedValue({
      id: 'e1',
    });
    mockPrismaService.contrainteInstance.findMany.mockResolvedValue([]);
    mockConflitService.getConflictContext.mockResolvedValue(baseCtx);

    const result = await service.delta('v1', 'e1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    });

    expect(result).toHaveProperty('delta');
    expect(result).toHaveProperty('avant');
    expect(result).toHaveProperty('apres');
    expect(result).toHaveProperty('details');
    expect(result.avant).toHaveProperty('score');
    expect(result.apres).toHaveProperty('score');
  });
});
