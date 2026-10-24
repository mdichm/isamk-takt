// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module des exigences de salle par activité (L3-43)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExigencesSalleService } from './exigences-salle.service.js';
import { ExigencesSalleController } from './exigences-salle.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [ExigencesSalleService],
  exports: [ExigencesSalleService],
  controllers: [ExigencesSalleController],
})
export class ExigencesSalleModule {}
