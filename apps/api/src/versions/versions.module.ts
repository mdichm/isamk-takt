// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module des versions (L3-09)
import { Module } from '@nestjs/common';
import { VersionController } from './version.controller.js';
import { VersionService } from './version.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PreparationModule } from '../preparation/preparation.module.js';
import { ConflitModule } from '../conflit/conflit.module.js';
import { PgBossModule } from '../pg-boss/pg-boss.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AnneesModule } from '../annees/annees.module.js';

@Module({
  imports: [PrismaModule, PreparationModule, ConflitModule, PgBossModule, NotificationsModule, AnneesModule],
  controllers: [VersionController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionsModule {}
