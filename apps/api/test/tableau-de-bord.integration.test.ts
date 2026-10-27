// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'intégration du tableau de bord (L5-26)
// Couvre : GET /tableau-de-bord pour chaque rôle, actions prioritaires, contenu différencié.

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { INestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TableauDeBordController } from '../src/tableau-de-bord/tableau-de-bord.controller.js';
import { TableauDeBordService } from '../src/tableau-de-bord/tableau-de-bord.service.js';
import { PreparationService } from '../src/preparation/preparation.service.js';
import { VersionService } from '../src/versions/version.service.js';
import { ChargesService } from '../src/charges/charges.service.js';
import { NotificationsService } from '../src/notifications/notifications.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../src/policy/guards/permissions.guard.js';
import { RoleCode } from '@takt/db';

const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/src/generated/prisma/client/index.js'
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  email: `${crypto.randomUUID()}@example.tn`,
  passwordHash: 'hash',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
});

describe('Tableau de bord — intégration PostgreSQL (L5-26)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let app: INestApplication;
  let databaseUrl: string;
  let currentUser: { id: string; role: string; departments?: string[] } = {
    id: 'test-user',
    role: RoleCode.GESTIONNAIRE,
    departments: ['INFO'],
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    execSync(
      `pnpm exec prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script | psql "${databaseUrl}" -v ON_ERROR_STOP=1`,
      { cwd: path.resolve(__dirname, '../../../packages/db'), stdio: 'inherit' },
    );

    const adapter = new PrismaPg(databaseUrl);
    prisma = new GeneratedPrismaClient({ adapter }) as unknown as PrismaClient;
    await prisma.$connect();

    const module = await Test.createTestingModule({
      controllers: [TableauDeBordController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        {
          provide: PreparationService,
          useValue: {
            getPreparation: vi.fn().mockResolvedValue({
              semestreId: 'sem-1',
              peutGenerer: false,
              nbBloquants: 0,
              nbAvertissements: 0,
              nbInfos: 0,
              controles: [],
            }),
          },
        },
        {
          provide: VersionService,
          useValue: {
            getProvenance: vi.fn().mockResolvedValue({
              versionId: 'ver-1',
              versionNumero: '1.0',
              statut: 'PUBLIE',
              origine: 'GENERATION',
              generation: null,
              snapshots: [],
              chargeRuleSet: null,
              chargeRuleSets: [],
              adaptateur: null,
              seancesOrigine: null,
              at: '2026-10-26T10:00:00Z',
            }),
            getImpact: vi.fn().mockResolvedValue({
              versionId: 'ver-1',
              resume: { impactes: 0, nonImpactes: 0, reportees: 0 },
              departements: [],
            }),
          },
        },
        {
          provide: ChargesService,
          useValue: {
            findAllCharges: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 }),
          },
        },
        { provide: NotificationsService, useValue: {} },
        TableauDeBordService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(AlwaysAllowGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(AlwaysAllowGuard)
      .compile();

    app = module.createNestApplication();
    // Injecte un utilisateur factice dans chaque requête pour le decorator CurrentUser
    app.use((req: any, _res: any, next: any) => {
      req.user = currentUser;
      next();
    });
    await app.init();
  });

  function setCurrentUser(user: { id: string; role: string; departments?: string[] }) {
    currentUser = user;
  }

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await container?.stop();
  });

  beforeEach(async () => {
    setCurrentUser({ id: 'test-user', role: RoleCode.GESTIONNAIRE, departments: ['INFO'] });
    await prisma.notification.deleteMany();
    await prisma.avertissementAccepte.deleteMany();
    await prisma.conflit.deleteMany();
    await prisma.seance.deleteMany();
    await prisma.generation.deleteMany();
    await prisma.validationDepartement.deleteMany();
    await prisma.repartition.deleteMany();
    await prisma.versionEdt.deleteMany();
    await prisma.semestre.deleteMany();
    await prisma.departement.deleteMany();
    await prisma.enseignant.deleteMany();
    await prisma.annee.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /tableau-de-bord — GESTIONNAIRE / ADMINISTRATEUR', () => {
    it('retourne le contexte, les répartitions et les actions prioritaires', async () => {
      const annee = await prisma.annee.create({
        data: { code: '2026-2027', numero: 2026, statut: 'ACTIVE' },
      });
      const semestre = await prisma.semestre.create({
        data: { numero: 1, anneeId: annee.id },
      });
      const dep = await prisma.departement.create({
        data: { code: 'INFO', libelle: 'Informatique', anneeId: annee.id },
      });
      await prisma.repartition.create({
        data: {
          semestreId: semestre.id,
          departementId: dep.id,
          statut: 'VALIDEE',
        },
      });

      const res = await request(app.getHttpServer()).get(`/tableau-de-bord?semestreId=${semestre.id}`);

      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(body.contexte).toEqual({ annee: '2026-2027', semestre: '1' });
      expect(body.role).toBe(RoleCode.GESTIONNAIRE);
      expect(body.repartitions).toHaveLength(1);
      expect(body.repartitions[0]).toMatchObject({
        departementCode: 'INFO',
        statut: 'VALIDEE',
        avancement: '1/1',
      });
      expect(Array.isArray(body.actionsPrioritaires)).toBe(true);
      expect(body.actionsPrioritaires.length).toBeLessThanOrEqual(5);
    });

    it('retourne 404 si le semestre est introuvable', async () => {
      const res = await request(app.getHttpServer()).get(
        '/tableau-de-bord?semestreId=00000000-0000-0000-0000-000000000000',
      );
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /tableau-de-bord — RESPONSABLE_DEPARTEMENT (EX-TDB-02)', () => {
    it("ne voit que les répartitions de son département", async () => {
      setCurrentUser({ id: 'resp-1', role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['INFO'] });
      const annee = await prisma.annee.create({
        data: { code: '2026-2027', numero: 2026, statut: 'ACTIVE' },
      });
      const semestre = await prisma.semestre.create({
        data: { numero: 1, anneeId: annee.id },
      });
      const depInfo = await prisma.departement.create({
        data: { code: 'INFO', libelle: 'Informatique', anneeId: annee.id },
      });
      const depMath = await prisma.departement.create({
        data: { code: 'MATH', libelle: 'Mathématiques', anneeId: annee.id },
      });
      await prisma.repartition.create({
        data: { semestreId: semestre.id, departementId: depInfo.id, statut: 'VALIDEE' },
      });
      await prisma.repartition.create({
        data: { semestreId: semestre.id, departementId: depMath.id, statut: 'BROUILLON' },
      });

      const res = await request(app.getHttpServer()).get(`/tableau-de-bord?semestreId=${semestre.id}`);

      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(body.role).toBe(RoleCode.RESPONSABLE_DEPARTEMENT);
      expect(body.responsable).toBeDefined();
      expect(body.responsable.repartitions).toHaveLength(1);
      expect(body.responsable.repartitions[0].departementCode).toBe('INFO');
      expect(body.repartitions).toBeUndefined();
    });
  });

  describe('GET /tableau-de-bord — DIRECTION (EX-TDB-02)', () => {
    it('voit la version publiée par semestre et les exports', async () => {
      setCurrentUser({ id: 'dir-1', role: RoleCode.DIRECTION });
      const annee = await prisma.annee.create({
        data: { code: '2026-2027', numero: 2026, statut: 'ACTIVE' },
      });
      const semestre = await prisma.semestre.create({
        data: { numero: 1, anneeId: annee.id },
      });
      await prisma.versionEdt.create({
        data: {
          semestreId: semestre.id,
          numero: '3.0',
          statut: 'PUBLIE',
        },
      });

      const res = await request(app.getHttpServer()).get(`/tableau-de-bord?semestreId=${semestre.id}`);

      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(body.role).toBe(RoleCode.DIRECTION);
      expect(body.direction).toEqual({
        versionPubliee: '3.0',
        exports: 'true',
      });
    });
  });

  describe('?actions=all', () => {
    it('retourne la liste complète des actions (max 8)', async () => {
      const annee = await prisma.annee.create({
        data: { code: '2026-2027', numero: 2026, statut: 'ACTIVE' },
      });
      const semestre = await prisma.semestre.create({
        data: { numero: 1, anneeId: annee.id },
      });

      const res = await request(app.getHttpServer()).get(
        `/tableau-de-bord?semestreId=${semestre.id}&actions=all`,
      );

      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(Array.isArray(body.actionsPrioritaires)).toBe(true);
      expect(body.actionsPrioritaires.length).toBeLessThanOrEqual(8);
    });
  });
});

// Les guards sont contournés en test : on les remplace par des versions toujours ouvertes.
class AlwaysAllowGuard {
  canActivate() {
    return true;
  }
}
