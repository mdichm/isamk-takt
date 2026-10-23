// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module Vœux enseignants (L3-33)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ContraintesModule } from '../contraintes/contraintes.module.js';
import { VoeuxService } from './voeux.service.js';
import { VoeuxController } from './voeux.controller.js';

@Module({
  imports: [PrismaModule, ContraintesModule],
  providers: [VoeuxService],
  exports: [VoeuxService],
  controllers: [VoeuxController],
})
export class VoeuxModule {}