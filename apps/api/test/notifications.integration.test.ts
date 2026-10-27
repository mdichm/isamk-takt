// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'intégration des notifications par événement (L5-25)
// Couvre : chaque événement du catalogue SF §14 → notification + e-mail,
// panne SMTP simulée n'interrompt pas le workflow, absence de donnée de charge.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { NotificationsService } from '../src/notifications/notifications.service.js';
import { EvenementNotification, CATALOGUE_EVENEMENTS, type EvenementCatalogueEntry } from '../src/notifications/notifications.constants.js';
import { EmailDispatcherService } from '../src/notifications/email/email-dispatcher.service.js';
import { EmailProcessorService } from '../src/notifications/email/email-processor.service.js';
import { SmtpEmailService, type MailTransport } from '../src/notifications/email/smtp-email.service.js';
import { MetricsService } from '../src/common/metrics/metrics.service.js';

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  email: `${crypto.randomUUID()}@example.tn`,
  passwordHash: 'hash',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
});

describe('Notifications par événement — intégration PostgreSQL (L5-25)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let notifications: NotificationsService;
  let dispatcher: EmailDispatcherService;
  let processor: EmailProcessorService;
  let transport: MailTransport;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    const databaseUrl = container.getConnectionUri();

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
    const metrics = new MetricsService();
    notifications = new NotificationsService(prisma as never);
    dispatcher = new EmailDispatcherService(
      prisma as never,
      { setEmailPending: vi.fn(), setEmailFailed: vi.fn() } as never,
      { upsert: vi.fn().mockResolvedValue({ inserted: 1, updated: 0, jobs: [] }) } as never,
    );
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

  describe('Chaque événement du catalogue SF §14', () => {
    const tousLesEvenements: readonly EvenementNotification[] = Object.keys(
      CATALOGUE_EVENEMENTS,
    ) as EvenementNotification[];

    it('crée une notification par destinataire avec le bon emailStatut selon emailRequis', async () => {
      const destinataire = await prisma.user.create({ data: makeUser() });

      for (const evenement of tousLesEvenements) {
        const entry: EvenementCatalogueEntry = CATALOGUE_EVENEMENTS[evenement];
        const attenduStatut = entry.emailRequis ? 'EN_ATTENTE' : 'NON_APPLICABLE';

        await notifications.creerNotifications(prisma as never, [
          {
            destinataireId: destinataire.id,
            evenement,
            titre: `Titre pour ${evenement}`,
            lien: `/versions/test-${evenement}`,
          },
        ]);

        const notif = await prisma.notification.findFirst({
          where: {
            destinataireId: destinataire.id,
            evenement,
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(notif).not.toBeNull();
        expect(notif?.emailStatut).toBe(attenduStatut);
        expect(notif?.titre).toBe(`Titre pour ${evenement}`);
        expect(notif?.lien).toBe(`/versions/test-${evenement}`);

        await prisma.notification.delete({ where: { id: notif!.id } });
      }
    });


    it('résout les destinataires par rôle et périmètre pour chaque événement', async () => {
      const enseignant = await prisma.user.create({ data: makeUser({ email: 'enseignant@example.tn' }) });
      const responsable = await prisma.user.create({ data: makeUser({ email: 'responsable@example.tn' }) });
      const chef = await prisma.user.create({ data: makeUser({ email: 'chef@example.tn' }) });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: enseignant.id, evenement: EvenementNotification.VERSION_CREEE, titre: 'v', lien: '/x' },
        { destinataireId: responsable.id, evenement: EvenementNotification.VERSION_CREEE, titre: 'v', lien: '/x' },
      ]);
      const vcreee = await prisma.notification.findMany({
        where: { evenement: EvenementNotification.VERSION_CREEE },
        orderBy: { destinataireId: 'asc' },
      });
      expect(vcreee).toHaveLength(2);
      expect(vcreee.map((n) => n.destinataireId).sort()).toEqual([enseignant.id, responsable.id].sort());
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.VERSION_CREEE } });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: chef.id, evenement: EvenementNotification.DEMANDE_CREEE, titre: 'd', lien: '/d' },
        { destinataireId: responsable.id, evenement: EvenementNotification.DEMANDE_CREEE, titre: 'd', lien: '/d' },
      ]);
      const dcreee = await prisma.notification.findMany({
        where: { evenement: EvenementNotification.DEMANDE_CREEE },
      });
      expect(dcreee).toHaveLength(2);
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.DEMANDE_CREEE } });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: enseignant.id, evenement: EvenementNotification.DEMANDE_TRAITEE, titre: 't', lien: '/t' },
      ]);
      const dtraitee = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.DEMANDE_TRAITEE },
      });
      expect(dtraitee?.destinataireId).toBe(enseignant.id);
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.DEMANDE_TRAITEE } });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: responsable.id, evenement: EvenementNotification.VALIDATION_DEPARTEMENT, titre: 'val', lien: '/val' },
      ]);
      const val = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.VALIDATION_DEPARTEMENT },
      });
      expect(val?.destinataireId).toBe(responsable.id);
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.VALIDATION_DEPARTEMENT } });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: responsable.id, evenement: EvenementNotification.GENERATION_LANCEE, titre: 'g', lien: '/g' },
      ]);
      const gen = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.GENERATION_LANCEE },
      });
      expect(gen?.emailStatut).toBe('NON_APPLICABLE');
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.GENERATION_LANCEE } });

      await notifications.creerNotifications(prisma as never, [
        { destinataireId: enseignant.id, evenement: EvenementNotification.REPARTITION_ROUVERTE, titre: 'r', lien: '/r' },
      ]);
      const rouver = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.REPARTITION_ROUVERTE },
      });
      expect(rouver?.emailStatut).toBe('NON_APPLICABLE');
      await prisma.notification.deleteMany({ where: { evenement: EvenementNotification.REPARTITION_ROUVERTE } });
    });

    it('n\'enfile un e-mail que pour les événements emailRequis: true', async () => {
      const destinataire = await prisma.user.create({ data: makeUser() });

      for (const evenement of tousLesEvenements) {
        await notifications.creerNotifications(prisma as never, [
          {
            destinataireId: destinataire.id,
            evenement,
            titre: `Titre ${evenement}`,
            lien: `/versions/${evenement}`,
          },
        ]);
      }

      const pending = await dispatcher.dispatchPending();
      const emailRequisCount = Object.values(CATALOGUE_EVENEMENTS).filter(
        (e) => e.emailRequis,
      ).length;

      expect(pending).toBe(emailRequisCount);

      // Traiter chaque job enfnfilé : le processeur appelle le transport SMTP
      const enAttente = await prisma.notification.findMany({
        where: { emailStatut: 'EN_ATTENTE' },
      });
      for (const n of enAttente) {
        await processor.process({ notificationId: n.id, retryCount: 0 });
      }

      expect(transport.sendMail).toHaveBeenCalledTimes(emailRequisCount);

      const motsCharge = ['charge', 'heures', 'coefficient', 'volume', 'service dû', 'écart', 'décharge', 'pédagog'];
      for (const call of transport.sendMail.mock.calls) {
        const message = call[0] as { text: string; subject: string };
        const contenu = (message.text ?? '') + ' ' + (message.subject ?? '');
        for (const mot of motsCharge) {
          expect(contenu.toLowerCase()).not.toContain(mot.toLowerCase());
        }
        expect(contenu).toContain('https://takt.local');
      }

      await prisma.notification.deleteMany();
    });
  });

  describe('Panne SMTP simulée — le workflow n\'est pas interrompu', () => {
    it('la création de notification persiste même si l\'envoi e-mail échoue', async () => {
      const destinataire = await prisma.user.create({ data: makeUser() });

      await notifications.creerNotifications(prisma as never, [
        {
          destinataireId: destinataire.id,
          evenement: EvenementNotification.VERSION_CREEE,
          titre: 'Nouvelle version',
          lien: '/versions/123',
        },
      ]);

      const notif = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.VERSION_CREEE },
      });
      expect(notif).not.toBeNull();
      expect(notif?.emailStatut).toBe('EN_ATTENTE');

      vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error('SMTP indisponible'));

      const emailNotification = await prisma.notification.findFirst({
        where: { emailStatut: 'EN_ATTENTE' },
      });
      expect(emailNotification).not.toBeNull();

      await expect(
        processor.process({ notificationId: emailNotification!.id, retryCount: 0 }),
      ).rejects.toThrow('SMTP indisponible');

      const apresEchec = await prisma.notification.findUnique({
        where: { id: emailNotification!.id },
      });
      expect(apresEchec?.emailStatut).toBe('EN_ATTENTE');
      expect(apresEchec?.emailTentatives).toBe(1);
    });

    it('marque ECHEC au 3ème échec SMTP sans annuler la notification existante', async () => {
      const destinataire = await prisma.user.create({ data: makeUser() });

      await notifications.creerNotifications(prisma as never, [
        {
          destinataireId: destinataire.id,
          evenement: EvenementNotification.VERSION_CREEE,
          titre: 'Nouvelle version',
          lien: '/versions/123',
        },
      ]);

      const notif = await prisma.notification.findFirst({
        where: { evenement: EvenementNotification.VERSION_CREEE },
      });
      expect(notif).not.toBeNull();

      vi.mocked(transport.sendMail).mockRejectedValue(new Error('SMTP indisponible'));

      const emailNotification = await prisma.notification.findFirst({
        where: { emailStatut: 'EN_ATTENTE' },
      });
      expect(emailNotification).not.toBeNull();

      await expect(
        processor.process({ notificationId: emailNotification!.id, retryCount: 2 }),
      ).rejects.toThrow('SMTP indisponible');

      const apres = await prisma.notification.findUnique({
        where: { id: emailNotification!.id },
      });
      expect(apres?.emailStatut).toBe('ECHEC');
      expect(apres?.emailErreur).not.toContain('pass');
      expect(apres?.emailErreur).not.toContain('secret');
      expect(apres?.emailErreur).not.toContain('credential');
    });

    it('refuse un job mal formé sans exécuter de requête', async () => {
      await expect(
        processor.process({ notificationId: 'invalide', retryCount: 0 }),
      ).rejects.toThrow('Job e-mail invalide');

      expect(transport.sendMail).not.toHaveBeenCalled();
    });
  });
  describe('Absence de donnée de charge dans les e-mails', () => {
    it('chaque e-mail envoyé ne contient que titre et lien, aucune donnée de charge ni détail pédagogique', async () => {
      const destinataire = await prisma.user.create({ data: makeUser() });

      const evenementsAvecEmail = Object.entries(CATALOGUE_EVENEMENTS).filter(
        ([, entry]) => entry.emailRequis,
      ) as [string, EvenementCatalogueEntry][];

      for (const [evenement, entry] of evenementsAvecEmail) {
        await notifications.creerNotifications(prisma as never, [
          {
            destinataireId: destinataire.id,
            evenement: evenement as EvenementNotification,
            titre: `Notification ${evenement}`,
            lien: `/versions/${evenement}`,
          },
        ]);
      }

      await dispatcher.dispatchPending();

      const appUrl = 'https://takt.local';
      const motsInterdits = [
        'charge',
        'heures',
        'coefficient',
        'volume',
        'service dû',
        'écart',
        'cm',
        'td',
        'tp',
        'ci',
        'décharge',
        'pédagog',
        'salle',
        'groupe',
        'module',
        'effectif',
      ];

      for (const call of transport.sendMail.mock.calls) {
        const message = call[0] as { text: string; subject: string; to: string };
        const contenu = ((message.text ?? '') + ' ' + (message.subject ?? '')).toLowerCase();

        expect(contenu).toContain(appUrl);

        for (const mot of motsInterdits) {
          expect(contenu).not.toContain(mot);
        }

        expect(message.to).not.toBe(smtpConfig.from);
      }

      await prisma.notification.deleteMany();
    });
  });
});

