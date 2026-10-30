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
import { DroitAccesService } from './droit-acces.service.js';
import { DroitAccesController } from './droit-acces.controller.js';
import { DroitRectificationService } from './droit-rectification.service.js';
import { DroitRectificationController } from './droit-rectification.controller.js';
import { DroitSuppressionService } from './droit-suppression.service.js';
import { DroitSuppressionController } from './droit-suppression.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [
    AuditService,
    AuditPurgeService,
    SecurityConfigService,
    DroitAccesService,
    DroitRectificationService,
    DroitSuppressionService,
  ],
  controllers: [
    AuditController,
    AuditPurgeController,
    SecurityConfigController,
    DroitAccesController,
    DroitRectificationController,
    DroitSuppressionController,
  ],
  exports: [AuditService, AuditPurgeService, SecurityConfigService],
})
export class AuditModule {}
