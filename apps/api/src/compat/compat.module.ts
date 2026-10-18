// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module compatibilité (salle/tag, exigences d'équipement) — L1-11

import { Module } from '@nestjs/common';
import { CompatService } from './compat.service.js';
import { CompatController } from './compat.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CompatController],
  providers: [CompatService],
  exports: [CompatService],
})
export class CompatModule {}
