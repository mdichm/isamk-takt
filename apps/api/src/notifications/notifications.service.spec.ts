// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Notifications (L5-21 notif_core)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { EvenementNotification } from './notifications.constants.js';

const destinataireId = '550e8400-e29b-41d4-a716-446655440000';
const versionId = '550e8400-e29b-41d4-a716-446655440001';
const demandeId = '550e8400-e29b-41d4-a716-446655440002';

const makePrisma = () => {
  const notification = {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const prisma = {
    notification,
    $transaction: vi.fn(async (operation: any) => operation(prisma)),
  };
  return { prisma, notification };
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let notificationMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = makePrisma();
    prisma = ctx.prisma;
    notificationMock = ctx.notification;
    service = new NotificationsService(prisma as any);
  });

  describe('creerNotifications', () => {
    const dtos = [
      {
        destinataireId,
        evenement: EvenementNotification.VERSION_CREEE,
        titre: 'Nouvelle version d\'EDT créée',
        versionId,
        lien: '/versions/' + versionId,
      },
      {
        destinataireId: '550e8400-e29b-41d4-a716-446655440003',
        evenement: EvenementNotification.VERSION_CREEE,
        titre: 'Nouvelle version d\'EDT créée',
        versionId,
        lien: '/versions/' + versionId,
      },
    ];

    it('crée une notification par destinataire dans la transaction et retourne le count', async () => {
      notificationMock.createMany.mockResolvedValue({ count: 2 });

      const result = await service.creerNotifications(prisma, dtos);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(notificationMock.createMany).toHaveBeenCalledTimes(1);
      expect(notificationMock.createMany).toHaveBeenCalledWith({
        data: [
          {
            destinataireId,
            evenement: EvenementNotification.VERSION_CREEE,
            titre: 'Nouvelle version d\'EDT créée',
            lien: '/versions/' + versionId,
            versionId,
            demandeId: null,
          },
          {
            destinataireId: '550e8400-e29b-41d4-a716-446655440003',
            evenement: EvenementNotification.VERSION_CREEE,
            titre: 'Nouvelle version d\'EDT créée',
            lien: '/versions/' + versionId,
            versionId,
            demandeId: null,
          },
        ],
      });
      expect(result).toEqual({ count: 2 });
    });

    it('n\'appelle pas createMany quand la liste est vide et retourne count 0', async () => {
      const result = await service.creerNotifications(prisma, []);

      expect(notificationMock.createMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ count: 0 });
    });

    it('met demandeId à null quand il est absent du DTO', async () => {
      notificationMock.createMany.mockResolvedValue({ count: 1 });
      const dtoSansDemande = [
        {
          destinataireId,
          evenement: EvenementNotification.DEMANDE_TRAITEE,
          titre: 'Votre demande a été traitée',
          demandeId,
        },
      ];

      await service.creerNotifications(prisma, dtoSansDemande);

      expect(notificationMock.createMany).toHaveBeenCalledWith({
        data: [
          {
            destinataireId,
            evenement: EvenementNotification.DEMANDE_TRAITEE,
            titre: 'Votre demande a été traitée',
            lien: null,
            versionId: null,
            demandeId,
          },
        ],
      });
    });
  });
});