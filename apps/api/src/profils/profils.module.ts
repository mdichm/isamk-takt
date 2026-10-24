// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Profils de génération (L4-10)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ProfilsController } from './profils.controller.js';
import { ProfilsService } from './profils.service.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ProfilsController],
  providers: [ProfilsService],
  exports: [ProfilsService],
})
export class ProfilsModule {}