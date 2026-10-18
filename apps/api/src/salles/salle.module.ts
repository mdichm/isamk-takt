import { Module } from '@nestjs/common';
import { SalleService } from './salle.service.js';
import { SalleController } from './salle.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SalleController],
  providers: [SalleService],
  exports: [SalleService],
})
export class SalleModule {}