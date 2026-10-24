// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service pg-boss pour l'enfilement de jobs de génération (L4-15)
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PgBoss } from 'pg-boss';
import type { PgBoss as PgBossType } from 'pg-boss';

interface GenerationJobData {
  generationId: string;
  semestreId: string;
}

@Injectable()
export class PgBossService {
  private readonly logger = new Logger(PgBossService.name);

  constructor(@Inject('BOSS') private readonly boss: PgBossType) {}

  /**
   * Enfile un job de génération sur la file "generation".
   */
  async enqueueGenerationJob(data: GenerationJobData): Promise<void> {
    await this.boss.send('generation', data, {
      // Retry après 30s en cas d'échec, max 3 tentatives
      retryDelay: 30_000,
      retryBackoff: true,
      // Le job expire après 10 minutes s'il n'est pas récupéré
      expireInSeconds: 600,
    });
    this.logger.log(
      `Job génération enfile: generationId=${data.generationId} semestreId=${data.semestreId}`,
    );
  }
}