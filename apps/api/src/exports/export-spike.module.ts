// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module du spike d'export PDF/Excel (L6-01, S2)
import { Module } from '@nestjs/common';
import { ExportSpikeController } from './export-spike.controller.js';
import { ExportSpikeService } from './export-spike.service.js';

@Module({
  controllers: [ExportSpikeController],
  providers: [ExportSpikeService],
  exports: [ExportSpikeService],
})
export class ExportSpikeModule {}
