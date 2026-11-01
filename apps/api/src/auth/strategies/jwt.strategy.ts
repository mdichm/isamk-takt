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

    // Vérifie la non-révocation via la famille de refresh tokens.
    //
    // La rotation normale révoque le jeton précédent tout en créant un nouveau
    // jeton dans la MÊME famille : la session reste donc valide. C'est la
    // révocation de toute la famille (réutilisation d'un jeton déjà révoqué,
    // déconnexion, réinitialisation de mot de passe) qui rend la session
    // compromise, c'est-à-dire l'absence de tout jeton actif dans la famille.
    if (payload.familyId) {
      const activeToken = await this.prisma.refreshToken.findFirst({
        where: {
          familyId: payload.familyId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!activeToken) {
        throw new UnauthorizedException('Session révoquée');
      }
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
