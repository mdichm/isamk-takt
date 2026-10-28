// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module des jobs d'export asynchrones (L6-04)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PgBossModule } from '../pg-boss/pg-boss.module.js';
import { FilestoreModule } from '../filestore/filestore.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ExportService } from './export.service.js';
import { ExportController } from './export.controller.js';
import { ExportJobHandler } from './jobs/export.job.handler.js';

@Module({
  imports: [PrismaModule, PgBossModule, FilestoreModule, AuditModule],
  providers: [ExportService, ExportJobHandler],
  controllers: [ExportController],
  exports: [ExportService],
})
export class ExportModule {}
