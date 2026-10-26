// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur Notifications (L5-23 notif_api)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { SseNotifier } from './notifications.sse.js';
import { NotFoundException } from '@nestjs/common';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const notificationId = '550e8400-e29b-41d4-a716-446655440001';

const notification = {
  id: notificationId,
  evenement: 'VERSION_CREEE',
  titre: 'Nouvelle version',
  lien: '/versions/123',
  lu: false,
  luALe: null,
  versionId: '550e8400-e29b-41d4-a716-446655440002',
  demandeId: null,
  createdAt: new Date('2026-10-26T10:00:00Z'),
};

const makeService = () => ({
  findAll: vi.fn(),
  marquerLu: vi.fn(),
  marquerTousLus: vi.fn(),
});

const makeSseNotifier = () => ({
  subscribe: vi.fn(() => vi.fn()),
  notify: vi.fn(),
});

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: ReturnType<typeof makeService>;
  let sse: ReturnType<typeof makeSseNotifier>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = makeService();
    sse = makeSseNotifier();
    controller = new NotificationsController(service as any, sse as any);
  });

  describe('findAll', () => {
    it('retourne la page paginée avec le compteur non lus', async () => {
      service.findAll.mockResolvedValue({
        data: [notification],
        nextCursor: null,
        unread: 2,
      });

      const result = await controller.findAll({ lu: 'false', limit: 10 }, userId);

      expect(service.findAll).toHaveBeenCalledWith(userId, {
        lu: 'false',
        limit: 10,
        cursor: undefined,
      });
      expect(result).toEqual({
        data: [notification],
        nextCursor: null,
        unread: 2,
      });
    });

    it('passe les valeurs par défaut quand la query est vide', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        nextCursor: null,
        unread: 0,
      });

      await controller.findAll({}, userId);

      // Le controller passe la query telle quelle (les defaults sont appliquées
      // par la ValidationPipe en runtime, pas dans le controller testé seul).
      expect(service.findAll).toHaveBeenCalledWith(userId, {});
    });
  });

  describe('marquerLu', () => {
    it('marque la notification lue quand l\'utilisateur est le destinataire', async () => {
      service.marquerLu.mockResolvedValue({ ...notification, lu: true });

      const result = await controller.marquerLu(notificationId, userId);

      expect(service.marquerLu).toHaveBeenCalledWith(userId, notificationId);
      expect(result).toEqual({ ...notification, lu: true });
    });

    it('lève 404 quand la notification est introuvable ou hors portée', async () => {
      service.marquerLu.mockResolvedValue(null);

      await expect(controller.marquerLu(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.marquerLu).toHaveBeenCalledWith(userId, notificationId);
    });
  });

  describe('marquerTousLus', () => {
    it('marque toutes les notifications et retourne le count', async () => {
      service.marquerTousLus.mockResolvedValue({ count: 3 });

      const result = await controller.marquerTousLus(userId);

      expect(service.marquerTousLus).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('events (SSE)', () => {
    it('s\'abonne au SseNotifier pour l\'utilisateur et gère la fermeture', () => {
      const res = {
        setHeader: vi.fn(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
        on: vi.fn((event, cb) => {
          if (event === 'close') cb();
        }),
      } as any;

      controller.events(userId, res);

      expect(sse.subscribe).toHaveBeenCalledWith(userId, expect.any(Function));
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
    });
  });
});
