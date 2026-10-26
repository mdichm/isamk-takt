// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Processeur idempotent de la file e-mail (L5-22)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MetricsService } from '../../common/metrics/metrics.service.js';
import { SmtpEmailService } from './smtp-email.service.js';

export interface EmailJob {
  notificationId: string;
  retryCount: number;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class EmailProcessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smtp: SmtpEmailService,
    private readonly metrics: MetricsService,
  ) {}

  async process(job: EmailJob): Promise<void> {
    if (!UUID_PATTERN.test(job.notificationId)) {
      throw new Error('Job e-mail invalide');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: job.notificationId },
      select: {
        id: true,
        emailStatut: true,
        titre: true,
        lien: true,
        destinataire: { select: { email: true } },
      },
    });

    if (!notification || notification.emailStatut !== 'EN_ATTENTE') {
      return;
    }

    try {
      await this.smtp.sendNotification({
        to: notification.destinataire.email,
        titre: notification.titre,
        lien: notification.lien,
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailStatut: 'ENVOYE',
          emailEnvoyeLe: new Date(),
          emailErreur: null,
          emailTentatives: { increment: 1 },
        },
      });
      this.metrics.incrementEmailAttempts();
      this.metrics.incrementEmailSent();
    } catch (error: unknown) {
      const message = this.sanitizeError(error);
      const finalFailure = job.retryCount >= 2;

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailStatut: finalFailure ? 'ECHEC' : 'EN_ATTENTE',
          emailErreur: message,
          emailTentatives: { increment: 1 },
        },
      });

      this.metrics.incrementEmailAttempts();
      this.metrics.incrementEmailErrors();
      if (finalFailure) {
        this.metrics.incrementEmailFinalFailures();
      }
      throw error;
    }
  }

  private sanitizeError(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Erreur SMTP inconnue';
    return message
      .replace(/password|pass|secret|credential/gi, '[redacted]')
      .slice(0, 500);
  }
}
