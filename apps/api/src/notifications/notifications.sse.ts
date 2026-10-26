// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Notificateur SSE en mémoire (L5-23 notif_api)
//
// Instance unique (monolithe). Chaque utilisateur abonné reçoit les événements
// de sa boîte de réception en direct via text/event-stream.

import { Injectable, Logger } from '@nestjs/common';

/**
 * Payload d'un événement SSE poussé vers un utilisateur.
 *
 * - `NEW` : une (ou plusieurs) nouvelle(s) notification(s) a/ont été créée(s)
 *   pour l'utilisateur. Le détail n'est pas inclus (createMany ne retourne pas
 *   les ids) : le client doit rafraîchir GET /notifications.
 * - `READ` : une notification a été marquée lue (ou toutes).
 */
export type SseEvent =
  | { type: 'NEW'; destinataireId: string; at: Date }
  | { type: 'READ'; notificationId: string | null };

/**
 * Fonction d'envoi vers un client SSE (écrit directement sur la réponse HTTP).
 */
type SendFn = (data: string) => void;

/**
 * Notificateur SSE en mémoire vive.
 *
 * Abonne un utilisateur à un flux d'envois et notifie tous ses clients abonnés.
 * Pas de Redis requis : acceptable pour un monolithe à instance unique.
 */
@Injectable()
export class SseNotifier {
  private readonly logger = new Logger(SseNotifier.name);
  private readonly clients = new Map<string, Set<SendFn>>();

  /**
   * Abonne un utilisateur au flux SSE. Retourne une fonction de désabonnement.
   */
  subscribe(userId: string, send: SendFn): () => void {
    let set = this.clients.get(userId);
    if (!set) {
      set = new Set();
      this.clients.set(userId, set);
    }
    set.add(send);

    this.logger.debug(`SSE abonné : userId=${userId} (${set.size} client(s))`);

    return () => {
      set.delete(send);
      if (set.size === 0) {
        this.clients.delete(userId);
      }
      this.logger.debug(`SSE désabonné : userId=${userId}`);
    };
  }

  /**
   * Notifie tous les clients abonnés d'un utilisateur.
   * Sécurisé : aucune exception ne sort si un client est déconnecté.
   */
  notify(userId: string, event: SseEvent): void {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) {
      return;
    }

    const data = `data: ${JSON.stringify(event)}\n\n`;
    set.forEach((send) => {
      try {
        send(data);
      } catch {
        // Client déjà déconnecté, ignoré silencieusement.
      }
    });
  }

  /** Nombre de clients actuellement abonnés (tous utilisateurs confondus). */
  clientCount(): number {
    let total = 0;
    this.clients.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}
