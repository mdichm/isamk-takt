// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Conflits (L3-17)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConflitService } from './conflit.service.js';
import { ConflitController } from './conflit.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [ConflitService],
  exports: [ConflitService],
  controllers: [ConflitController],
})
export class ConflitModule {}
