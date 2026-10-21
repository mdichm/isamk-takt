// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module API des charges et agrégations (L2-10)

import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service.js';
import { ChargesController } from './charges.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ChargesController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}