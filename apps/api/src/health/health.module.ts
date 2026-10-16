// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module de santé

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}