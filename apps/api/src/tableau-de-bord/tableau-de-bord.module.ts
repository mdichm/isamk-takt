// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module du tableau de bord (L5-26)

import { Module } from '@nestjs/common';
import { TableauDeBordController } from './tableau-de-bord.controller.js';
import { TableauDeBordService } from './tableau-de-bord.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PreparationModule } from '../preparation/preparation.module.js';
import { VersionsModule } from '../versions/versions.module.js';
import { ChargesModule } from '../charges/charges.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    PreparationModule,
    VersionsModule,
    ChargesModule,
    NotificationsModule,
  ],
  controllers: [TableauDeBordController],
  providers: [TableauDeBordService],
  exports: [TableauDeBordService],
})
export class TableauDeBordModule {}
