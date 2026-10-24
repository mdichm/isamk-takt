// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module pg-boss pour l'API (L4-15)
// Fournit une instance Boss partagée pour enfiler les jobs de génération.

import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PgBoss } from 'pg-boss';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: 'BOSS',
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL est requis pour pg-boss');
        }
        const boss = new PgBoss(connectionString);
        await boss.start();
        return boss;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['BOSS'],
})
export class PgBossModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossModule.name);

  constructor(
    private readonly boss: InstanceType<typeof PgBoss>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('pg-boss connecté');
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop();
    this.logger.log('pg-boss fermé');
  }
}