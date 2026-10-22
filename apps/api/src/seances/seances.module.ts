// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Séances & Occupations (L3-10)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OccupationService } from './occupation.service.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [OccupationService],
  exports: [OccupationService],
})
export class SeancesModule {}
