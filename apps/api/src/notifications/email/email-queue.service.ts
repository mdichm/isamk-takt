// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Consommateur de la file e-mail dans l'API (L5-22)
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Job, PgBoss } from 'pg-boss';
import { EmailProcessorService, type EmailJob } from './email-processor.service.js';

export const BOSS = 'BOSS';

@Injectable()
export class EmailQueueService implements OnModuleInit {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @Inject(BOSS) private readonly boss: PgBoss,
    private readonly processor: EmailProcessorService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.boss.createQueue('email-failed');
    await this.boss.createQueue('email', {
      policy: 'standard',
      retryLimit: 2,
      retryDelay: 60,
      retryBackoff: true,
      retryDelayMax: 900,
      deadLetter: 'email-failed',
    });

    await this.boss.work<EmailJob>(
      'email',
      {
        localConcurrency: 5,
        batchSize: 1,
        perJobResults: true,
      },
      async (jobs: Job<EmailJob>[]): Promise<Array<{ id: string; status: 'completed' | 'failed' | 'deadletter'; output?: string }>> => {
        const results: Array<{ id: string; status: 'completed' | 'failed' | 'deadletter'; output?: string }> = [];

        for (const job of jobs) {
          try {
            await this.processor.process({
              notificationId: job.data.notificationId,
              retryCount: job.retryCount,
            });
            results.push({ id: job.id, status: 'completed' });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur e-mail inconnue';
            this.logger.error(`Échec du job e-mail ${job.id}: ${message}`);
            results.push({
              id: job.id,
              status: job.retryCount >= 2 ? 'deadletter' : 'failed',
              output: message,
            });
          }
        }

        return results;
      },
    );
    this.logger.log('Consommateur de la file e-mail démarré');
  }
}
