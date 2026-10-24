import { Module } from '@nestjs/common';
import { ContrainteDefinitionController } from './contrainte-definition.controller.js';
import { ContrainteDefinitionService } from './contrainte-definition.service.js';
import { ContrainteInstanceController } from './contrainte-instance.controller.js';
import { ContrainteInstanceService } from './contrainte-instance.service.js';
import { ContrainteFetMappingController } from './contrainte-fet-mapping.controller.js';
import { ContrainteFetMappingService } from './contrainte-fet-mapping.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    ContrainteDefinitionController,
    ContrainteInstanceController,
    ContrainteFetMappingController,
  ],
  providers: [
    ContrainteDefinitionService,
    ContrainteInstanceService,
    ContrainteFetMappingService,
  ],
  exports: [
    ContrainteDefinitionService,
    ContrainteInstanceService,
    ContrainteFetMappingService,
  ],
})
export class ContraintesModule {}