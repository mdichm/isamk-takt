// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module du bail d'édition exclusif (L3-19)

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { EditLockService } from './edit-lock.service.js';
import { EditLockController } from './edit-lock.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [EditLockService],
  exports: [EditLockService],
  controllers: [EditLockController],
})
export class EditLockModule {}
