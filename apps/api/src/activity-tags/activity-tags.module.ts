import { Module } from '@nestjs/common';
import { ActivityTagsService } from './activity-tags.service.js';
import { ActivityTagsController } from './activity-tags.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ActivityTagsController],
  providers: [ActivityTagsService],
  exports: [ActivityTagsService],
})
export class ActivityTagsModule {}