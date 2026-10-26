// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Notifications (L5-21 notif_core)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { EvenementNotification } from './notifications.constants.js';

const destinataireId = '550e8400-e29b-41d4-a716-446655440000';
const autreDestinataireId = '550e8400-e29b-41d4-a716-446655440003';
const versionId = '550e8400-e29b-41d4-a716-446655440001';
const demandeId = '550e8400-e29b-41d4-a716-446655440002';
const notificationId = '550e8400-e29b-41d4-a716-446655440004';

const makePrisma = () => {
  const notification = {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findUnique: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const prisma = {
    notification,
    $transaction: vi.fn(async (operation: any) => operation(prisma)),
  };
  return { prisma, notification };
};

const makeSseNotifier = () => ({
  notify: vi.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let notificationMock: any;
  let sseNotifier: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = makePrisma();
    prisma = ctx.prisma;
    notificationMock = ctx.notification;
    sseNotifier = makeSseNotifier();
    service = new NotificationsService(prisma as any, sseNotifier);
  });

  const notifLu = {
    id: notificationId,
    destinataireId,
    evenement: 'VERSION_CREEE',
    titre: 'Nouvelle version',
    lien: null,
    lu: true,
    luALe: new Date('2026-10-26T11:00:00Z'),
    versionId,
    demandeId: null,
    createdAt: new Date('2026-10-26T10:00:00Z'),
  };
  const notifNonLu = {
    id: '550e8400-e29b-41d4-a716-446655440005',
    destinataireId,
    evenement: 'DEMANDE_CREEE',
    titre: 'Nouvelle demande',
    lien: '/demandes/1',
    lu: null,
    luALe: null,
    versionId: null,
    demandeId: '550e8400-e29b-41d4-a716-446655440006',
    createdAt: new Date('2026-10-26T09:00:00Z'),
  };

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
            emailStatut: 'EN_ATTENTE',
          },
          {
            destinataireId: '550e8400-e29b-41d4-a716-446655440003',
            evenement: EvenementNotification.VERSION_CREEE,
            titre: 'Nouvelle version d\'EDT créée',
            lien: '/versions/' + versionId,
            versionId,
            demandeId: null,
            emailStatut: 'EN_ATTENTE',
          },
        ],
      });
      expect(result).toEqual({ count: 2 });
      // Deux destinataires distincts → deux notifications SSE
      expect(sseNotifier.notify).toHaveBeenCalledTimes(2);
      expect(sseNotifier.notify).toHaveBeenCalledWith(destinataireId, {
        type: 'NEW',
        destinataireId,
        at: expect.any(Date),
      });
    });

    it('marque NON_APPLICABLE un événement qui ne requiert pas d’e-mail', async () => {
      notificationMock.createMany.mockResolvedValue({ count: 1 });

      await service.creerNotifications(prisma, [
        {
          destinataireId,
          evenement: EvenementNotification.GENERATION_LANCEE,
          titre: 'Génération lancée',
        },
      ]);

      expect(notificationMock.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            evenement: EvenementNotification.GENERATION_LANCEE,
            emailStatut: 'NON_APPLICABLE',
          }),
        ],
      });
      expect(sseNotifier.notify).toHaveBeenCalledTimes(1);
    });

    it('n\'appelle pas createMany quand la liste est vide et retourne count 0', async () => {
      const result = await service.creerNotifications(prisma, []);

      expect(notificationMock.createMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(sseNotifier.notify).not.toHaveBeenCalled();
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
            emailStatut: 'EN_ATTENTE',
          },
        ],
      });
      expect(sseNotifier.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('retourne la page, le curseur suivant et le compteur non lus', async () => {
      notificationMock.findMany.mockResolvedValue([notifLu, notifNonLu]);
      notificationMock.count.mockResolvedValue(1);

      const result = await service.findAll(destinataireId, {
        lu: undefined,
        limit: 10,
        cursor: undefined,
      });

      expect(notificationMock.findMany).toHaveBeenCalledWith({
        where: { destinataireId },
        take: 11,
        skip: 0,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(notificationMock.count).toHaveBeenCalledWith({
        where: { destinataireId, lu: { not: true } },
      });
      expect(result.unread).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(result.data[0].lu).toBe(true);
      expect(result.data[1].lu).toBe(false);
    });

    it('filtre par lu=true', async () => {
      notificationMock.findMany.mockResolvedValue([notifLu]);
      notificationMock.count.mockResolvedValue(0);

      await service.findAll(destinataireId, { lu: 'true', limit: 10 });

      expect(notificationMock.findMany).toHaveBeenCalledWith({
        where: { destinataireId, lu: true },
        take: 11,
        skip: 0,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filtre par lu=false (non lus)', async () => {
      notificationMock.findMany.mockResolvedValue([notifNonLu]);
      notificationMock.count.mockResolvedValue(1);

      await service.findAll(destinataireId, { lu: 'false', limit: 10 });

      expect(notificationMock.findMany).toHaveBeenCalledWith({
        where: { destinataireId, lu: { not: true } },
        take: 11,
        skip: 0,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('détecte la page suivante via le curseur', async () => {
      const page = [notifLu, notifNonLu, { ...notifLu, id: 'curseur-suivant' }];
      notificationMock.findMany.mockResolvedValue(page);
      notificationMock.count.mockResolvedValue(3);

      const result = await service.findAll(destinataireId, {
        lu: undefined,
        limit: 2,
        cursor: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.nextCursor).toBe(notifNonLu.id);
    });

    it('utilise le curseur pour la page suivante', async () => {
      notificationMock.findMany.mockResolvedValue([notifNonLu]);
      notificationMock.count.mockResolvedValue(1);

      await service.findAll(destinataireId, {
        lu: undefined,
        limit: 10,
        cursor: notifLu.id,
      });

      expect(notificationMock.findMany).toHaveBeenCalledWith({
        where: { destinataireId },
        take: 11,
        skip: 1,
        cursor: { id: notifLu.id },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('marquerLu', () => {
    it('marque la notification lue si l\'utilisateur est le destinataire', async () => {
      const miseAJour = { ...notifNonLu, lu: true, luALe: new Date() };
      notificationMock.findUnique.mockResolvedValue(notifNonLu);
      notificationMock.update.mockResolvedValue(miseAJour);

      const result = await service.marquerLu(destinataireId, notifNonLu.id);

      expect(notificationMock.findUnique).toHaveBeenCalledWith({
        where: { id: notifNonLu.id },
      });
      expect(notificationMock.update).toHaveBeenCalledWith({
        where: { id: notifNonLu.id },
        data: { lu: true, luALe: expect.any(Date) },
      });
      expect(sseNotifier.notify).toHaveBeenCalledWith(destinataireId, {
        type: 'READ',
        notificationId: notifNonLu.id,
      });
      expect(result?.lu).toBe(true);
    });

    it('retourne null si la notification n\'appartient pas à l\'utilisateur', async () => {
      const pasLeDestinataire = { ...notifNonLu, destinataireId: autreDestinataireId };
      notificationMock.findUnique.mockResolvedValue(pasLeDestinataire);

      const result = await service.marquerLu(destinataireId, notifNonLu.id);

      expect(result).toBeNull();
      expect(notificationMock.update).not.toHaveBeenCalled();
    });

    it('retourne null si la notification est introuvable', async () => {
      notificationMock.findUnique.mockResolvedValue(null);

      const result = await service.marquerLu(destinataireId, 'inconnu');

      expect(result).toBeNull();
    });
  });

  describe('marquerTousLus', () => {
    it('marque toutes les non lues et retourne le count', async () => {
      notificationMock.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.marquerTousLus(destinataireId);

      expect(notificationMock.updateMany).toHaveBeenCalledWith({
        where: { destinataireId, lu: { not: true } },
        data: { lu: true, luALe: expect.any(Date) },
      });
      expect(sseNotifier.notify).toHaveBeenCalledWith(destinataireId, {
        type: 'READ',
        notificationId: null,
      });
      expect(result).toEqual({ count: 3 });
    });
  });
});