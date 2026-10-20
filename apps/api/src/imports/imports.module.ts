// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module d'import CSV/XLSX (L1-26)
import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service.js';
import { ImportsController } from './imports.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
