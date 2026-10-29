import { Module } from '@nestjs/common';
import { EnseignantsService } from './enseignants.service.js';
import { EnseignantsController } from './enseignants.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AnneesModule } from '../annees/annees.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AnneesModule],
  controllers: [EnseignantsController],
  providers: [EnseignantsService],
  exports: [EnseignantsService],
})
export class EnseignantsModule {}