// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Séances & Occupations (L3-10, L3-11)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OccupationService } from './occupation.service.js';
import { SeancesService } from './seances.service.js';
import { SeancesController } from './seances.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [OccupationService, SeancesService],
  exports: [OccupationService, SeancesService],
  controllers: [SeancesController],
})
export class SeancesModule {}
