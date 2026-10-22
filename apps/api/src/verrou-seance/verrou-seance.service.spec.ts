// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service VerrouSeance (L3-36)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { RoleCode, VerrouType } from '@takt/db';

vi.mock('@takt/db', () => ({
  RoleCode: {
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    GESTIONNAIRE: 'GESTIONNAIRE',
    RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
    DIRECTION: 'DIRECTION',
    ENSEIGNANT: 'ENSEIGNANT',
    ETUDIANT: 'ETUDIANT',
  },
  VerrouType: {
    CRENEAU: 'CRENEAU',
    SALLE: 'SALLE',
    ENSEIGNANT: 'ENSEIGNANT',
    ACTIVITE: 'ACTIVITE',
  },
  PrismaClient: class {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
  })),
}));

const prisma: any = {};
let audit: any = {};

describe('VerrouSeanceService', () => {
  let service: VerrouSeanceService;

  const versionId = '550e8400-e29b-41d4-a716-446655440001';
  const seanceId = '550e8400-e29b-41d4-a716-446655440002';
  const auteurId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma.seance = {
      findUnique: vi.fn(),
    };
    prisma.verrouSeance = {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    };
    prisma.$transaction = vi.fn(async (operation: any) => operation(prisma));

    audit = {
      writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
    };

    service = new VerrouSeanceService(prisma as any, audit as any);
  });

  describe('pose', () => {
    const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };

    it('pose un verrou quand aucun n existe', async () => {
      prisma.seance.findUnique.mockResolvedValue({
        id: seanceId,
        versionId,
      });
      prisma.verrouSeance.findFirst.mockResolvedValue(null);
      prisma.verrouSeance.create.mockResolvedValue({
        id: 'verrou-1',
        versionId,
        seanceId,
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Réservation salle',
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });

      const result = await service.pose(
        seanceId,
        VerrouType.SALLE,
        auteurId,
        'Réservation salle',
        currentUser,
      );

      expect(result.id).toBe('verrou-1');
      expect(result.seanceId).toBe(seanceId);
      expect(result.type).toBe(VerrouType.SALLE);
      expect(result.leveLe).toBeUndefined();
      expect(prisma.verrouSeance.create).toHaveBeenCalledTimes(1);
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('rejette avec 423 si un verrou actif existe deja', async () => {
      prisma.seance.findUnique.mockResolvedValue({
        id: seanceId,
        versionId,
      });
      prisma.verrouSeance.findFirst.mockResolvedValue({
        id: 'verrou-1',
        seanceId,
        type: VerrouType.SALLE,
        auteurId: otherUserId,
        leveLe: null,
        creeLe: new Date(),
      });

      await expect(
        service.pose(seanceId, VerrouType.SALLE, auteurId, undefined, currentUser),
      ).rejects.toMatchObject({
        response: { code: 'VERROU_ACTIF' },
      });
    });

    it('rejette avec 404 si la séance est introuvable', async () => {
      prisma.seance.findUnique.mockResolvedValue(null);

      await expect(
        service.pose(seanceId, VerrouType.SALLE, auteurId, undefined, currentUser),
      ).rejects.toBeInstanceOf(Error);
    });

    it('refuse la pose par un role non autorise', async () => {
      const nonAutorise = {
        id: auteurId,
        role: RoleCode.RESPONSABLE_DEPARTEMENT,
      };

      await expect(
        service.pose(seanceId, VerrouType.SALLE, auteurId, undefined, nonAutorise),
      ).rejects.toThrow(/Gestionnaire|Administrateur/);
    });
  });

  describe('leve', () => {
    const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };

    it('leve le verrou actif', async () => {
      const now = new Date();
      prisma.verrouSeance.findFirst.mockResolvedValue({
        id: 'verrou-1',
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId: otherUserId,
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });
      prisma.verrouSeance.update.mockResolvedValue({
        id: 'verrou-1',
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId: otherUserId,
        creeLe: new Date(),
        leveLe: now,
        levePar: auteurId,
      });

      const result = await service.leve(
        seanceId,
        VerrouType.SALLE,
        auteurId,
        currentUser,
      );

      expect(result.leveLe).toBe(now);
      expect(result.levePar).toBe(auteurId);
      expect(prisma.verrouSeance.update).toHaveBeenCalledTimes(1);
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('rejette avec 404 si aucun verrou actif', async () => {
      prisma.verrouSeance.findFirst.mockResolvedValue(null);

      await expect(
        service.leve(seanceId, VerrouType.SALLE, auteurId, currentUser),
      ).rejects.toBeInstanceOf(Error);
    });

    it('refuse la levee par un role non autorise', async () => {
      const nonAutorise = {
        id: auteurId,
        role: RoleCode.DIRECTION,
      };

      await expect(
        service.leve(seanceId, VerrouType.SALLE, auteurId, nonAutorise),
      ).rejects.toThrow(/Gestionnaire|Administrateur/);
    });
  });

  describe('lister', () => {
    it('liste tous les verrous d une seance', async () => {
      prisma.verrouSeance.findMany.mockResolvedValue([
        {
          id: 'verrou-1',
          versionId,
          seanceId,
          type: VerrouType.SALLE,
          auteurId,
          justification: 'Réservation',
          creeLe: new Date(),
          leveLe: null,
          levePar: null,
        },
        {
          id: 'verrou-2',
          versionId,
          seanceId,
          type: VerrouType.CRENEAU,
          auteurId: otherUserId,
          justification: null,
          creeLe: new Date(),
          leveLe: new Date(),
          levePar: auteurId,
        },
      ]);

      const result = await service.lister(seanceId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(VerrouType.SALLE);
      expect(result[0].leveLe).toBeUndefined();
      expect(result[1].type).toBe(VerrouType.CRENEAU);
      expect(result[1].leveLe).toBeDefined();
      expect(result[1].levePar).toBe(auteurId);
    });
  });
});
