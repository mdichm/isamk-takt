// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Évaluations de contraintes souples (L3-27)
import { Module } from '@nestjs/common';
import { ConflitModule } from '../conflit/conflit.module.js';
import { EvalsService } from './evals.service.js';
import { EvalsController } from './evals.controller.js';

@Module({
  imports: [ConflitModule],
  providers: [EvalsService],
  controllers: [EvalsController],
})
export class EvalsModule {}