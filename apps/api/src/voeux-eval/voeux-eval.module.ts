// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Evaluateur de satisfaction des voeux (L3-35)
import { Module } from '@nestjs/common';
import { ConflitModule } from '../conflit/conflit.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VoeuxEvalService } from './voeux-eval.service.js';
import { VoeuxEvalController } from './voeux-eval.controller.js';

@Module({
  imports: [ConflitModule, PrismaModule],
  providers: [VoeuxEvalService],
  controllers: [VoeuxEvalController],
  exports: [VoeuxEvalService],
})
export class VoeuxEvalModule {}
