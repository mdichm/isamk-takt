// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de lecture des séances (L3-11)
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SeancesService } from './seances.service.js';
import { RoleCode } from '@takt/db';

// ============================================
// SeancesService (L3-11)
// ============================================

describe('SeancesService', () => {
  let service: SeancesService;
  let prisma: any;

  const versionId = 'version-1';
  const seanceId = 'seance-1';

  const currentUserAdmin = {
    id: 'user-admin',
    role: RoleCode.ADMINISTRATEUR,
  } as any;

  const currentUserDirection = {
    id: 'user-direction',
    role: RoleCode.DIRECTION,
  } as any;

  const currentUserResp = {
    id: 'user-resp',
    role: RoleCode.RESPONSABLE_DEPARTEMENT,
    departments: ['dep-1'],
  } as any;

  beforeEach(async () => {
    prisma = {
      versionEdt: {
        findUnique: vi.fn(),
      },
      seance: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeancesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SeancesService);
  });

  describe('findSeancesByVersion', () => {
    it('retourne la liste paginée des séances d\'une version (Admin)', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: versionId,
        statut: 'PUBLIE',
      });
      prisma.seance.findMany.mockResolvedValue([
        {
          id: seanceId,
          versionId,
          semestreId: 'semestre-1',
          affectationKey: 'g-1:m-1:td:ens-1',
          rang: 1,
          tag: null,
          statut: 'NON_PLACEE',
          origine: 'MOTEUR',
          revision: 0,
          jour: null,
          creneauDebutId: null,
          nbCreneaux: 1,
          enseignantId: 'ens-1',
          salleId: null,
          seanceGroupes: [{ groupeId: 'groupe-1' }],
        },
      ]);
      prisma.seance.count.mockResolvedValue(1);

      const result = await service.findSeancesByVersion(
        versionId,
        { page: 1, limit: 10 },
        currentUserAdmin,
      );

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(seanceId);
      expect(result.data[0].groupes).toEqual(['groupe-1']);
      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { versionId },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('applique les filtres statut, jour, enseignant, salle', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: versionId,
        statut: 'PUBLIE',
      });
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.seance.count.mockResolvedValue(0);

      await service.findSeancesByVersion(
        versionId,
        {
          statut: 'PLACEE',
          jour: 'LUNDI',
          enseignantId: 'ens-1',
          salleId: 'salle-1',
        },
        currentUserAdmin,
      );

      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            versionId,
            statut: 'PLACEE',
            jour: 'LUNDI',
            enseignantId: 'ens-1',
            salleId: 'salle-1',
          },
        }),
      );
    });

    it('lève 404 si la version n\'existe pas', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);

      await expect(
        service.findSeancesByVersion(versionId, {}, currentUserAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève 404 pour la Direction sur une version BROUILLON', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: versionId,
        statut: 'BROUILLON',
      });

      await expect(
        service.findSeancesByVersion(versionId, {}, currentUserDirection),
      ).rejects.toThrow(NotFoundException);
    });

    it('autorise la Direction sur une version PUBLIE', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: versionId,
        statut: 'PUBLIE',
      });
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.seance.count.mockResolvedValue(0);

      await service.findSeancesByVersion(
        versionId,
        {},
        currentUserDirection,
      );

      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { versionId } }),
      );
    });

    it('applique le scope département pour un Responsable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: versionId,
        statut: 'PUBLIE',
      });
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.seance.count.mockResolvedValue(0);

      await service.findSeancesByVersion(
        versionId,
        {},
        currentUserResp,
      );

      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            versionId,
            seanceGroupes: expect.objectContaining({
              some: expect.objectContaining({
                groupe: expect.objectContaining({
                  niveau: expect.objectContaining({
                    formation: expect.objectContaining({
                      departementId: { in: ['dep-1'] },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('findSeanceById', () => {
    it('retourne le détail d\'une séance avec ses occupations', async () => {
      prisma.seance.findFirst.mockResolvedValue({
        id: seanceId,
        versionId,
        semestreId: 'semestre-1',
        affectationKey: 'g-1:m-1:td:ens-1',
        rang: 1,
        tag: null,
        statut: 'PLACEE',
        origine: 'MOTEUR',
        revision: 0,
        jour: 'LUNDI',
        creneauDebutId: 'creneau-1',
        nbCreneaux: 2,
        enseignantId: 'ens-1',
        salleId: 'salle-1',
        seanceGroupes: [{ groupeId: 'groupe-1' }],
        occupations: [
          {
            id: 'occ-1',
            versionId,
            seanceId,
            jour: 'LUNDI',
            creneauId: 'creneau-1',
            ressourceType: 'ENSEIGNANT',
            ressourceId: 'ens-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        version: { id: versionId, statut: 'PUBLIE' },
      });

      const result = await service.findSeanceById(seanceId, currentUserAdmin);

      expect(result.id).toBe(seanceId);
      expect(result.statut).toBe('PLACEE');
      expect(result.jour).toBe('LUNDI');
      expect(result.nbCreneaux).toBe(2);
      expect(result.groupes).toEqual(['groupe-1']);
      expect(result.occupations).toHaveLength(1);
      expect(result.occupations?.[0].ressourceType).toBe('ENSEIGNANT');
    });

    it('lève 404 si la séance n\'existe pas', async () => {
      prisma.seance.findFirst.mockResolvedValue(null);

      await expect(
        service.findSeanceById('inconnu', currentUserAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève 404 pour la Direction sur une séance de version BROUILLON', async () => {
      prisma.seance.findFirst.mockResolvedValue({
        id: seanceId,
        version: { id: versionId, statut: 'BROUILLON' },
      });

      await expect(
        service.findSeanceById(seanceId, currentUserDirection),
      ).rejects.toThrow(NotFoundException);
    });

    it('applique le scope département pour un Responsable', async () => {
      prisma.seance.findFirst.mockResolvedValue({
        id: seanceId,
        version: { id: versionId, statut: 'PUBLIE' },
      });

      await service.findSeanceById(seanceId, currentUserResp);

      expect(prisma.seance.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: seanceId,
            seanceGroupes: expect.objectContaining({
              some: expect.objectContaining({
                groupe: expect.objectContaining({
                  niveau: expect.objectContaining({
                    formation: expect.objectContaining({
                      departementId: { in: ['dep-1'] },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});