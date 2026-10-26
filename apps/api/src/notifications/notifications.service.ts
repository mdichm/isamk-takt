import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@takt/db';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { EvenementNotification } from './notifications.constants.js';

/**
 * L5-21 notif_core — Cœur du module de notifications.
 *
 * Émet une ligne de notification par destinataire, toujours à l'intérieur de la
 * transaction métier courante (prisma.$transaction). Le service ne gère pas
 * l'envoi d'emails (L5-22) ; il écrit uniquement les lignes `notifications`
 * avec le statut `EN_ATTENTE` pour que le processeur email les consomme.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une notification pour chacun des destinataires fournis, dans la
   * transaction Prisma passée en paramètre.
   *
   * @param tx client Prisma de transaction (ou PrismaService hors transaction)
   * @param dtos une notification par destinataire à émettre
   * @returns le résultat du batch d'insertion (nombre de lignes créées)
   */
  async creerNotifications(
    tx: Prisma.TransactionClient,
    dtos: readonly CreateNotificationDto[],
  ): Promise<Prisma.BatchPayload> {
    if (dtos.length === 0) {
      return { count: 0 };
    }

    const result = await tx.notification.createMany({
      data: dtos.map((dto) => ({
        destinataireId: dto.destinataireId,
        evenement: dto.evenement,
        titre: dto.titre,
        lien: dto.lien ?? null,
        versionId: dto.versionId ?? null,
        demandeId: dto.demandeId ?? null,
        // emailStatut vaut par défaut 'EN_ATTENTE' (contrainte DB)
      })),
    });

    this.logger.log(
      `${result.count} notification(s) créée(s) pour l'événement ${dtos[0]?.evenement}`,
    );

    return result;
  }
}