// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires du service d'import du résultat FET (L4-09)
// @takt/worker

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@takt/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@takt/db')>();
  return {
    ...actual,
    prisma: {
      generation: {
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      generationSeance: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock('@takt/conflict-engine', () => ({
  computeConflicts: vi.fn(() => []),
  computeSignature: vi.fn((ruleCode, _seanceIds, _objetType, _objetId, _) => `${ruleCode}:${_objetId}`),
  OccupancyIndex: class {},
  IndispoSet: class {},
  Reqs: class {},
  VerrouIndex: class {},
  ConflictContext: class {},
}));

import {
  importGenerationResult,
} from './fet-result-import.service.js';
import { prisma, GenerationStatut, SeanceStatut } from '@takt/db';
import { computeConflicts } from '@takt/conflict-engine';

const mockGenerationUpdate = vi.mocked(prisma.generation.update);
const mockGenerationFindUnique = vi.mocked(prisma.generation.findUnique);
const mockGenerationSeanceCreate = vi.mocked(prisma.generationSeance.create);

const mockPrisma = prisma as unknown as {
  generation: {
    update: typeof mockGenerationUpdate;
    findUnique: typeof mockGenerationFindUnique;
  };
  generationSeance: {
    create: typeof mockGenerationSeanceCreate;
  };
};

const mockComputeConflicts = computeConflicts as unknown as ReturnType<typeof vi.fn>;

const makeEngineInput = (overrides: Partial<{
  activities: Array<{
    id: string; code: string; groupIds: string[]; teacherIds: string[]; activityTagIds: string[]; durationInSlots: number;
  }>;
  periods: Array<{ id: string; dayIndex: number; slotIndex: number }>;
  rooms: Array<{ id: string; code: string }>;
}> = {}): any => ({
  activities: overrides.activities ?? [
    { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
    { id: 'A2', code: 'ACT2', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
  ],
  periods: overrides.periods ?? [
    { id: 'P1', dayIndex: 0, slotIndex: 0 },
    { id: 'P2', dayIndex: 0, slotIndex: 1 },
  ],
  rooms: overrides.rooms ?? [
    { id: 'R1', code: 'S101' },
  ],
});

const makeEngineSolution = (overrides: Partial<{
  placedActivities: Array<{ activityId: string; periodId: string; roomId: string | null }>;
  unplacedActivities: Array<{ activityId: string; reason: string }>;
  totalSoftConflicts: number;
  hardConflicts: Array<{ regleCode: string; type: string; severite: string; message: string; seanceIds: string[] }>;
}> = {}): any => ({
  placedActivities: overrides.placedActivities ?? [],
  unplacedActivities: overrides.unplacedActivities ?? [],
  totalSoftConflicts: overrides.totalSoftConflicts ?? 0,
  hardConflicts: overrides.hardConflicts ?? [],
  input: {} as any,
  rawResult: {} as any,
});

const makeRawResult = (resultText: string, exitCode: number = 0, durationMs: number = 100) => ({
  exitCode,
  resultText,
  durationMs,
});

beforeEach(() => {
  vi.clearAllMocks();

  mockPrisma.generation.findUnique.mockResolvedValue({
    id: 'gen-1',
    versionId: 'v-1',
    statut: 'RUNNING',
  } as any);

  mockPrisma.generationSeance.create.mockResolvedValue({} as any);
  mockPrisma.generation.update.mockResolvedValue({} as any);
  mockComputeConflicts.mockReturnValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('importGenerationResult — détermination du statut', () => {
  it('SUCCEEDED quand "Generation successful" et toutes placées', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
    });
    const solution = makeEngineSolution({
      placedActivities: [{ activityId: 'A1', periodId: 'P1', roomId: 'R1' }],
      unplacedActivities: [],
    });
    const raw = makeRawResult('Generation successful');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statut: GenerationStatut.SUCCEEDED }),
      }),
    );
  });

  it('SUCCEEDED_WITH_WARNINGS quand "Generation successful" mais activités non placées', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
        { id: 'A2', code: 'ACT2', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
    });
    const solution = makeEngineSolution({
      placedActivities: [{ activityId: 'A1', periodId: 'P1', roomId: 'R1' }],
      unplacedActivities: [{ activityId: 'A2', reason: 'Non placée par le moteur' }],
    });
    const raw = makeRawResult('Generation successful');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statut: GenerationStatut.SUCCEEDED_WITH_WARNINGS }),
      }),
    );
  });

  it('FAILED quand "Impossible"', async () => {
    const input = makeEngineInput();
    const solution = makeEngineSolution({
      unplacedActivities: [
        { activityId: 'A1', reason: 'Non placée par le moteur' },
        { activityId: 'A2', reason: 'Non placée par le moteur' },
      ],
    });
    const raw = makeRawResult('Impossible');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statut: GenerationStatut.FAILED }),
      }),
    );
  });

  it('FAILED quand exitCode === 1', async () => {
    const input = makeEngineInput();
    const solution = makeEngineSolution({ unplacedActivities: [] });
    const raw = makeRawResult('Erreur fichier', 1);

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statut: GenerationStatut.FAILED }),
      }),
    );
  });
});

describe('importGenerationResult — création des GenerationSeance', () => {
  it('crée une GenerationSeance PLACEE pour chaque activité placée', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
      periods: [{ id: 'P1', dayIndex: 0, slotIndex: 0 }],
      rooms: [{ id: 'R1', code: 'S101' }],
    });
    const solution = makeEngineSolution({
      placedActivities: [{ activityId: 'A1', periodId: 'P1', roomId: 'R1' }],
    });
    const raw = makeRawResult('Generation successful');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generationSeance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          generationId: 'gen-1',
          statut: SeanceStatut.PLACEE,
          salleId: 'R1',
          creneauDebutId: 'P1',
        }),
      }),
    );
  });

  it('crée une GenerationSeance NON_PLACEE pour chaque activité non placée', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
    });
    const solution = makeEngineSolution({
      unplacedActivities: [{ activityId: 'A1', reason: 'Non placée par le moteur' }],
    });
    const raw = makeRawResult('Generation successful');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockPrisma.generationSeance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          generationId: 'gen-1',
          statut: SeanceStatut.NON_PLACEE,
        }),
      }),
    );
  });
});

describe('importGenerationResult — mise à jour Generation', () => {
  it('met à jour statut, finishedAt, erreur, score, metrics', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
    });
    const solution = makeEngineSolution({
      placedActivities: [{ activityId: 'A1', periodId: 'P1', roomId: 'R1' }],
    });
    const raw = makeRawResult('Generation successful', 0, 500);

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    const call = mockPrisma.generation.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'gen-1' });
    expect(call.data.statut).toBe(GenerationStatut.SUCCEEDED);
    expect(call.data.finishedAt).toBeInstanceOf(Date);
    expect(call.data.erreur).toBeNull();
    expect(typeof call.data.score).toBe('number');
    expect(call.data.metrics).toEqual(expect.objectContaining({
      totalActivites: 1,
      placees: 1,
      nonPlacees: 0,
      tauxPlacement: 100,
      dureeMs: 500,
    }));
  });

  it('lance une erreur si la Generation est introuvable', async () => {
    mockPrisma.generation.findUnique.mockResolvedValue(null);

    const input = makeEngineInput();
    const solution = makeEngineSolution({ unplacedActivities: [] });
    const raw = makeRawResult('Generation successful');

    await expect(
      importGenerationResult('gen-inexistant', solution, input, 'v-1', raw),
    ).rejects.toThrow('Generation gen-inexistant introuvable');
  });
});

describe('importGenerationResult — appel ConflictEngine', () => {
  it('appelle computeConflicts avec les séances placées', async () => {
    const input = makeEngineInput({
      activities: [
        { id: 'A1', code: 'ACT1', groupIds: ['G1'], teacherIds: ['T1'], activityTagIds: ['AT1'], durationInSlots: 2 },
      ],
      periods: [{ id: 'P1', dayIndex: 0, slotIndex: 0 }],
      rooms: [{ id: 'R1', code: 'S101' }],
    });
    const solution = makeEngineSolution({
      placedActivities: [{ activityId: 'A1', periodId: 'P1', roomId: 'R1' }],
    });
    const raw = makeRawResult('Generation successful');

    await importGenerationResult('gen-1', solution, input, 'v-1', raw);

    expect(mockComputeConflicts).toHaveBeenCalled();
  });
});

