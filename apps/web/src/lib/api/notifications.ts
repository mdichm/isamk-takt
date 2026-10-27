// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API de la boîte de notifications (L5-24 notif_ui)
// Dépend de l'API L5-23 (GET /notifications, POST /notifications/:id/read, POST /notifications/read-all).

import { apiFetch } from './client';

/**
 * Une notification de la boîte de réception d'un utilisateur.
 * Aligné sur NotificationResponseDto du backend.
 */
export interface Notification {
  id: string;
  evenement: string;
  titre: string;
  lien: string | null;
  lu: boolean;
  luALe: Date | null;
  versionId: string | null;
  demandeId: string | null;
  createdAt: Date;
}

/**
 * Réponse paginée de la boîte de réception, avec le compteur de non lues.
 * Aligné sur PaginatedNotificationDto du backend.
 */
export interface PaginatedNotifications {
  data: Notification[];
  nextCursor: string | null;
  unread: number;
}

/**
 * Filtres et pagination de la boîte de notifications.
 * Aligné sur NotificationQueryDto du backend.
 */
export interface NotificationQuery {
  lu?: 'true' | 'false';
  limit?: number;
  cursor?: string;
}

/**
 * Liste les notifications de l'utilisateur connecté (pagination par curseur).
 * GET /notifications
 */
export async function listNotifications(
  query: NotificationQuery = {},
): Promise<PaginatedNotifications> {
  const params = new URLSearchParams();
  if (query.lu) params.set('lu', query.lu);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);

  const response = await apiFetch(`/notifications?${params.toString()}`);
  return response.json();
}

/**
 * Marque une notification comme lue (uniquement par son destinataire).
 * POST /notifications/:id/read
 */
export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await apiFetch(`/notifications/${id}/read`, {
    method: 'POST',
  });
  return response.json();
}

/**
 * Marque toutes les notifications de l'utilisateur comme lues.
 * POST /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<{
  count: number;
}> {
  const response = await apiFetch('/notifications/read-all', {
    method: 'POST',
  });
  return response.json();
}
