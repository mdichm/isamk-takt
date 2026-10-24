// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Générations (L4-18)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { GenerationsService } from './generations.service.js';
import { GenerationsController } from './generations.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [GenerationsService],
  exports: [GenerationsService],
  controllers: [GenerationsController],
})
export class GenerationsModule {}
