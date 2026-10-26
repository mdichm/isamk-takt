// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Dispatcher des notifications vers la file e-mail pg-boss (L5-22)
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { PgBoss } from 'pg-boss';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MetricsService } from '../../common/metrics/metrics.service.js';

export const BOSS = 'BOSS';

@Injectable()
export class EmailDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailDispatcherService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    @Inject(BOSS) private readonly boss: PgBoss,
  ) {}

  async dispatchPending(): Promise<number> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        emailStatut: 'EN_ATTENTE',
        emailTentatives: { lt: 3 },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const [pending, failed] = await Promise.all([
      this.prisma.notification.count({ where: { emailStatut: 'EN_ATTENTE' } }),
      this.prisma.notification.count({ where: { emailStatut: 'ECHEC' } }),
    ]);
    this.metrics.setEmailPending(pending);
    this.metrics.setEmailFailed(failed);

    for (const notification of notifications) {
      await this.boss.upsert(
        'email',
        { notificationId: notification.id },
        {
          singletonKey: `notification:${notification.id}`,
        },
      );
    }

    return notifications.length;
  }

  onModuleInit(): void {
    this.start();
  }

  start(intervalMilliseconds = 10_000): void {
    this.timer = setInterval(() => {
      void this.dispatchPending().catch((error: unknown) => {
        this.logger.error(
          'Échec du dispatch des notifications e-mail',
          error instanceof Error ? error.stack : undefined,
        );
      });
    }, intervalMilliseconds);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
