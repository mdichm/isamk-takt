// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'envoi SMTP institutionnel (L5-22)
import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { SmtpConfig } from '../../config/smtp-config.js';

export interface NotificationEmail {
  to: string;
  titre: string;
  lien?: string | null;
}

export interface MailTransport {
  sendMail(message: {
    from: { address: string; name: string };
    to: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
}

export const SMTP_TRANSPORT = 'SMTP_TRANSPORT';

@Injectable()
export class SmtpEmailService {
  private readonly logger = new Logger(SmtpEmailService.name);

  constructor(
    private readonly config: SmtpConfig,
    private readonly transport: MailTransport,
  ) {}

  async sendNotification(notification: NotificationEmail): Promise<void> {
    const link = this.buildAbsoluteLink(notification.lien);
    const text = link
      ? `${notification.titre}\n\n${link}`
      : notification.titre;

    await this.transport.sendMail({
      from: {
        address: this.config.from,
        name: this.config.fromName,
      },
      to: notification.to,
      subject: notification.titre,
      text,
    });

    this.logger.log(`E-mail de notification envoyé à ${notification.to}`);
  }

  private buildAbsoluteLink(lien?: string | null): string | null {
    if (!lien) {
      return null;
    }
    if (/^https?:\/\//i.test(lien)) {
      throw new Error('Lien de notification invalide');
    }
    if (!lien.startsWith('/')) {
      throw new Error('Lien de notification invalide');
    }
    return `${this.config.appUrl}${lien}`;
  }
}

export function createSmtpTransport(config: SmtpConfig): Transporter {
  if (!config.enabled) {
    return createTransport({ jsonTransport: true });
  }
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}
