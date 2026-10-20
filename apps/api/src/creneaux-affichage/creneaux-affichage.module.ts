import { Module } from '@nestjs/common';
import { CreneauxAffichageService } from './creneaux-affichage.service.js';
import { CreneauxAffichageController } from './creneaux-affichage.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CreneauxAffichageController],
  providers: [CreneauxAffichageService],
  exports: [CreneauxAffichageService],
})
export class CreneauxAffichageModule {}
