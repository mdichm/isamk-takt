// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module d'acceptation des avertissements (L3-39)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AvertissementService } from './avertissement.service.js';
import { AvertissementController } from './avertissement.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [AvertissementService],
  exports: [AvertissementService],
  controllers: [AvertissementController],
})
export class AvertissementModule {}
