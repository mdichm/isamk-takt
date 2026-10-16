import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { User, RoleCode } from '@takt/db';
import { hashPassword } from './password.js';
import { randomUUID } from 'crypto';
import { MfaService } from './mfa.service.js';
import { LocalAuthProvider } from './providers/local-auth-provider.service.js';

// Get primary system role from user's roles
export function getUserPrimaryRole(user: User & { roles?: { role: RoleCode }[] }): RoleCode {
  return user.roles?.[0]?.role || RoleCode.ETUDIANT;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleCode;
  /** Tous les rôles de l'utilisateur avec leur département (portée RBAC). */
  roles: { role: RoleCode; departementCode?: string | null }[];
  /** Codes départementaux de l'utilisateur (pour la ScopeGuard). */
  departments: string[];
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'> & {
    role: RoleCode;
    roles: { role: RoleCode; departementCode?: string | null }[];
    departments: string[];
  };
  accessToken: string;
  refreshToken: string;
}

const DEFAULT_LONGUEUR_MIN = 12;

/**
 * Lit les paramètres de sécurité (ligne unique id = 1) et retourne la
 * longueur minimale de mot de passe à appliquer.
 */
async function getLongueurMinMotDePasse(prisma: PrismaService): Promise<number> {
  const params = await prisma.parametreSecurite.findUnique({ where: { id: 1 } });
  const longueurMin = params?.longueurMin ?? DEFAULT_LONGUEUR_MIN;
  return longueurMin < 8 ? 8 : longueurMin;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mfaService: MfaService,
    private localAuthProvider: LocalAuthProvider,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const longueurMin = await getLongueurMinMotDePasse(this.prisma);
    if (registerDto.password.length < longueurMin) {
      throw new BadRequestException(
        `Le mot de passe doit contenir au moins ${longueurMin} caractères`,
      );
    }

    const passwordHash = await hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        provider: 'LOCAL',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        roles: {
          create: { role: RoleCode.ETUDIANT },
        },
      },
      include: { roles: true },
    });

    return await this.generateAuthResult(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const params = await this.prisma.parametreSecurite.findUnique({
      where: { id: 1 },
    });
    const maxEchecs = params?.maxEchecs ?? 5;
    const verrouillageMinutes = params?.verrouillageMinutes ?? 15;
    const mfaRoles: RoleCode[] = (params?.mfaRoles as RoleCode[]) ?? [RoleCode.ADMINISTRATEUR];

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { roles: true },
    });

    // Vérification des identifiants via le fournisseur d'authentification
    // local (L0-14). Même quand le compte est inconnu, le fournisseur paie
    // le coût argon2 (anti-énumération).
    let authenticated = false;
    if (user) {
      try {
        await this.localAuthProvider.authenticate({
          email: loginDto.email,
          password: loginDto.password,
        });
        authenticated = true;
      } catch {
        // Mot de passe invalide : incrémenter le compteur et verrouiller si seuil.
        const nouveauCompteur = (user.failedAttempts ?? 0) + 1;
        const data: Record<string, unknown> = { failedAttempts: nouveauCompteur };
        if (nouveauCompteur >= maxEchecs) {
          data.lockedUntil = new Date(Date.now() + verrouillageMinutes * 60 * 1000);
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data,
        });
        throw new UnauthorizedException('Identifiants invalides');
      }
    } else {
      // Compte inconnu : même coût argon2 payé par le fournisseur, message
      // générique, aucune tentative enregistrée (anti-énumération).
      try {
        await this.localAuthProvider.authenticate({
          email: loginDto.email,
          password: loginDto.password,
        });
      } catch {
        // Ignoré : le fournisseur a déjà levé l'exception générique.
      }
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!authenticated) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Compte verrouillé : rejet après vérification du mot de passe pour garder
    // un temps de réponse constant (anti-énumération).
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      throw new UnauthorizedException({
        detail: 'Compte verrouillé. Réessayez plus tard.',
        errorCode: 'ACCOUNT_LOCKED',
        retryAfter,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // MFA : si MFA activé et rôle dans mfaRoles, exiger un code TOTP valide.
    // Message générique pour ne pas révéler si le compte a le MFA activé (anti-énumération).
    const role = user.roles?.[0]?.role;
    if (user.mfaActive && role && this.mfaService.isMfaRequiredRole(role, mfaRoles)) {
      const totp = loginDto.totp;
      if (!totp || !user.mfaSecret) {
        throw new UnauthorizedException('Identifiants invalides');
      }
      const isTotpValid = this.mfaService.verifyCode(user.mfaSecret, totp);
      if (!isTotpValid) {
        throw new UnauthorizedException('Identifiants invalides');
      }
    }

    // Mot de passe valide : réinitialiser le compteur d'échecs et le verrouillage.
    if ((user.failedAttempts ?? 0) > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return await this.generateAuthResult(user);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
    });
    if (!storedToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }

    // Réutilisation d'un jeton déjà révoqué → on révoque toute la famille
    if (storedToken.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }

    // Rotation : révoque le jeton courant et en émet un nouveau dans la même famille
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: { roles: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
    }

    const role = getUserPrimaryRole(user);
    const roles = user.roles ?? [];
    const departments = roles
      .map((r) => r.departementCode)
      .filter((d): d is string => Boolean(d));
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
      roles,
      departments,
    };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: storedToken.familyId,
        tokenHash: newRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async validateUser(userId: string): Promise<(Omit<User, 'passwordHash'> & { role: RoleCode }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user || !user.isActive) {
      return null;
    }
    const { passwordHash: _passwordHash, ...result } = user;
    return { ...result, role: getUserPrimaryRole(user) };
  }

  private async generateAuthResult(user: User & { roles: { role: RoleCode; departementCode?: string | null }[] }): Promise<AuthResult> {
    const role = getUserPrimaryRole(user);
    const roles = user.roles ?? [];
    const departments = roles
      .map((r) => r.departementCode)
      .filter((d): d is string => Boolean(d));
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
      roles,
      departments,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const familyId = randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: refreshToken,
        expiresAt,
      },
    });

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return {
      user: { ...userWithoutPassword, role, roles, departments },
      accessToken,
      refreshToken,
    };
  }
}
