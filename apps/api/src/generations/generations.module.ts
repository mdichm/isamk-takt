// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module de générations (L4-15 + L4-18)
// Suivi, annulation, fichier moteur, SSE, comparaison.
import { Module } from '@nestjs/common';
import { GenerationsController } from './generations.controller.js';
import { GenerationsService } from './generations.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GenerationsController],
  providers: [GenerationsService],
  exports: [GenerationsService],
})
export class GenerationsModule {}
