import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { User, RoleCode } from '@takt/db';
import { randomUUID } from 'crypto';

// Get primary system role from user's roles
export function getUserPrimaryRole(user: User & { roles?: { role: RoleCode }[] }): RoleCode {
  return user.roles?.[0]?.role || RoleCode.ETUDIANT;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleCode;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'> & { role: RoleCode };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
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
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { roles: true },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return await this.generateAuthResult(user);
  }

  async refreshToken(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
    });
    if (!storedToken || storedToken.userId !== userId || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
    }

    const role = getUserPrimaryRole(user);
    const payload: JwtPayload = { sub: user.id, email: user.email, role };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const familyId = randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

  private async generateAuthResult(user: User & { roles: { role: RoleCode }[] }): Promise<AuthResult> {
    const role = getUserPrimaryRole(user);
    const payload: JwtPayload = { sub: user.id, email: user.email, role };
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
      user: { ...userWithoutPassword, role },
      accessToken,
      refreshToken,
    };
  }
}
