import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service d'envoi d'e-mails transactionnels.
 *
 * En développement, le lien de réinitialisation est écrit dans les logs
 * (aucun fournisseur SMTP tiers n'est requis en local).
 * En production, implémenter l'envoi réel (SMTP / SendGrid / Resend / etc.).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    this.appUrl =
      this.configService.get<string>('app.url') ?? 'http://localhost:3000';
  }

  /**
   * Envoie le lien de réinitialisation de mot de passe à l'utilisateur.
   * Retourne true si l'envoi a été accepté (ou simulé en dev).
   */
  async sendPasswordResetLink(
    email: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    // En développement : on loggue le lien (aucun envoi réel)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `[RESET-PWD] Lien de réinitialisation pour ${email} : ${resetUrl}`,
      );
      return true;
    }

    // TODO production : appel SMTP / fournisseur d'e-mail ici
    this.logger.error(
      `Envoi e-mail de réinitialisation non configuré en production pour ${email}`,
    );
    return false;
  }
}