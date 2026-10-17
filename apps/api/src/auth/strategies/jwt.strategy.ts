import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtPayload, getUserPrimaryRole } from '../auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwt.secret') || 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
    }

    // Vérifie la non-révocation via la famille de refresh tokens :
    // si un jeton de rafraîchissement de l'utilisateur a été révoqué
    // (vol/détection de réutilisation), la session est considérée compromise.
    const revokedToken = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id, revokedAt: { not: null } },
    });
    if (revokedToken) {
      throw new UnauthorizedException('Session révoquée');
    }

    return {
      id: user.id,
      email: user.email,
      role: getUserPrimaryRole(user),
      roles: user.roles,
      departments: user.roles
        .map((r) => r.departementCode)
        .filter((d): d is string => Boolean(d)),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
