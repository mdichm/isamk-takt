// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service du tableau de bord (L5-26)

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TableauDeBordService } from './tableau-de-bord.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { VersionService } from '../versions/version.service.js';
import { ChargesService } from '../charges/charges.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TableauDeBordQueryDto } from './dto/tableau-de-bord-query.dto.js';
import { RoleCode, DecisionDepartement } from '@takt/db';
import type { VersionStatut } from '@takt/db';

const makePrismaMock = (overrides: Record<string, unknown> = {}) => ({
  semestre: { findUnique: vi.fn(), findFirst: vi.fn().mockResolvedValue(null) },
  annee: { findFirst: vi.fn().mockResolvedValue(null) },
  repartition: { findMany: vi.fn().mockResolvedValue([]) },
  versionEdt: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
  validationDepartement: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
  conflit: { count: vi.fn().mockResolvedValue(0) },
  seance: { count: vi.fn().mockResolvedValue(0) },
  avertissementAccepte: { count: vi.fn().mockResolvedValue(0) },
  generation: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
  notification: { findFirst: vi.fn().mockResolvedValue(null) },
  demandeModification: { findMany: vi.fn().mockResolvedValue([]) },
  ...overrides,
});

const makePreparationMock = (overrides: Record<string, unknown> = {}) => ({
  getPreparation: vi.fn().mockResolvedValue({
    semestreId: 'sem-1',
    peutGenerer: false,
    nbBloquants: 0,
    nbAvertissements: 0,
    nbInfos: 0,
    controles: [],
  }),
  ...overrides,
});

const makeVersionMock = (overrides: Record<string, unknown> = {}) => ({
  getProvenance: vi.fn(),
  getImpact: vi.fn(),
  ...overrides,
});

const makeChargesMock = (overrides: Record<string, unknown> = {}) => ({
  findAllCharges: vi.fn(),
  ...overrides,
});

const makeNotificationsMock = (overrides: Record<string, unknown> = {}) => ({
  ...overrides,
});

const makeCurrentUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  role: RoleCode.GESTIONNAIRE,
  departments: ['DEP1'],
  ...overrides,
});

describe('TableauDeBordService (L5-26)', () => {
  let service: TableauDeBordService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let preparation: ReturnType<typeof makePreparationMock>;
  let versions: ReturnType<typeof makeVersionMock>;
  let charges: ReturnType<typeof makeChargesMock>;
  let notifications: ReturnType<typeof makeNotificationsMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    preparation = makePreparationMock();
    versions = makeVersionMock();
    charges = makeChargesMock();
    notifications = makeNotificationsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableauDeBordService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: preparation },
        { provide: VersionService, useValue: versions },
        { provide: ChargesService, useValue: charges },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(TableauDeBordService);
  });

  describe('getTableauDeBord — rôle GESTIONNAIRE', () => {
    it('retourne le contexte avec année et semestre', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.contexte).toEqual({ annee: '2026-2027', semestre: '1' });
      expect(result.role).toBe(RoleCode.GESTIONNAIRE);
    });

    it('retourne les répartitions par département', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.repartition.findMany.mockResolvedValue([
        {
          id: 'rep-1',
          semestreId: 'sem-1',
          departementId: 'dep-1',
          statut: 'VALIDEE',
          departement: { code: 'INFO' },
        },
        {
          id: 'rep-2',
          semestreId: 'sem-1',
          departementId: 'dep-2',
          statut: 'BROUILLON',
          departement: { code: 'MATH' },
        },
      ]);

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.repartitions).toEqual([
        { departementCode: 'INFO', statut: 'VALIDEE', avancement: '1/1' },
        { departementCode: 'MATH', statut: 'BROUILLON', avancement: '0/1' },
      ]);
    });

    it('utilise le semestre actif par défaut quand semestreId est omis', async () => {
      prisma.annee.findFirst.mockResolvedValue({
        id: 'annee-1',
        code: '2026-2027',
        numero: 2026,
        statut: 'ACTIVE',
        semestres: [{ id: 'sem-1', numero: 1 }],
      });

      await service.getTableauDeBord(
        {} as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(prisma.semestre.findUnique).not.toHaveBeenCalled();
      expect(prisma.annee.findFirst).toHaveBeenCalledWith({
        where: { statut: 'ACTIVE' },
        include: { semestres: { orderBy: { numero: 'asc' }, take: 1 } },
      });
    });

    it('lance NotFoundException si le semestre n existe pas', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(
        service.getTableauDeBord(
          { semestreId: 'inexistant' } as TableauDeBordQueryDto,
          makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('préparation (réutilise 4.12)', () => {
    it('extrait bloquants, avertissements et principaux du service de préparation', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      preparation.getPreparation.mockResolvedValue({
        semestreId: 'sem-1',
        peutGenerer: true,
        nbBloquants: 0,
        nbAvertissements: 3,
        nbInfos: 0,
        controles: [
          {
            numero: 4,
            libelle: 'Répartition validée',
            niveau: 'BLOQUANT',
            statut: 'NON_CONFORME',
            anomalies: [
              {
                niveau: 'BLOQUANT',
                objet: 'Répartition',
                departement: 'INFO',
                activite: null,
                regle: null,
                explication: 'Répartition non validée',
                action: 'Valider la répartition',
                lien: '/repartitions',
              },
            ],
          },
        ],
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.preparation).toEqual({
        bloquants: 0,
        avertissements: 3,
        principaux: ['4 - Répartition non validée'],
      });
    });
  });

  describe('version en préparation', () => {
    it('retourne la version EDITION avec ses indicateurs', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst.mockResolvedValue({
        id: 'ver-1',
        semestreId: 'sem-1',
        numero: '1.0',
        statut: 'EDITION' as VersionStatut,
        updatedAt: new Date(),
      });
      prisma.conflit.count.mockResolvedValue(2);
      prisma.seance.count.mockResolvedValue(5);
      prisma.avertissementAccepte.count.mockResolvedValue(3);

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.versionEnPreparation).toEqual({
        id: 'ver-1',
        statut: 'EDITION',
        conflitsBloquants: 2,
        nonPlacees: 5,
        avertissementsNonAcceptes: 3,
      });
    });

    it('retourne des zéros quand aucune version en préparation', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst.mockResolvedValue(null);

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.versionEnPreparation).toEqual({
        id: '',
        statut: 'BROUILLON',
        conflitsBloquants: 0,
        nonPlacees: 0,
        avertissementsNonAcceptes: 0,
      });
    });
  });

  describe('générations', () => {
    it('sépare en cours et récentes', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.generation.findMany.mockResolvedValue([
        { id: 'gen-1', statut: 'QUEUED', createdAt: new Date('2026-10-26T10:00:00Z') },
        { id: 'gen-2', statut: 'RUNNING', createdAt: new Date('2026-10-26T11:00:00Z') },
        { id: 'gen-3', statut: 'SUCCEEDED', createdAt: new Date('2026-10-25T10:00:00Z') },
        { id: 'gen-4', statut: 'FAILED', createdAt: new Date('2026-10-24T10:00:00Z') },
      ]);

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.generations!.enCours).toHaveLength(2);
      expect(result.generations!.recentes).toHaveLength(2);
    });
  });

  describe('version publiée avec provenance', () => {
    it('retourne la version publiée et sa provenance', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'ver-publiee',
          semestreId: 'sem-1',
          numero: '2.0',
          statut: 'PUBLIE' as VersionStatut,
          updatedAt: new Date('2026-10-26T10:00:00Z'),
        });
      versions.getProvenance.mockResolvedValue({
        versionId: 'ver-publiee',
        versionNumero: '2.0',
        statut: 'PUBLIE',
        origine: 'GENERATION',
        generation: {
          id: 'gen-1',
          statut: 'SUCCEEDED',
          mode: 'AUTOMATIQUE',
          engine: 'fet',
          engineVersion: '7.11.1',
          perimetreHash: 'sha256:...',
          creeLe: '2026-10-26T10:00:00Z',
          profil: { id: 'prof-1', code: 'defaut', numero: 2, libelle: 'Défaut/2' },
        },
        snapshots: [],
        chargeRuleSet: { id: 'rs-1', code: 'RS-1', libelle: 'Règles 2026', version: '1' },
        chargeRuleSets: [],
        adaptateur: null,
        seancesOrigine: null,
        at: '2026-10-26T10:00:00Z',
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.versionPubliee).toMatchObject({
        numero: '2.0',
        provenance: {
          generationId: 'gen-1',
          profil: { code: 'defaut', numero: 2, libelle: 'Défaut/2' },
          chargeRuleSet: { code: 'RS-1', libelle: 'Règles 2026' },
          fet: '7.11.1',
        },
      });
    });
  });

  describe('actions prioritaires (ST §4.17)', () => {
    it('limite à 5 actions par défaut', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.validationDepartement.findFirst.mockResolvedValue(null);
      prisma.repartition.findMany.mockResolvedValue([
        { id: 'rep-1', semestreId: 'sem-1', departementId: 'dep-1', statut: 'VALIDEE', departement: { code: 'INFO' } },
      ]);
      preparation.getPreparation.mockResolvedValue({
        semestreId: 'sem-1',
        peutGenerer: false,
        nbBloquants: 1,
        nbAvertissements: 0,
        controles: [],
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        false,
      );

      expect(result.actionsPrioritaires!.length).toBeLessThanOrEqual(5);
    });

    it('retourne toutes les actions avec ?actions=all', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.validationDepartement.findFirst.mockResolvedValue(null);
      prisma.repartition.findMany.mockResolvedValue([
        { id: 'rep-1', semestreId: 'sem-1', departementId: 'dep-1', statut: 'VALIDEE', departement: { code: 'INFO' } },
      ]);
      preparation.getPreparation.mockResolvedValue({
        semestreId: 'sem-1',
        peutGenerer: false,
        nbBloquants: 1,
        nbAvertissements: 0,
        controles: [],
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1', actions: 'all' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.GESTIONNAIRE }),
        true,
      );

      expect(result.actionsPrioritaires!.length).toBeLessThanOrEqual(8);
    });
  });

  describe('rôle RESPONSABLE_DEPARTEMENT (EX-TDB-02)', () => {
    it("ne voit que les répartitions de son département", async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.repartition.findMany.mockResolvedValue([
        {
          id: 'rep-1',
          semestreId: 'sem-1',
          departementId: 'dep-1',
          statut: 'VALIDEE',
          departement: { code: 'INFO' },
        },
      ]);

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['INFO'] }),
        false,
      );

      expect(result.responsable).toBeDefined();
      expect(result.responsable!.repartitions).toHaveLength(1);
      expect(result.responsable!.repartitions[0].departementCode).toBe('INFO');
      expect(result.repartitions).toBeUndefined();
      expect(result.versionEnPreparation).toBeUndefined();
    });
  });

  describe('rôle DIRECTION (EX-TDB-02)', () => {
    it('voit la version publiée par semestre', async () => {
      prisma.semestre.findUnique.mockResolvedValue({
        id: 'sem-1',
        numero: 1,
        annee: { code: '2026-2027', numero: 2026 },
      });
      prisma.versionEdt.findFirst.mockResolvedValue({
        id: 'ver-1',
        semestreId: 'sem-1',
        numero: '3.0',
        statut: 'PUBLIE' as VersionStatut,
        updatedAt: new Date(),
      });

      const result = await service.getTableauDeBord(
        { semestreId: 'sem-1' } as TableauDeBordQueryDto,
        makeCurrentUser({ role: RoleCode.DIRECTION }),
        false,
      );

      expect(result.direction).toEqual({
        versionPubliee: '3.0',
        exports: 'true',
      });
    });
  });
});
