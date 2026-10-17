import { Module } from '@nestjs/common';
import { DechargesService } from './decharges.service.js';
import { DechargesController } from './decharges.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DechargesController],
  providers: [DechargesService],
  exports: [DechargesService],
})
export class DechargesModule {}