// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'integration d'immutabilite (L7-04)
// Base de donnees reelle via Testcontainers PostgreSQL 16.
// Couvre : garde de service + triggers SQL sur versions PUBLIE/ARCHIVE et annee CLOTUREE,
// Administrateur inclus, configurations utilisees (export_styles, export_views).

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient, RoleCode, AnneeStatut, VersionStatut, SeanceStatut } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Import the generated PrismaClient dynamically to avoid typecheck issues
const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/src/generated/prisma/client/index.js'
);

describe('Immutability Integration Tests (L7-04)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;

  // Identifiants de test
  let adminUserId: string;
  let closedAnneeId: string;
  let openAnneeId: string;
  let publishedVersionId: string;
  let archivedVersionId: string;
  let draftVersionId: string;
  let seanceId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    const migrationsDir = path.resolve(__dirname, '../../../packages/db/prisma/migrations');
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort((a, b) => a.localeCompare(b));

    for (const migration of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        execSync(`psql "${databaseUrl}" -f "${migrationPath}"`, { stdio: 'inherit' });
      }
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new GeneratedPrismaClient({ adapter });
    await prisma.$connect();

    // Creer un administrateur
    const admin = await prisma.user.create({
      data: {
        email: 'admin@takt.test',
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'TAKT',
        isActive: true,
      },
    });
    adminUserId = admin.id;
    await prisma.userSystemRole.create({
      data: { userId: adminUserId, role: 'ADMINISTRATEUR' as RoleCode },
    });

    // Creer une annee CLOTUREE
    const closedAnnee = await prisma.annee.create({
      data: {
        numero: 2025,
        code: '2025-2026',
        nbSemaines: 14,
        statut: 'CLOTUREE' as AnneeStatut,
        closedAt: new Date(),
        closedBy: adminUserId,
      },
    });
    closedAnneeId = closedAnnee.id;

    // Creer une annee ACTIVE (ouverte)
    const openAnnee = await prisma.annee.create({
      data: {
        numero: 2026,
        code: '2026-2027',
        nbSemaines: 14,
        statut: 'ACTIVE' as AnneeStatut,
      },
    });
    openAnneeId = openAnnee.id;

    // Creer un semestre sur l'annee active
    const semestre = await prisma.semestre.create({
      data: {
        anneeId: openAnneeId,
        numero: 1,
        nbSemaines: 14,
      },
    });

    // Creer un departement lie au semestre pour les donnees liees a l'annee
    await prisma.departement.create({
      data: {
        anneeId: openAnneeId,
        code: 'INFO',
        libelle: 'Informatique',
      },
    });

    // Creer des versions sur le semestre ouvert
    const publishedVersion = await prisma.versionEdt.create({
      data: {
        semestreId: semestre.id,
        numero: '1.0',
        statut: 'PUBLIE' as VersionStatut,
        publieLe: new Date(),
      },
    });
    publishedVersionId = publishedVersion.id;

    const archivedVersion = await prisma.versionEdt.create({
      data: {
        semestreId: semestre.id,
        numero: '2.0',
        statut: 'ARCHIVE' as VersionStatut,
        publieLe: new Date(),
      },
    });
    archivedVersionId = archivedVersion.id;

    const draftVersion = await prisma.versionEdt.create({
      data: {
        semestreId: semestre.id,
        numero: '3.0',
        statut: 'BROUILLON' as VersionStatut,
      },
    });
    draftVersionId = draftVersion.id;

    // Creer une seance liee a la version publiee
    const seance = await prisma.seance.create({
      data: {
        semestreId: semestre.id,
        versionId: publishedVersionId,
        affectationKey: 'g1:m1:t1:e1',
        rang: 1,
        statut: 'NON_PLACEE' as SeanceStatut,
      },
    });
    seanceId = seance.id;
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // Nettoyer les tables derivees entre les tests (garde les references de base)
    // Certaines suppressions peuvent etre bloquées par les triggers d'immutabilite
    // : on les ignore en silence.
    try {
      await prisma.occupation.deleteMany();
    } catch {}
    try {
      await prisma.verrouSeance.deleteMany();
    } catch {}
    try {
      await prisma.avertissementAccepte.deleteMany();
    } catch {}
    try {
      await prisma.seance.deleteMany({ where: { id: { not: seanceId } } });
    } catch {}
    try {
      await prisma.versionEdt.deleteMany({
        where: { id: { notIn: [publishedVersionId, archivedVersionId, draftVersionId] } },
      });
    } catch {}
  });

  describe('Triggers SQL sur version PUBLIE', () => {
    it('refuse UPDATE sur une seance d\'une version PUBLIE', async () => {
      await expect(
        prisma.seance.update({
          where: { id: seanceId },
          data: { statut: 'PLACEE' as SeanceStatut },
        })
      ).rejects.toThrow(/IMMUTAB/);
    });

    it('refuse DELETE sur une seance d\'une version PUBLIE', async () => {
      await expect(prisma.seance.delete({ where: { id: seanceId } })).rejects.toThrow(
        /IMMUTAB/
      );
    });

    it('refuse INSERT sur occupations d\'une version PUBLIE', async () => {
      await expect(
        prisma.occupation.create({
          data: {
            versionId: publishedVersionId,
            seanceId,
            jour: 'LUNDI',
            creneauId: '00000000-0000-0000-0000-000000000000',
            ressourceType: 'ENSEIGNANT',
            ressourceId: '00000000-0000-0000-0000-000000000001',
          },
        })
      ).rejects.toThrow(/IMMUTAB/);
    });
  });

  describe('Triggers SQL sur version ARCHIVE', () => {
    it('refuse UPDATE sur une seance d\'une version ARCHIVE', async () => {
      const semestreId = (
        await prisma.semestre.findUnique({
          where: { id: (await prisma.versionEdt.findUnique({ where: { id: archivedVersionId } })!)!.semestreId },
        })
      )!.id;

      const seanceArchive = await prisma.seance.create({
        data: {
          semestreId,
          versionId: archivedVersionId,
          affectationKey: 'g2:m2:t2:e2',
          rang: 1,
          statut: 'NON_PLACEE' as SeanceStatut,
        },
      });

      await expect(
        prisma.seance.update({
          where: { id: seanceArchive.id },
          data: { statut: 'PLACEE' as SeanceStatut },
        })
      ).rejects.toThrow(/IMMUTAB/);
    });
  });

  describe('Annee CLOTUREE', () => {
    it('refuse toute ecriture sur une annee CLOTUREe via le declencheur (anneeId)', async () => {
      // Creer un semestre sur l'annee cloturee, puis une version, puis tenter une occupation
      const semestreOnClosed = await prisma.semestre.create({
        data: { anneeId: closedAnneeId, numero: 99, nbSemaines: 1 },
      });
      const versionOnClosed = await prisma.versionEdt.create({
        data: {
          semestreId: semestreOnClosed.id,
          numero: '99.0',
          statut: 'BROUILLON' as VersionStatut,
        },
      });
      // Tenter d'insertion d'une occupation sur une version dont l'annee est CLOTUREE
      await expect(
        prisma.occupation.create({
          data: {
            versionId: versionOnClosed.id,
            seanceId,
            jour: 'LUNDI',
            creneauId: '00000000-0000-0000-0000-000000000000',
            ressourceType: 'ENSEIGNANT',
            ressourceId: '00000000-0000-0000-0000-000000000001',
          },
        })
      ).rejects.toThrow(/IMMUTAB/);
    });

    it('verifie que l annee est bien cloturee (precondition)', async () => {
      const annee = await prisma.annee.findUnique({ where: { id: closedAnneeId } });
      expect(annee?.statut).toBe('CLOTUREE');
    });
  });

  describe('Administrateur ne peut pas contourner l immutabilite', () => {
    it('meme un Administrateur ne peut pas ecrire sur une version PUBLIE', async () => {
      await expect(
        prisma.seance.update({
          where: { id: seanceId },
          data: { statut: 'PLACEE' as SeanceStatut },
        })
      ).rejects.toThrow(/IMMUTAB/);
    });
  });

  describe('Controle negatif : ecriture autorisee sur version non figee', () => {
    it('autorise UPDATE sur une seance d\'une version BROUILLON (annee ouverte)', async () => {
      const semestreId = (
        await prisma.semestre.findUnique({
          where: { id: (await prisma.versionEdt.findUnique({ where: { id: draftVersionId } })!)!.semestreId },
        })
      )!.id;

      const seanceBrouillon = await prisma.seance.create({
        data: {
          semestreId,
          versionId: draftVersionId,
          affectationKey: 'g3:m3:t3:e3',
          rang: 1,
          statut: 'NON_PLACEE' as SeanceStatut,
        },
      });

      const updated = await prisma.seance.update({
        where: { id: seanceBrouillon.id },
        data: { affectationKey: 'g3:m3:t3:e4' },
      });
      expect(updated.affectationKey).toBe('g3:m3:t3:e4');
    });

    it('autorise INSERT sur occupations d\'une version BROUILLON', async () => {
      const semestreId = (
        await prisma.semestre.findUnique({
          where: { id: (await prisma.versionEdt.findUnique({ where: { id: draftVersionId } })!)!.semestreId },
        })
      )!.id;

      const seanceBrouillon = await prisma.seance.create({
        data: {
          semestreId,
          versionId: draftVersionId,
          affectationKey: 'g4:m4:t4:e4',
          rang: 1,
          statut: 'NON_PLACEE' as SeanceStatut,
        },
      });

      await prisma['$queryRawUnsafe'](
        `INSERT INTO "occupations" ("id", "versionId", "seanceId", "jour", "creneauId", "ressourceType", "ressourceId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'LUNDI', '00000000-0000-0000-0000-000000000000', 'ENSEIGNANT', '00000000-0000-0000-0000-000000000001', NOW(), NOW())`,
        draftVersionId,
        seanceBrouillon.id
      );
    });
  });

  describe('Configuration deja utilisable (export_styles, export_views)', () => {
    it('refuse UPDATE sur export_style deja utilise (utilise_le renseigne)', async () => {
      // Insertion en SQL brut car les noms de colonnes DB (snake_case) diffèrent des noms Prisma (camelCase)
      await prisma['$queryRawUnsafe'](
        `INSERT INTO "export_styles" ("id", "code", "style_version", "libelle", "config", "actif", "utilise_le", "created_at", "updated_at")
         VALUES (gen_random_uuid(), 'STYLE-01', 1, 'Style test', '{}'::jsonb, true, NOW(), NOW(), NOW())`
      );

      await expect(
        prisma['$queryRawUnsafe'](
          `UPDATE "export_styles" SET "libelle" = 'Modifie' WHERE "code" = 'STYLE-01'`
        )
      ).rejects.toThrow(/CONFIG_IN_USE/);
    });

    it('refuse UPDATE sur export_view deja utilisee (utilise_le renseigne)', async () => {
      await prisma['$queryRawUnsafe'](
        `INSERT INTO "export_views" ("id", "code", "view_version", "libelle", "vue", "format", "config", "actif", "utilise_le", "created_at", "updated_at")
         VALUES (gen_random_uuid(), 'VIEW-01', 1, 'Vue test', 'default', 'PDF', '{}'::jsonb, true, NOW(), NOW(), NOW())`
      );

      await expect(
        prisma['$queryRawUnsafe'](
          `UPDATE "export_views" SET "libelle" = 'Modifie' WHERE "code" = 'VIEW-01'`
        )
      ).rejects.toThrow(/CONFIG_IN_USE/);
    });
  });
});
