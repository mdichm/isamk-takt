// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires de EvalsService (L3-27).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvalsService } from './evals.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { type ConflictContext } from '@takt/conflict-engine';
import { OccupancyIndex } from '@takt/conflict-engine';

const mockPrismaService = {
  seance: {
    findFirst: vi.fn(),
  },
};

const mockConflitService = {
  getConflictContext: vi.fn(),
};

describe('EvalsService', () => {
  let service: EvalsService;

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

  const currentUser = { id: 'u1', role: 'GESTIONNAIRE', departments: [] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvalsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConflitService, useValue: mockConflitService },
      ],
    }).compile();

    service = module.get(EvalsService);
    vi.clearAllMocks();
  });

  it('retourne un score EvalScoreDto', async () => {
    const seance = {
      id: 's1',
      versionId: 'v1',
      enseignantId: 'e1',
      salleId: 'r1',
      nbCreneaux: 2,
      statut: 'PLACEE',
      seanceGroupes: [{ groupeId: 'g1' }],
    };
    const ctx = { ...baseCtx };
    ctx.occ.build([
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c3', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c3', ressourceType: 'GROUPE', ressourceId: 'g1' },
    ]);

    mockPrismaService.seance.findFirst.mockResolvedValue(seance);
    mockConflitService.getConflictContext.mockResolvedValue(ctx);

    const result = await service.score('v1', 's1', {
      seanceId: 's1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    }, currentUser);

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('details');
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details.length).toBe(4);
  });

  it('lève NotFoundException si la séance est introuvable', async () => {
    mockPrismaService.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.score('v1', 's1', { seanceId: 's1', jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' }, currentUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delta retourne avant, apres et delta', async () => {
    const seance = {
      id: 's1',
      versionId: 'v1',
      enseignantId: 'e1',
      salleId: 'r1',
      nbCreneaux: 2,
      statut: 'PLACEE',
      seanceGroupes: [{ groupeId: 'g1' }],
    };
    const ctx = { ...baseCtx };

    mockPrismaService.seance.findFirst.mockResolvedValue(seance);
    mockConflitService.getConflictContext.mockResolvedValue(ctx);

    const result = await service.delta('v1', 's1', {
      seanceId: 's1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    }, currentUser);

    expect(result).toHaveProperty('delta');
    expect(result).toHaveProperty('avant');
    expect(result).toHaveProperty('apres');
    expect(result).toHaveProperty('details');
    expect(result.avant).toHaveProperty('score');
    expect(result.apres).toHaveProperty('score');
  });
});