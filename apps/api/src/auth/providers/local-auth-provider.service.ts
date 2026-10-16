import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RoleCode } from '@takt/db';
import { hashPassword, verifyPassword } from '../password.js';
import { AuthProvider, AuthenticatedUser } from './auth-provider.interface.js';

/**
 * Fournisseur d'authentification LOCAL (mot de passe hashé en argon2id).
 *
 * C'est par cette interface que passe l'authentification locale (L0-14). Un
 * fournisseur tiers (OIDC, LDAP/AD) pourra l'implémenter à l'avenir sans
 * impacter le RBAC ni le reste du flux d'authentification.
 */
@Injectable()
export class LocalAuthProvider implements AuthProvider {
  readonly name = 'local' as const;

  constructor(private prisma: PrismaService) {}

  async authenticate(credentials: {
    email: string;
    password: string;
  }): Promise<AuthenticatedUser> {
    const { email, password } = credentials;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    // Anti-énumération : le coût argon2 est toujours payé, même si le compte
    // n'existe pas, pour que le délai de réponse soit identique dans les deux cas.
    const passwordHash = user?.passwordHash ?? (await hashPassword('__inconnu__'));
    const isPasswordValid = user ? await verifyPassword(password, passwordHash) : false;

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Un compte sans hash de mot de passe (fournisseur externe OIDC/LDAP)
    // ne peut pas s'authentifier par le fournisseur LOCAL.
    if (!user.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.mapUser(user);
  }

  private mapUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string | null;
    isActive: boolean;
    failedAttempts: number;
    lockedUntil: Date | null;
    mfaActive: boolean;
    mfaSecret: string | null;
    roles: { role: RoleCode }[];
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      failedAttempts: user.failedAttempts ?? 0,
      lockedUntil: user.lockedUntil,
      mfaActive: user.mfaActive,
      mfaSecret: user.mfaSecret,
      roles: user.roles,
    };
  }
}
