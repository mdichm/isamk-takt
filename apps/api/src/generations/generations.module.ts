// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module de générations (L4-15 + L4-18 + L4-24)
// Suivi, annulation, fichier moteur, SSE, comparaison, relance.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerationsController } from './generations.controller.js';
import { GenerationsService } from './generations.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PgBossModule } from '../pg-boss/pg-boss.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    PgBossModule,
    NotificationsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('app.jwt.secret'),
          signOptions: { expiresIn: configService.get<string>('app.jwt.expiration') ?? '15m' },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [GenerationsController],
  providers: [GenerationsService],
  exports: [GenerationsService],
})
export class GenerationsModule {}
