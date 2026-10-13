import { Module } from '@nestjs/common';
import { SprintsService } from './sprints.service.js';
import { SprintsController } from './sprints.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}