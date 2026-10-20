import { Module } from '@nestjs/common';
import { ContrainteDefinitionController } from './contrainte-definition.controller.js';
import { ContrainteDefinitionService } from './contrainte-definition.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ContrainteDefinitionController],
  providers: [ContrainteDefinitionService],
  exports: [ContrainteDefinitionService],
})
export class ContraintesModule {}