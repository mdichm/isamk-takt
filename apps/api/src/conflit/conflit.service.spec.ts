// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Conflits (L3-17, L3-32)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflitService } from './conflit.service.js';

vi.mock('@takt/db', () => ({ PrismaClient: class {} }));

describe('ConflitService', () => {
  let service: ConflitService;
  let prisma: any;
  let occupancyCache: any;

  const versionBrouillon = {
    id: 'v-brouillon',
    semestreId: 's1',
    statut: 'BROUILLON',
  };
  const versionEdition = {
    id: 'v-edition',
    semestreId: 's1',
    statut: 'EDITION',
  };
  const versionPublie = {
    id: 'v-publie',
    semestreId: 's1',
    statut: 'PUBLIE',
  };
  const versionArchive = {
    id: 'v-archive',
    semestreId: 's2',
    statut: 'ARCHIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      versionEdt: {
        findMany: vi.fn(),
      },
    };
    occupancyCache = {};
    service = new ConflitService(prisma as any, occupancyCache as any);
    vi.spyOn(service, 'recomputeConflits').mockResolvedValue([]);
  });

  describe('recalculerConflitsSemestre', () => {
    it("recalcule toutes les versions non publiees quand aucun semestre n'est fourni", async () => {
      prisma.versionEdt.findMany.mockResolvedValue([versionBrouillon, versionEdition]);

      await service.recalculerConflitsSemestre();

      expect(prisma.versionEdt.findMany).toHaveBeenCalledWith({
        where: { statut: { notIn: ['PUBLIE', 'ARCHIVE'] } },
        select: { id: true },
      });
      expect(service.recomputeConflits).toHaveBeenCalledTimes(2);
      expect(service.recomputeConflits).toHaveBeenCalledWith('v-brouillon');
      expect(service.recomputeConflits).toHaveBeenCalledWith('v-edition');
    });

    it('filtre par semestre quand semestreId est fourni', async () => {
      prisma.versionEdt.findMany.mockResolvedValue([versionBrouillon]);

      await service.recalculerConflitsSemestre('s1');

      expect(prisma.versionEdt.findMany).toHaveBeenCalledWith({
        where: {
          semestreId: 's1',
          statut: { notIn: ['PUBLIE', 'ARCHIVE'] },
        },
        select: { id: true },
      });
      expect(service.recomputeConflits).toHaveBeenCalledTimes(1);
      expect(service.recomputeConflits).toHaveBeenCalledWith('v-brouillon');
    });

    it('n\'appelle pas recomputeConflits pour les versions PUBLIE ou ARCHIVE', async () => {
      prisma.versionEdt.findMany.mockResolvedValue([]);

      await service.recalculerConflitsSemestre('s1');

      expect(service.recomputeConflits).not.toHaveBeenCalled();
    });
  });
});
