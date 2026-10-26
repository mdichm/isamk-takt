// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'intégration de la file e-mail (L5-22)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { EmailProcessorService } from '../src/notifications/email/email-processor.service.js';
import { SmtpEmailService, type MailTransport } from '../src/notifications/email/smtp-email.service.js';

const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/src/generated/prisma/client/index.js'
);

const smtpConfig = {
  enabled: true,
  host: 'cck.rnu.tn',
  port: 587,
  secure: false,
  user: 'user',
  password: 'pass',
  from: 'notifications@takt.tn',
  fromName: 'TAKT',
  appUrl: 'https://takt.local',
};

describe('File e-mail — intégration PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let transport: MailTransport;
  let processor: EmailProcessorService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    const databaseUrl = container.getConnectionUri();

    // L'historique des migrations du dépôt n'est pas reproductible sur une base
    // vierge (dérive antérieure à L5-21). Le schéma courant est donc poussé par
    // Prisma pour tester le comportement, tandis que les deux migrations L5-21
    // et L5-22 sont validées isolément dans un schéma PostgreSQL dédié.
    execSync(
      `pnpm exec prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script | psql "${databaseUrl}" -v ON_ERROR_STOP=1`,
      { cwd: path.resolve(__dirname, '../../../packages/db'), stdio: 'inherit' },
    );

    execSync(`psql "${databaseUrl}" -c "CREATE SCHEMA migration_test"`, {
      stdio: 'inherit',
    });
    execSync(
      `psql "${databaseUrl}" -c "CREATE TABLE migration_test.users (id UUID PRIMARY KEY); CREATE TABLE migration_test.versions_edt (id UUID PRIMARY KEY); CREATE TABLE migration_test.demandes_modification (id UUID PRIMARY KEY)"`,
      { stdio: 'inherit' },
    );
    const migrationsDir = path.resolve(__dirname, '../../../packages/db/prisma/migrations');
    for (const migration of [
      '20261026_0000_l5_21_notif_core',
      '20261026_0001_l5_22_email_queue',
    ]) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      execSync(
        `PGOPTIONS='-c search_path=migration_test' psql "${databaseUrl}" -v ON_ERROR_STOP=1 -f "${migrationPath}"`,
        { stdio: 'inherit' },
      );
    }

    prisma = new GeneratedPrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
    await prisma.$connect();

    transport = { sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }) };
    const metrics = {
      incrementEmailSent: vi.fn(),
      incrementEmailAttempts: vi.fn(),
      incrementEmailErrors: vi.fn(),
      incrementEmailFinalFailures: vi.fn(),
      setEmailPending: vi.fn(),
      setEmailFailed: vi.fn(),
    };
    processor = new EmailProcessorService(
      prisma as never,
      new SmtpEmailService(smtpConfig, transport),
      metrics as never,
    );
  }, 120000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    vi.clearAllMocks();
  });

  it('applique la migration L5-22 et persiste les transitions d’envoi', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'destinataire@example.tn',
        passwordHash: 'hash',
        firstName: 'Destinataire',
        lastName: 'TAKT',
      },
    });
    const notification = await prisma.notification.create({
      data: {
        destinataireId: user.id,
        evenement: 'VERSION_CREEE',
        titre: 'Nouvelle version',
        lien: '/versions/test',
      },
    });

    expect(notification.emailTentatives).toBe(0);
    expect(notification.emailEnvoyeLe).toBeNull();

    await processor.process({ notificationId: notification.id, retryCount: 0 });

    const sent = await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
    expect(sent.emailStatut).toBe('ENVOYE');
    expect(sent.emailTentatives).toBe(1);
    expect(sent.emailEnvoyeLe).toBeInstanceOf(Date);
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });

  it('ne renvoie pas un e-mail après redémarrage quand le statut est déjà terminal', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'deja-envoye@example.tn',
        passwordHash: 'hash',
        firstName: 'Déjà',
        lastName: 'Envoyé',
      },
    });
    const notification = await prisma.notification.create({
      data: {
        destinataireId: user.id,
        evenement: 'VERSION_CREEE',
        titre: 'Nouvelle version',
        emailStatut: 'ENVOYE',
        emailTentatives: 1,
      },
    });

    await processor.process({ notificationId: notification.id, retryCount: 0 });

    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  it('marque ECHEC au troisième échec et conserve une erreur sanitisée', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'echec@example.tn',
        passwordHash: 'hash',
        firstName: 'Échec',
        lastName: 'SMTP',
      },
    });
    const notification = await prisma.notification.create({
      data: {
        destinataireId: user.id,
        evenement: 'VERSION_CREEE',
        titre: 'Nouvelle version',
      },
    });
    vi.mocked(transport.sendMail).mockRejectedValueOnce(
      new Error('échec SMTP : password super-secret'),
    );

    await expect(
      processor.process({ notificationId: notification.id, retryCount: 2 }),
    ).rejects.toThrow();

    const failed = await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
    expect(failed.emailStatut).toBe('ECHEC');
    expect(failed.emailTentatives).toBe(1);
    expect(failed.emailErreur).not.toContain('super-secret');
  });
});
