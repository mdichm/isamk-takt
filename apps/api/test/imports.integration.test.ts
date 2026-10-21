// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'intégration endpoint d'import (det-imp-06)
// Base de données réelle via testcontainers PostgreSQL 16.
// Couvre : CSV et XLSX, contrôle référentiel en dryRun, atomicité (rollback),
// audit écrit dans la même transaction.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { ImportsService } from '../src/imports/imports.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { AuditService } from '../src/audit/audit.service.js';
import { ImportEntity, ImportCsvDto } from '../src/imports/dto/import-csv.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return {
    PrismaClient: PrismaClientMock,
    Prisma: {
      JsonNull: {},
    },
  };
});

const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/src/generated/prisma/client/index.js'
);

function makeCsvFile(headers: string[], rows: string[][]): Express.Multer.File {
  const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const buffer = Buffer.from(content, 'utf-8');
  return {
    buffer,
    originalname: 'test.csv',
    mimetype: 'text/csv',
    size: buffer.length,
    fieldname: 'file',
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadableStream,
  };
}

function makeXlsxFile(headers: string[], rows: string[][]): Express.Multer.File {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const written = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const buffer = Buffer.isBuffer(written) ? written : Buffer.from(written);
  return {
    buffer,
    originalname: 'test.xlsx',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    fieldname: 'file',
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadableStream,
  };
}

const INVALID_UUID = '00000000-0000-0000-0000-000000000000';

describe('Imports endpoint integration (det-imp-06)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;
  let service: ImportsService;

  let anneeId: string;
  let departementId: string;
  let formationId: string;
  let niveauId: string;
  let semestreId: string;
  let typeId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    const migrationsDir = path.resolve(
      __dirname,
      '../../../packages/db/prisma/migrations',
    );
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter(
        (f) => fs.statSync(path.join(migrationsDir, f)).isDirectory(),
      )
      .sort((a, b) => a.localeCompare(b));

    for (const migration of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        execSync(`psql "${databaseUrl}" -f "${migrationPath}"`, {
          stdio: 'inherit',
        });
      }
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new GeneratedPrismaClient({ adapter });
    await prisma.$connect();

    // Certaines tables du référentiel (annees, semestres) ne sont pas créées
    // par les migrations SQL brutes existantes (bug préexistant). On les crée
    // manuellement avant le seed pour que les tests d'import puissent s'appuyer
    // sur le référentiel complet.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "annees" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "numero" INTEGER NOT NULL,
        "code" TEXT NOT NULL,
        "nbSemaines" INTEGER NOT NULL DEFAULT 14,
        "statut" TEXT NOT NULL DEFAULT 'PREPARATION',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "annees_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "annees_code_key" ON "annees"("code");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "annees_numero_key" ON "annees"("numero");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "semestres" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "numero" INTEGER NOT NULL,
        "anneeId" UUID NOT NULL,
        "nbSemaines" INTEGER NOT NULL DEFAULT 14,
        "grilleParams" JSON,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "semestres_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "semestres_anneeId_numero_key" ON "semestres"("anneeId", "numero");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "semestres_anneeId_idx" ON "semestres"("anneeId");
    `);

    // Table activity_tags + colonne activity_tag_id sur types_enseignement
    // (migration 20261017_10_activity_tags, créée manuellement car absente des
    //  migrations brutes exécutées plus haut).
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "activity_tags" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "code" TEXT NOT NULL,
        "libelle" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "activity_tags_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "activity_tags_code_key" ON "activity_tags"("code");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "activity_tags_isActive_idx" ON "activity_tags"("isActive");
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "types_enseignement" ADD COLUMN IF NOT EXISTS "activityTagId" UUID;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'types_enseignement_activityTagId_fkey'
        ) THEN
          ALTER TABLE "types_enseignement"
            ADD CONSTRAINT "types_enseignement_activityTagId_fkey"
            FOREIGN KEY ("activityTagId") REFERENCES "activity_tags"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Table groupes + enum GroupeType (migration(s) absente(s) des migrations brutes).
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupeType') THEN
          CREATE TYPE "GroupeType" AS ENUM ('SECTION', 'GROUPE', 'SOUS_GROUPE');
        END IF;
      END $$;
    `);

    // Colonne originId sur enseignants (absente du schema Prisma mais utilisee par le service).
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "enseignants" ADD COLUMN IF NOT EXISTS "originId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "groupes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "niveauId" UUID NOT NULL,
        "semestreId" UUID NOT NULL,
        "parentId" UUID,
        "type" "GroupeType" NOT NULL DEFAULT 'SECTION',
        "code" TEXT NOT NULL,
        "libelle" TEXT NOT NULL,
        "ordre" INTEGER NOT NULL DEFAULT 0,
        "effectif" INTEGER NOT NULL DEFAULT 0,
        "originId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'groupes_niveauId_fkey'
        ) THEN
          ALTER TABLE "groupes"
            ADD CONSTRAINT "groupes_niveauId_fkey"
            FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'groupes_semestreId_fkey'
        ) THEN
          ALTER TABLE "groupes"
            ADD CONSTRAINT "groupes_semestreId_fkey"
            FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'groupes_parentId_fkey'
        ) THEN
          ALTER TABLE "groupes"
            ADD CONSTRAINT "groupes_parentId_fkey"
            FOREIGN KEY ("parentId") REFERENCES "groupes"("id");
        END IF;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "groupes_niveauId_semestreId_code_key" ON "groupes"("niveauId", "semestreId", "code");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "groupes_semestreId_idx" ON "groupes"("semestreId");
    `);

    service = new ImportsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
    );

    const annee = await prisma.annee.create({
      data: { numero: 2026, code: '2026-2027', statut: 'PREPARATION' },
    });
    anneeId = annee.id;

    const departement = await prisma.departement.create({
      data: { anneeId, code: 'INFO', libelle: 'Informatique', ordre: 1 },
    });
    departementId = departement.id;

    const formation = await prisma.formation.create({
      data: {
        departementId,
        code: 'L3-INFO',
        libelle: 'Licence 3 Informatique',
        ordre: 1,
      },
    });
    formationId = formation.id;

    const niveau = await prisma.niveau.create({
      data: { formationId, code: 'L3', libelle: 'Licence 3', ordre: 1 },
    });
    niveauId = niveau.id;

    const semestre = await prisma.semestre.create({
      data: { anneeId, numero: 1 },
    });
    semestreId = semestre.id;

    const type = await prisma.typeEnseignement.create({
      data: { code: 'CM', libelle: 'Cours Magistral' },
    });
    typeId = type.id;
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // Nettoyage best-effort : certaines tables de jointure peuvent ne pas
    // exister si leurs migrations brutes ont échoué (dépendance manquante).
    // On ignore les erreurs "table does not exist" (code P0002).
    const safeDelete = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (e: any) {
        const isMissingTable =
          e?.code === 'P0002' ||
          e?.code === '42P01' ||
          /does not exist/.test(e?.message ?? '');
        if (!isMissingTable) throw e;
      }
    };

    await safeDelete(() => prisma.enseignantModule.deleteMany());
    await safeDelete(() => prisma.decharge.deleteMany());
    await safeDelete(() => prisma.indisponibilite.deleteMany());
    await safeDelete(() => prisma.moduleVolume.deleteMany());
    await safeDelete(() => prisma.salleEquipement.deleteMany());
    await safeDelete(() => prisma.salleActivityTag.deleteMany());
    await safeDelete(() => prisma.exigenceEquipement.deleteMany());
    await safeDelete(() => prisma.enseignant.deleteMany());
    await safeDelete(() => prisma.salle.deleteMany());
    await safeDelete(() => prisma.groupe.deleteMany());
    await safeDelete(() => prisma.module.deleteMany());
  });

  const dtoDryRun: ImportCsvDto = { dryRun: true };
  const dtoConfirm = (importId?: string): ImportCsvDto => ({
    dryRun: false,
    confirmation: true,
    importId,
  });

  // ============================================================
  // ENSEIGNANTS
  // ============================================================
  describe('Enseignants', () => {
    const headers = [
      'matricule',
      'nom',
      'prenom',
      'email',
      'departementId',
      'anneeId',
      'gradeId',
      'telephone',
    ];
    const makeValidRow = () => [
      'E001',
      'Doe',
      'John',
      'john.doe@example.com',
      departementId,
      anneeId,
      '',
      '0123456789',
    ];

    it('dryRun CSV : aperçu retourné, aucune écriture en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        totalLignes: number;
        resume: { erreur: number; ajout: number };
      };
      expect(preview.totalLignes).toBe(1);
      expect(preview.resume.erreur).toBe(0);
      expect(preview.resume.ajout).toBeGreaterThan(0);

      const count = await prisma.enseignant.count();
      expect(count).toBe(0);
    });

    it('dryRun XLSX : aperçu retourné, aucune écriture en base', async () => {
      const file = makeXlsxFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as { resume: { erreur: number } };
      expect(preview.resume.erreur).toBe(0);

      const count = await prisma.enseignant.count();
      expect(count).toBe(0);
    });

    it('dryRun : contrôle référentiel - anneeId invalide => erreur ligne par ligne', async () => {
      const badRow = [
        'E002',
        'Smith',
        'Jane',
        'jane@example.com',
        departementId,
        INVALID_UUID,
        '',
        '',
      ];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: {
          action: string;
          colonne: string;
          valeur: string;
          message: string;
          correctionAttendue?: string;
        }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurAnnee = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'anneeId',
      );
      expect(erreurAnnee).toBeDefined();
      expect(erreurAnnee?.message).toContain('Annee');
      expect(erreurAnnee?.correctionAttendue).toBeDefined();
    });

    it('dryRun : contrôle référentiel - departementId invalide => erreur', async () => {
      const badRow = [
        'E003',
        'Smith',
        'Jane',
        'jane@example.com',
        INVALID_UUID,
        anneeId,
        '',
        '',
      ];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurDept = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'departementId',
      );
      expect(erreurDept).toBeDefined();
    });

    it('confirmation : application effective, lignes créées en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoConfirm(),
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const applied = result as { crees: string[]; ignores: string[] };
      expect(applied.crees.length).toBe(1);

      const enseignant = await prisma.enseignant.findFirst({
        where: { matricule: 'E001', anneeId },
      });
      expect(enseignant).toBeDefined();
      expect(enseignant?.email).toBe('john.doe@example.com');
    });

    it('atomicité : ligne en erreur bloque tout l\'import (rollback total)', async () => {
      const badRow = [
        '',
        'NoMatricule',
        'X',
        'noemail@example.com',
        departementId,
        anneeId,
        '',
        '',
      ];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);

      await expect(
        service.importCsv(ImportEntity.ENSEIGNANTS, dtoConfirm(), file, '00000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow();

      const count = await prisma.enseignant.count();
      expect(count).toBe(0);
    });

    it('audit : entrée écrite dans la même transaction après application', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const importId = `import-audit-enseignant-${Date.now()}`;
      await service.importCsv(
        ImportEntity.ENSEIGNANTS,
        dtoConfirm(importId),
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const audits = await prisma.auditLog.findMany({
        where: { action: 'IMPORT_CSV_ENSEIGNANTS', objetId: importId },
      });
      expect(audits.length).toBeGreaterThan(0);
      expect(audits[0]!.motif).toContain('Import CSV/XLSX');
      expect(audits[0]!.nouvelleValeur).toMatchObject({
        entite: 'enseignants',
        importId,
      });
    });
  });

  // ============================================================
  // SALLES
  // ============================================================
  describe('Salles', () => {
    const headers = [
      'code',
      'libelle',
      'capaciteMax',
      'siteId',
      'departementId',
      'typeSalleId',
    ];
    const makeValidRow = () => ['AMPHI-A', 'Amphithéâtre A', '200', '', departementId, ''];

    it('dryRun CSV : aperçu retourné, aucune écriture en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.SALLES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        totalLignes: number;
        resume: { erreur: number; ajout: number };
      };
      expect(preview.totalLignes).toBe(1);
      expect(preview.resume.erreur).toBe(0);
      expect(preview.resume.ajout).toBeGreaterThan(0);

      const count = await prisma.salle.count();
      expect(count).toBe(0);
    });

    it('dryRun : contrôle référentiel - departementId invalide => erreur', async () => {
      const badRow = ['S002', 'Salle B', '50', '', INVALID_UUID, ''];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.SALLES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string; message: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurDept = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'departementId',
      );
      expect(erreurDept).toBeDefined();
      expect(erreurDept?.message).toContain('Departement');
    });

    it('confirmation : application effective, lignes créées en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.SALLES,
        dtoConfirm(),
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const applied = result as { crees: string[] };
      expect(applied.crees.length).toBe(1);

      const salle = await prisma.salle.findFirst({
        where: { code: 'AMPHI-A', departementId },
      });
      expect(salle).toBeDefined();
      expect(salle?.capaciteMax).toBe(200);
    });

    it('atomicité : departementId invalide bloque tout (rollback)', async () => {
      const badRow = ['S002', 'Salle B', '50', '', INVALID_UUID, ''];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);

      await expect(
        service.importCsv(ImportEntity.SALLES, dtoConfirm(), file, '00000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow();

      const count = await prisma.salle.count();
      expect(count).toBe(0);
    });
  });

  // ============================================================
  // GROUPES
  // ============================================================
  describe('Groupes', () => {
    const headers = [
      'code',
      'libelle',
      'semestreId',
      'niveauId',
      'parentId',
      'effectif',
    ];
    const makeValidRow = () => [
      'L3-INFO-S1',
      'L3 Informatique S1',
      semestreId,
      niveauId,
      '',
      '30',
    ];

    it('dryRun CSV : aperçu retourné, aucune écriture en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.GROUPES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        totalLignes: number;
        resume: { erreur: number; ajout: number };
      };
      expect(preview.totalLignes).toBe(1);
      expect(preview.resume.erreur).toBe(0);
      expect(preview.resume.ajout).toBeGreaterThan(0);

      const count = await prisma.groupe.count();
      expect(count).toBe(0);
    });

    it('dryRun : contrôle référentiel - niveauId invalide => erreur', async () => {
      const badRow = ['G002', 'Groupe B', semestreId, INVALID_UUID, '', '30'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.GROUPES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string; message: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurNiveau = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'niveauId',
      );
      expect(erreurNiveau).toBeDefined();
      expect(erreurNiveau?.message).toContain('Niveau');
    });

    it('dryRun : contrôle référentiel - semestreId invalide => erreur', async () => {
      const badRow = ['G003', 'Groupe C', INVALID_UUID, niveauId, '', '30'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.GROUPES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurSemestre = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'semestreId',
      );
      expect(erreurSemestre).toBeDefined();
    });

    it('confirmation : application effective, lignes créées en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.GROUPES,
        dtoConfirm(),
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const applied = result as { crees: string[] };
      expect(applied.crees.length).toBe(1);

      const groupe = await prisma.groupe.findFirst({
        where: { code: 'L3-INFO-S1', niveauId, semestreId },
      });
      expect(groupe).toBeDefined();
      expect(groupe?.niveauId).toBe(niveauId);
      expect(groupe?.semestreId).toBe(semestreId);
    });

    it('atomicité : niveauId invalide bloque tout (rollback)', async () => {
      const badRow = ['G002', 'Groupe B', semestreId, INVALID_UUID, '', '30'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);

      await expect(
        service.importCsv(ImportEntity.GROUPES, dtoConfirm(), file, '00000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow();

      const count = await prisma.groupe.count();
      expect(count).toBe(0);
    });
  });

  // ============================================================
  // MODULES
  // ============================================================
  describe('Modules', () => {
    const headers = [
      'code',
      'libelle',
      'niveauId',
      'typeId',
      'semestreNumero',
    ];
    const makeValidRow = () => [
      'INFO301',
      'Algorithmique avancée',
      niveauId,
      typeId,
      '1',
    ];

    it('dryRun CSV : aperçu retourné, aucune écriture en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.MODULES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        totalLignes: number;
        resume: { erreur: number; ajout: number };
      };
      expect(preview.totalLignes).toBe(1);
      expect(preview.resume.erreur).toBe(0);
      expect(preview.resume.ajout).toBeGreaterThan(0);

      const count = await prisma.module.count();
      expect(count).toBe(0);
    });

    it('dryRun : contrôle référentiel - niveauId invalide => erreur', async () => {
      const badRow = ['INFO302', 'Module B', INVALID_UUID, typeId, '1'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.MODULES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string; message: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurNiveau = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'niveauId',
      );
      expect(erreurNiveau).toBeDefined();
      expect(erreurNiveau?.message).toContain('Niveau');
    });

    it('dryRun : contrôle référentiel - typeId invalide => erreur', async () => {
      const badRow = ['INFO303', 'Module C', niveauId, INVALID_UUID, '1'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);
      const result = await service.importCsv(
        ImportEntity.MODULES,
        dtoDryRun,
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const preview = result as {
        resume: { erreur: number };
        items: { action: string; colonne: string }[];
      };
      expect(preview.resume.erreur).toBeGreaterThan(0);

      const erreurType = preview.items.find(
        (i) => i.action === 'erreur' && i.colonne === 'typeId',
      );
      expect(erreurType).toBeDefined();
    });

    it('confirmation : application effective, lignes créées en base', async () => {
      const file = makeCsvFile(headers, [makeValidRow()]);
      const result = await service.importCsv(
        ImportEntity.MODULES,
        dtoConfirm(),
        file,
        '00000000-0000-0000-0000-000000000001',
      );

      const applied = result as { crees: string[] };
      expect(applied.crees.length).toBe(1);

      const module = await prisma.module.findFirst({
        where: { code: 'INFO301', niveauId, semestreNumero: 1 },
      });
      expect(module).toBeDefined();
      expect(module?.niveauId).toBe(niveauId);
      expect(module?.typeId).toBe(typeId);
    });

    it('atomicité : typeId invalide bloque tout (rollback)', async () => {
      const badRow = ['INFO303', 'Module C', niveauId, INVALID_UUID, '1'];
      const file = makeCsvFile(headers, [makeValidRow(), badRow]);

      await expect(
        service.importCsv(ImportEntity.MODULES, dtoConfirm(), file, '00000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow();

      const count = await prisma.module.count();
      expect(count).toBe(0);
    });
  });
});