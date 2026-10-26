import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@takt/db';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { CATALOGUE_EVENEMENTS } from './notifications.constants.js';
import { SseNotifier } from './notifications.sse.js';
import {
  NotificationResponseDto,
  PaginatedNotificationDto,
} from './dto/notification-response.dto.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';

/**
 * L5-21 notif_core — Cœur du module de notifications.
 *
 * Émet une ligne de notification par destinataire, toujours à l'intérieur de la
 * transaction métier courante (prisma.$transaction). Le service ne gère pas
 * l'envoi d'emails (L5-22) ; il écrit uniquement les lignes `notifications`
 * avec le statut `EN_ATTENTE` pour que le processeur email les consomme.
 *
 * L5-23 notif_api — ajoute la consultation de la boîte de réception, le marquage
 * lu et l'intégration SSE (notifications push en direct après écriture).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseNotifier?: SseNotifier,
  ) {}

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
        emailStatut: CATALOGUE_EVENEMENTS[dto.evenement].emailRequis
          ? 'EN_ATTENTE'
          : 'NON_APPLICABLE',
      })),
    });

    this.logger.log(
      `${result.count} notification(s) créée(s) pour l'événement ${dtos[0]?.evenement}`,
    );

    // Notifier en direct les destinataires via SSE (après écriture).
    // createMany ne retourne pas les ids générés : le client doit rafraîchir.
    const destinataires = [...new Set(dtos.map((dto) => dto.destinataireId))];
    for (const destinataireId of destinataires) {
      this.sseNotifier?.notify(destinataireId, {
        type: 'NEW',
        destinataireId,
        at: new Date(),
      });
    }

    return result;
  }

  /**
   * Récupère les notifications de l'utilisateur avec pagination par curseur
   * (id desc) et le compteur de non lues.
   *
   * @param userId identifiant du destinataire connecté
   * @param query filtres (lu) et pagination (limit, cursor)
   * @returns données paginées + nextCursor + unread
   */
  async findAll(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotificationDto> {
    const limit = Math.min(query.limit ?? 50, 100);
    const take = limit + 1; // un élément de plus pour détecter la page suivante
    const skip = query.cursor ? 1 : 0;
    const cursor = query.cursor ? { id: query.cursor } : undefined;

    const where: Prisma.NotificationWhereInput = { destinataireId: userId };

    if (query.lu === 'true') {
      where.lu = true;
    } else if (query.lu === 'false') {
      where.lu = { not: true }; // null ou false = non lu
    }

    const [notifications, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take,
        skip,
        cursor,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({
        where: { destinataireId: userId, lu: { not: true } },
      }),
    ]);

    const hasNextPage = notifications.length > limit;
    const data = hasNextPage ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: data.map((n) => this.toDto(n)),
      nextCursor,
      unread,
    };
  }

  /**
   * Marque une notification comme lue, uniquement si l'utilisateur en est le
   * destinataire.
   *
   * @param userId identifiant de l'utilisateur connecté
   * @param id identifiant de la notification
   * @returns la notification mise à jour, ou null si introuvable / hors portée
   */
  async marquerLu(
    userId: string,
    id: string,
  ): Promise<NotificationResponseDto | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.destinataireId !== userId) {
      return null;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { lu: true, luALe: new Date() },
    });

    this.sseNotifier?.notify(userId, { type: 'READ', notificationId: id });
    return this.toDto(updated);
  }

  /**
   * Marque toutes les notifications non lues de l'utilisateur comme lues.
   *
   * @param userId identifiant de l'utilisateur connecté
   * @returns nombre de notifications marquées lues
   */
  async marquerTousLus(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { destinataireId: userId, lu: { not: true } },
      data: { lu: true, luALe: new Date() },
    });

    this.sseNotifier?.notify(userId, { type: 'READ', notificationId: null });
    return { count: result.count };
  }

  private toDto(n: Prisma.NotificationGetPayload<{}>): NotificationResponseDto {
    return {
      id: n.id,
      evenement: n.evenement,
      titre: n.titre,
      lien: n.lien,
      lu: n.lu ?? false,
      luALe: n.luALe,
      versionId: n.versionId,
      demandeId: n.demandeId,
      createdAt: n.createdAt,
    };
  }
}