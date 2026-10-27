// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Espace Direction (L5-29)
// Lecture seule : plannings publiés/archivés, répartition, charges, contraintes, audit, exports officiels.
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SeancesModule } from '../seances/seances.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { RepartitionsModule } from '../repartitions/repartitions.module.js';
import { ChargesModule } from '../charges/charges.module.js';
import { ContraintesModule } from '../contraintes/contraintes.module.js';
import { DirectionService } from './direction.service.js';
import { DirectionController } from './direction.controller.js';

@Module({
  imports: [
    PrismaModule,
    SeancesModule,
    AuditModule,
    RepartitionsModule,
    ChargesModule,
    ContraintesModule,
  ],
  providers: [DirectionService],
  controllers: [DirectionController],
  exports: [DirectionService],
})
export class DirectionModule {}
