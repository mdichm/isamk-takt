// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module d'audit métier append-only (EX-AUD-01, L0-41)

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';
import { AuditPurgeService } from './audit-purge.service.js';
import { AuditPurgeController } from './audit-purge.controller.js';
import { SecurityConfigService } from './security-config.service.js';
import { SecurityConfigController } from './security-config.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditPurgeService, SecurityConfigService],
  controllers: [AuditController, AuditPurgeController, SecurityConfigController],
  exports: [AuditService, AuditPurgeService, SecurityConfigService],
})
export class AuditModule {}
