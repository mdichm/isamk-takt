import { Module } from '@nestjs/common';
import { AnneesService } from './annees.service.js';
import { AnneesController } from './annees.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AnneesController],
  providers: [AnneesService],
  exports: [AnneesService],
})
export class AnneesModule {}