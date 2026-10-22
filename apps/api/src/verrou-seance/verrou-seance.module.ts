// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Verrous de Séance (L3-36)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { VerrouSeanceController } from './verrou-seance.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [VerrouSeanceService],
  exports: [VerrouSeanceService],
  controllers: [VerrouSeanceController],
})
export class VerrouSeanceModule {}
