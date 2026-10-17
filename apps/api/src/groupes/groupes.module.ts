import { Module } from '@nestjs/common';
import { GroupesService } from './groupes.service.js';
import { GroupesController } from './groupes.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GroupesController],
  providers: [GroupesService],
  exports: [GroupesService],
})
export class GroupesModule {}