import { Module } from '@nestjs/common';
import { AnneesService } from './annees.service.js';
import { AnneesController } from './annees.controller.js';
import { AnneeImmutabilityService } from './annee-immutability.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { CreneauModule } from '../creneaux/creneau.module.js';

@Module({
  imports: [PrismaModule, AuditModule, CreneauModule],
  controllers: [AnneesController],
  providers: [AnneesService, AnneeImmutabilityService],
  exports: [AnneesService, AnneeImmutabilityService],
})
export class AnneesModule {}