// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module d'audit métier append-only (EX-AUD-01)

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
