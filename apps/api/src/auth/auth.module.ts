import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PasswordResetService } from './password-reset.service.js';
import { EmailService } from './email.service.js';
import { LocalAuthProvider } from './providers/local-auth-provider.service.js';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('app.jwt.secret');
        const expiration = configService.get<string>('app.jwt.expiration') ?? '15m';
        return {
          secret,
          signOptions: { expiresIn: expiration },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalAuthProvider, PasswordResetService, EmailService],
  exports: [AuthService, JwtModule, PasswordResetService, EmailService],
})
export class AuthModule {}