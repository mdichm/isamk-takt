import { Module } from '@nestjs/common';
import { SalleService } from './salle.service.js';
import { SalleController } from './salle.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ConflitModule } from '../conflit/conflit.module.js';
import { AnneesModule } from '../annees/annees.module.js';

@Module({
  imports: [PrismaModule, AuditModule, ConflitModule, AnneesModule],
  controllers: [SalleController],
  providers: [SalleService],
  exports: [SalleService],
})
export class SalleModule {}