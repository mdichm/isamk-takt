import { Module } from '@nestjs/common';
import { StructureService } from './structure.service.js';
import { StructureController } from './structure.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AnneesModule } from '../annees/annees.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AnneesModule],
  controllers: [StructureController],
  providers: [StructureService],
  exports: [StructureService],
})
export class StructureModule {}