// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Groupes de covoiturage (L3-41)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CovoiturageService } from './covoiturage.service.js';
import { CovoiturageController } from './covoiturage.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [CovoiturageService],
  exports: [CovoiturageService],
  controllers: [CovoiturageController],
})
export class CovoiturageModule {}
