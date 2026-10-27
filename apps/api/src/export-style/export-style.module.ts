// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module ExportStyle (L6-02)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FilestoreModule } from '../filestore/filestore.module.js';
import { ExportStyleService } from './export-style.service.js';
import { ExportStyleController } from './export-style.controller.js';

@Module({
  imports: [PrismaModule, FilestoreModule],
  providers: [ExportStyleService],
  controllers: [ExportStyleController],
  exports: [ExportStyleService],
})
export class ExportStyleModule {}