import { Module } from '@nestjs/common';
import { DemandesService } from './demandes.service.js';
import { DemandesController } from './demandes.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [DemandesController],
  providers: [DemandesService],
  exports: [DemandesService],
})
export class DemandesModule {}