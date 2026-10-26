// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du dispatcher d'e-mail (L5-22)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailDispatcherService } from './email-dispatcher.service.js';

const notificationId = '550e8400-e29b-41d4-a716-446655440000';

describe('EmailDispatcherService', () => {
  let prisma: {
    notification: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let boss: { upsert: ReturnType<typeof vi.fn> };
  let metrics: { setEmailPending: ReturnType<typeof vi.fn>; setEmailFailed: ReturnType<typeof vi.fn> };
  let service: EmailDispatcherService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([
          { id: notificationId, emailStatut: 'EN_ATTENTE', emailTentatives: 0 },
        ]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    boss = { upsert: vi.fn().mockResolvedValue({ inserted: 1, updated: 0, jobs: [] }) };
    metrics = {
      setEmailPending: vi.fn(),
      setEmailFailed: vi.fn(),
    };
    service = new EmailDispatcherService(prisma as never, metrics as never, boss as never);
  });

  it('enfile les notifications en attente avec une clé unique', async () => {
    const count = await service.dispatchPending();

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { emailStatut: 'EN_ATTENTE', emailTentatives: { lt: 3 } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    expect(boss.upsert).toHaveBeenCalledWith(
      'email',
      { notificationId },
      expect.objectContaining({
        singletonKey: `notification:${notificationId}`,
      }),
    );
    expect(count).toBe(1);
  });

  it('ignore une notification qui a déjà atteint trois tentatives', async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    await expect(service.dispatchPending()).resolves.toBe(0);
    expect(boss.upsert).not.toHaveBeenCalled();
  });
});
