// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du notificateur SSE (L5-23 notif_api)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SseNotifier } from './notifications.sse.js';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const otherUser = '550e8400-e29b-41d4-a716-446655440003';

describe('SseNotifier', () => {
  let notifier: SseNotifier;

  beforeEach(() => {
    notifier = new SseNotifier();
  });

  it('notifie uniquement les clients abonnés de l\'utilisateur cible', () => {
    const received: string[] = [];
    const send = (data: string) => received.push(data);
    const unsubscribe = notifier.subscribe(userId, send);

    notifier.notify(userId, { type: 'NEW', destinataireId: userId, at: new Date() });

    expect(received).toHaveLength(1);
    expect(JSON.parse(received[0].split('data: ')[1].trim())).toMatchObject({
      type: 'NEW',
      destinataireId: userId,
    });

    unsubscribe();
    notifier.notify(userId, { type: 'NEW', destinataireId: userId, at: new Date() });
    expect(received).toHaveLength(1); // aucun nouvel envoi après désabonnement
  });

  it('ne notifie pas un autre utilisateur', () => {
    const received: string[] = [];
    notifier.subscribe(userId, (data) => received.push(data));

    notifier.notify(otherUser, { type: 'READ', notificationId: 'id' });

    expect(received).toHaveLength(0);
  });

  it('gère silencieusement un client déjà déconnecté (send qui lève)', () => {
    const brokenSend = () => {
      throw new Error('socket closed');
    };
    const goodSend = vi.fn();
    notifier.subscribe(userId, brokenSend);
    notifier.subscribe(userId, goodSend);

    expect(() =>
      notifier.notify(userId, { type: 'READ', notificationId: 'id' }),
    ).not.toThrow();
    expect(goodSend).toHaveBeenCalledTimes(1);
  });

  it('compte les clients abonnés', () => {
    expect(notifier.clientCount()).toBe(0);
    notifier.subscribe(userId, () => {});
    notifier.subscribe(userId, () => {});
    notifier.subscribe(otherUser, () => {});
    expect(notifier.clientCount()).toBe(3);
  });
});
