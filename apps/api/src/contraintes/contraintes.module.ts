import { Module } from '@nestjs/common';
import { ContrainteDefinitionController } from './contrainte-definition.controller.js';
import { ContrainteDefinitionService } from './contrainte-definition.service.js';
import { ContrainteInstanceController } from './contrainte-instance.controller.js';
import { ContrainteInstanceService } from './contrainte-instance.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ContrainteDefinitionController, ContrainteInstanceController],
  providers: [ContrainteDefinitionService, ContrainteInstanceService],
  exports: [ContrainteDefinitionService, ContrainteInstanceService],
})
export class ContraintesModule {}