// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module ExportView (L6-03)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExportViewService } from './export-view.service.js';
import { ExportViewController } from './export-view.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [ExportViewService],
  controllers: [ExportViewController],
  exports: [ExportViewService],
})
export class ExportViewModule {}