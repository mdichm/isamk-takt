import { Module } from '@nestjs/common';
import { RepartitionsService } from './repartitions.service.js';
import { RepartitionsController } from './repartitions.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PolicyModule } from '../policy/policy.module.js';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, PolicyModule],
  controllers: [RepartitionsController],
  providers: [RepartitionsService],
  exports: [RepartitionsService],
})
export class RepartitionsModule {}
