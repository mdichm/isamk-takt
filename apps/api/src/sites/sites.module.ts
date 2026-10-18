// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module du référentiel des sites (L1-14)
import { Module } from '@nestjs/common';
import { SitesService } from './sites.service.js';
import { SitesController } from './sites.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}