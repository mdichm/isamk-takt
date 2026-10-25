// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module de paramétrage des circuits de workflow (L5-17)

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ParametresService } from './parametres.service.js';
import { ParametresController } from './parametres.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ParametresService],
  controllers: [ParametresController],
  exports: [ParametresService],
})
export class ParametresModule {}
