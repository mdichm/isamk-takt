import { Module } from '@nestjs/common';
import { CreneauService } from './creneau.service.js';
import { CreneauController } from './creneau.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CreneauController],
  providers: [CreneauService],
  exports: [CreneauService],
})
export class CreneauModule {}
