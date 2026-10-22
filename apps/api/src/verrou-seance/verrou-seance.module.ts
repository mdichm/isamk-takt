// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Verrous de Séance (L3-36, L3-37)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { VerrouSeanceController } from './verrou-seance.controller.js';
import { VerrouBulkController, VerrouDeleteController } from './verrou-bulk.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [VerrouSeanceService],
  exports: [VerrouSeanceService],
  controllers: [VerrouSeanceController, VerrouBulkController, VerrouDeleteController],
})
export class VerrouSeanceModule {}
