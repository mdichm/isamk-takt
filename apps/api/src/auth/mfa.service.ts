import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoleCode } from '@takt/db';
import * as otplib from 'otplib';

const ISSUER = 'TAKT';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère un secret TOTP (base32, 32 caractères) et l'URI otpauth://,
   * enregistre le secret en base (MFA encore inactif).
   * L'activation effective n'intervient qu'après vérification via verify().
   */
  async enroll(userId: string): Promise<{ secret: string; qrCodeUri: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaSecret: true, mfaActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // Un secret est déjà en cours d'enrôlement ou actif : on ne régénère pas.
    if (user.mfaActive) {
      throw new BadRequestException('MFA déjà activé pour ce compte');
    }

    const secret = otplib.generateSecret({ length: 20 }); // 20 bytes = 32 chars base32 (160 bits)
    const qrCodeUri = `otpauth://totp/${ISSUER}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${ISSUER}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCodeUri };
  }

  /**
   * Vérifie un code TOTP à 6 chiffres contre un secret base32 (RFC 6238, fenêtre 30s).
   */
  verifyCode(secret: string, totp: string): boolean {
    return otplib.verifySync({ token: totp, secret }).valid;
  }

  /**
   * Vérifie un code TOTP à 6 chiffres contre le secret enregistré.
   * Si valide : active le MFA (mfaActive = true) et écrit un SecurityEvent MFA_ENABLE.
   */
  async verify(userId: string, totp: string): Promise<{ success: boolean; mfaActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaSecret: true, mfaActive: true },
    });
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('Enrôlement MFA requis');
    }

    const isValid = await this.verifyCode(user.mfaSecret, totp);
    if (!isValid) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaActive: true },
    });

    await this.prisma.securityEvent.create({
      data: {
        type: 'MFA_ENABLE',
        userId,
        details: { email: user.email },
      },
    });

    return { success: true, mfaActive: true };
  }

  /**
   * Désactive le MFA pour l'utilisateur : réinitialise mfaSecret et mfaActive,
   * écrit un SecurityEvent MFA_DISABLE.
   */
  async disable(userId: string): Promise<{ success: boolean; mfaActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaActive: false },
    });

    await this.prisma.securityEvent.create({
      data: {
        type: 'MFA_DISABLE',
        userId,
      },
    });

    return { success: true, mfaActive: false };
  }

  /**
   * Retourne true si le rôle principal de l'utilisateur figure dans mfaRoles.
   */
  isMfaRequiredRole(role: RoleCode, mfaRoles: RoleCode[]): boolean {
    return mfaRoles.includes(role);
  }
}
