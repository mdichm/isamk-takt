// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de comparaison de générations (L4-18)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationsService } from './generations.service.js';

vi.mock('@takt/db', () => ({ PrismaClient: class {} }));

describe('GenerationsService', () => {
  let service: GenerationsService;
  let prisma: any;

  const generationId = 'gen-1';
  const versionId = 'v-1';

  const makePrisma = () => ({
    generation: {
      findMany: vi.fn(),
    },
    conflit: {
      findMany: vi.fn(),
    },
    verrouSeance: {
      findMany: vi.fn(),
    },
  });

  const makeGeneration = (overrides: Record<string, unknown> = {}) => ({
    id: generationId,
    versionId,
    statut: 'SUCCEEDED' as const,
    score: 85.5,
    metrics: { nbConflits: 2 },
    seances: [
      {
        affectationKey: 'MAT101#CM',
        rang: 1,
        jour: 'LUNDI',
        creneauDebutId: 'c1',
        salleId: 's1',
        enseignantId: 'e1',
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new GenerationsService(prisma as any);
  });

  describe('compare', () => {
    it('rejette si moins de 2 ids', async () => {
      await expect(service.compare(['gen-1'])).rejects.toThrow(
        'Entre 2 et 4 identifiants',
      );
    });

    it('rejette si plus de 4 ids', async () => {
      await expect(
        service.compare(['g1', 'g2', 'g3', 'g4', 'g5']),
      ).rejects.toThrow('Entre 2 et 4 identifiants');
    });

    it('lance 404 si une génération est introuvable', async () => {
      prisma.generation.findMany.mockResolvedValue([makeGeneration()]);
      await expect(service.compare(['gen-1', 'gen-2'])).rejects.toThrow(
        'introuvable',
      );
    });

    it('lance 422 si les snapshots diffèrent', async () => {
      prisma.generation.findMany.mockResolvedValue([
        {
          ...makeGeneration(),
          version: { id: 'v-1', snapshots: [{ snapshotId: 'snap-1' }] },
        },
        {
          ...makeGeneration({ id: 'gen-2', versionId: 'v-2' }),
          version: { id: 'v-2', snapshots: [{ snapshotId: 'snap-2' }] },
        },
      ]);
      await expect(service.compare(['gen-1', 'gen-2'])).rejects.toThrow(
        'SNAPSHOT_MISMATCH',
      );
    });

    it('retourne une comparaison valide quand tout est identique', async () => {
      const gen = makeGeneration();
      prisma.generation.findMany.mockResolvedValue([
        {
          ...gen,
          version: { id: versionId, snapshots: [{ snapshotId: 'snap-1' }] },
        },
        {
          ...makeGeneration({ id: 'gen-2', versionId: versionId }),
          version: { id: versionId, snapshots: [{ snapshotId: 'snap-1' }] },
        },
      ]);
      prisma.conflit.findMany.mockResolvedValue([]);
      prisma.verrouSeance.findMany.mockResolvedValue([]);

      const result = await service.compare(['gen-1', 'gen-2']);

      expect(result.generations).toHaveLength(2);
      expect(result.diff.seancesIdentiques).toContain('MAT101#CM#1');
      expect(result.diff.seancesDifferentes).toHaveLength(0);
      expect(result.diff.conflits.conflitsApparus).toEqual([]);
      expect(result.diff.verrous.verrousRespectes).toEqual([true, true]);
    });
  });
});
