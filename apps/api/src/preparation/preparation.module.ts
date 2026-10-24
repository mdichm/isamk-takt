// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module du tableau de préparation du semestre (L4-12)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PreparationController } from './preparation.controller.js';
import { PreparationService } from './preparation.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PreparationController],
  providers: [PreparationService],
  exports: [PreparationService],
})
export class PreparationModule {}
