import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from './email.service.js';
import { hashPassword, verifyPassword } from './password.js';
import { randomBytes } from 'crypto';

const DEFAULT_RESET_TTL_MINUTES = 60;
const DEFAULT_PASSWORD_HISTORY = 5;

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Étape 1 (Administrateur) : déclenche une réinitialisation de mot de passe.
   * Génère un token à usage unique, l'enregistre en base avec un TTL,
   * envoie le lien par e-mail et écrit un SecurityEvent.
   * L'Administrateur ne reçoit ni le token ni le mot de passe.
   */
  async requestReset(
    userId: string,
    requestedByAdminId: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable ou inactif');
    }

    const params = await this.prisma.parametreSecurite.findUnique({
      where: { id: 1 },
    });
    const ttlMinutes =
      params?.expirationJours && params.expirationJours > 0
        ? params.expirationJours * 24 * 60
        : DEFAULT_RESET_TTL_MINUTES;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Invalider tout token de réinitialisation précédent non utilisé pour cet utilisateur
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: token,
        expiresAt,
        demandePar: requestedByAdminId,
      },
    });

    // Envoi du lien par e-mail (en dev : log uniquement)
    await this.emailService.sendPasswordResetLink(user.email, token);

    // Journal de sécurité
    await this.prisma.securityEvent.create({
      data: {
        type: 'PASSWORD_RESET_REQUEST',
        userId,
        email: user.email,
        details: { demandePar: requestedByAdminId, expiresAt },
      },
    });

    return {
      message:
        'Un lien de réinitialisation a été envoyé à l’adresse e-mail du compte.',
    };
  }

  /**
   * Étape 2 (Utilisateur, public) : confirme la réinitialisation avec le token.
   * Valide le token, la politique de mot de passe et l’historique,
   * met à jour le mot de passe, marque le token utilisé et révoque les sessions.
   */
  async confirmReset(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Token de réinitialisation invalide');
    }

    if (resetToken.usedAt !== null) {
      throw new UnauthorizedException('Token de réinitialisation déjà utilisé');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Token de réinitialisation expiré',
      );
    }

    const user = resetToken.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    // --- Politique de mot de passe (longueur minimale) ---
    const params = await this.prisma.parametreSecurite.findUnique({
      where: { id: 1 },
    });
    const longueurMin = params?.longueurMin ?? 12;
    if (newPassword.length < longueurMin) {
      throw new BadRequestException({
        detail: `Le mot de passe doit contenir au moins ${longueurMin} caractères`,
        errorCode: 'PASSWORD_POLICY',
      });
    }

    // --- Historique des mots de passe ---
    const historique = params?.historique ?? DEFAULT_PASSWORD_HISTORY;
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: historique,
    });

    for (const entry of history) {
      const matches = await verifyPassword(newPassword, entry.passwordHash);
      if (matches) {
        throw new BadRequestException({
          detail:
            'Ce mot de passe a déjà été utilisé récemment (historique de mots de passe)',
          errorCode: 'PASSWORD_POLICY',
        });
      }
    }

    // Hachage du nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Mise à jour atomique : mot de passe + historique + token utilisé + révocation des sessions
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
        },
      });

      await tx.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Révoquer tous les refresh tokens de l'utilisateur
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    // Journal de sécurité
    await this.prisma.securityEvent.create({
      data: {
        type: 'PASSWORD_RESET_CONFIRM',
        userId: user.id,
        email: user.email,
        details: { motDePasseModifie: true },
      },
    });

    return {
      message: 'Votre mot de passe a été réinitialisé avec succès.',
    };
  }
}