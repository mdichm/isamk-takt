// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Séances & Occupations (L3-10, L3-11, L3-21)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ConflitModule } from '../conflit/conflit.module.js';
import { OccupationService } from './occupation.service.js';
import { SeancesService } from './seances.service.js';
import { SimulateSeanceService } from './simulate-seance.service.js';
import { SeancesController } from './seances.controller.js';

@Module({
  imports: [PrismaModule, AuditModule, ConflitModule],
  providers: [OccupationService, SeancesService, SimulateSeanceService],
  exports: [OccupationService, SeancesService, SimulateSeanceService],
  controllers: [SeancesController],
})
export class SeancesModule {}
