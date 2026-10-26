// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du processeur d'e-mail (L5-22)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailProcessorService } from './email-processor.service.js';

const notificationId = '550e8400-e29b-41d4-a716-446655440000';

const makeNotification = (overrides: Record<string, unknown> = {}) => ({
  id: notificationId,
  emailStatut: 'EN_ATTENTE',
  emailTentatives: 0,
  titre: 'Nouvelle version disponible',
  lien: '/versions/123',
  destinataire: { email: 'destinataire@example.tn' },
  ...overrides,
});

describe('EmailProcessorService', () => {
  let notification: ReturnType<typeof makeNotification>;
  let prisma: {
    notification: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let smtp: { sendNotification: ReturnType<typeof vi.fn> };
  let metrics: {
    incrementEmailSent: ReturnType<typeof vi.fn>;
    incrementEmailAttempts: ReturnType<typeof vi.fn>;
    incrementEmailErrors: ReturnType<typeof vi.fn>;
    incrementEmailFinalFailures: ReturnType<typeof vi.fn>;
    setEmailPending: ReturnType<typeof vi.fn>;
    setEmailFailed: ReturnType<typeof vi.fn>;
  };
  let service: EmailProcessorService;

  beforeEach(() => {
    vi.clearAllMocks();
    notification = makeNotification();
    prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue(notification),
        update: vi.fn().mockResolvedValue(notification),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    smtp = { sendNotification: vi.fn().mockResolvedValue(undefined) };
    metrics = {
      incrementEmailSent: vi.fn(),
      incrementEmailAttempts: vi.fn(),
      incrementEmailErrors: vi.fn(),
      incrementEmailFinalFailures: vi.fn(),
      setEmailPending: vi.fn(),
      setEmailFailed: vi.fn(),
    };
    service = new EmailProcessorService(
      prisma as never,
      smtp as never,
      metrics as never,
    );
  });

  it('envoie une notification en attente puis marque le statut ENVOYE', async () => {
    await service.process({ notificationId, retryCount: 0 });

    expect(smtp.sendNotification).toHaveBeenCalledWith({
      to: 'destinataire@example.tn',
      titre: 'Nouvelle version disponible',
      lien: '/versions/123',
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: notificationId },
      data: {
        emailStatut: 'ENVOYE',
        emailEnvoyeLe: expect.any(Date),
        emailErreur: null,
        emailTentatives: { increment: 1 },
      },
    });
    expect(metrics.incrementEmailAttempts).toHaveBeenCalledOnce();
    expect(metrics.incrementEmailSent).toHaveBeenCalledOnce();
    expect(metrics.incrementEmailErrors).not.toHaveBeenCalled();
  });

  it('ignore une notification déjà terminale sans envoyer d’e-mail', async () => {
    notification.emailStatut = 'ENVOYE';

    await service.process({ notificationId, retryCount: 0 });

    expect(smtp.sendNotification).not.toHaveBeenCalled();
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('incrémente les tentatives et conserve EN_ATTENTE lors d’une panne SMTP', async () => {
    smtp.sendNotification.mockRejectedValue(new Error('SMTP indisponible'));

    await expect(
      service.process({ notificationId, retryCount: 0 }),
    ).rejects.toThrow('SMTP indisponible');

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: notificationId },
      data: {
        emailStatut: 'EN_ATTENTE',
        emailErreur: 'SMTP indisponible',
        emailTentatives: { increment: 1 },
      },
    });
    expect(metrics.incrementEmailAttempts).toHaveBeenCalledOnce();
    expect(metrics.incrementEmailErrors).toHaveBeenCalledOnce();
    expect(metrics.incrementEmailFinalFailures).not.toHaveBeenCalled();
  });

  it('marque ECHEC au troisième échec', async () => {
    smtp.sendNotification.mockRejectedValue(new Error('SMTP indisponible'));

    await expect(
      service.process({ notificationId, retryCount: 2 }),
    ).rejects.toThrow('SMTP indisponible');

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: notificationId },
      data: {
        emailStatut: 'ECHEC',
        emailErreur: 'SMTP indisponible',
        emailTentatives: { increment: 1 },
      },
    });
    expect(metrics.incrementEmailFinalFailures).toHaveBeenCalledOnce();
  });

  it('refuse un job mal formé sans exécuter de requête', async () => {
    await expect(
      service.process({ notificationId: 'invalide', retryCount: 0 }),
    ).rejects.toThrow('Job e-mail invalide');

    expect(prisma.notification.findUnique).not.toHaveBeenCalled();
    expect(smtp.sendNotification).not.toHaveBeenCalled();
  });
});
