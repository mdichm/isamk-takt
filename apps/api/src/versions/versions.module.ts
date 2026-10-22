// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module des versions (L3-09)
import { Module } from '@nestjs/common';
import { VersionController } from './version.controller.js';
import { VersionService } from './version.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [VersionController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionsModule {}
