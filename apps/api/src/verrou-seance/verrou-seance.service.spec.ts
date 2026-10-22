// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service VerrouSeance (L3-36, L3-37)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { RoleCode, VerrouType, VersionStatut } from '@takt/db';

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
  VersionStatut: {
    BROUILLON: 'BROUILLON',
    EDITION: 'EDITION',
    EN_VALIDATION: 'EN_VALIDATION',
    VALIDE: 'VALIDE',
    PUBLIE: 'PUBLIE',
    ARCHIVE: 'ARCHIVE',
    CORRECTION: 'CORRECTION',
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
  const groupeId = '550e8400-e29b-41d4-a716-446655440010';
  const enseignantId = '550e8400-e29b-41d4-a716-446655440011';
  const salleId = '550e8400-e29b-41d4-a716-446655440012';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma.seance = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    };
    prisma.seanceGroupe = {
      findMany: vi.fn(),
    };
    prisma.verrouSeance = {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    };
    prisma.versionEdt = {
      findUnique: vi.fn(),
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
      ).rejects.toThrow(/déjà actif/);
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

  describe('bulkPose', () => {
    const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };
    const cibleGroupe = { type: 'GROUPE' as const, id: groupeId };
    const cibleEnseignant = { type: 'ENSEIGNANT' as const, id: enseignantId };
    const cibleSalle = { type: 'SALLE' as const, id: salleId };

    beforeEach(() => {
      prisma.versionEdt.findUnique.mockResolvedValue({ statut: VersionStatut.EDITION });
    });

    it('pose des verrous en masse pour un groupe', async () => {
      prisma.seanceGroupe.findMany.mockResolvedValue([
        { seanceId: 'seance-1' },
        { seanceId: 'seance-2' },
      ]);
      prisma.seance.findMany.mockResolvedValue([
        { id: 'seance-1' },
        { id: 'seance-2' },
      ]);
      prisma.verrouSeance.findFirst.mockResolvedValue(null);
      prisma.verrouSeance.create.mockResolvedValue({
        id: 'verrou-new',
        versionId,
        seanceId: 'seance-1',
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Bulk pose',
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });

      const result = await service.bulkPose(
        versionId,
        cibleGroupe,
        VerrouType.SALLE,
        'Bulk pose',
        auteurId,
        currentUser,
      );

      expect(result.poses).toBe(2);
      expect(result.ignores).toBe(0);
      expect(result.details).toHaveLength(2);
      expect(result.details.every((d) => d.status === 'POSED')).toBe(true);
      expect(audit.writeAudit).toHaveBeenCalledTimes(2);
    });

    it('pose des verrous en masse pour un enseignant', async () => {
      prisma.seance.findMany.mockResolvedValue([
        { id: 'seance-1' },
        { id: 'seance-2' },
      ]);
      prisma.verrouSeance.findFirst.mockResolvedValue(null);
      prisma.verrouSeance.create.mockResolvedValue({
        id: 'verrou-new',
        versionId,
        seanceId: 'seance-1',
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Bulk pose',
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });

      const result = await service.bulkPose(
        versionId,
        cibleEnseignant,
        VerrouType.SALLE,
        'Bulk pose',
        auteurId,
        currentUser,
      );

      expect(result.poses).toBe(2);
      expect(prisma.seance.findMany).toHaveBeenCalledWith({
        where: { versionId, enseignantId },
        select: { id: true },
      });
    });

    it('pose des verrous en masse pour une salle', async () => {
      prisma.seance.findMany.mockResolvedValue([{ id: 'seance-1' }]);
      prisma.verrouSeance.findFirst.mockResolvedValue(null);
      prisma.verrouSeance.create.mockResolvedValue({
        id: 'verrou-new',
        versionId,
        seanceId: 'seance-1',
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Bulk pose',
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });

      const result = await service.bulkPose(
        versionId,
        cibleSalle,
        VerrouType.SALLE,
        'Bulk pose',
        auteurId,
        currentUser,
      );

      expect(result.poses).toBe(1);
      expect(prisma.seance.findMany).toHaveBeenCalledWith({
        where: { versionId, salleId },
        select: { id: true },
      });
    });

    it('ignore les séances déjà verrouillées du même type', async () => {
      prisma.seanceGroupe.findMany.mockResolvedValue([
        { seanceId: 'seance-1' },
        { seanceId: 'seance-2' },
      ]);
      prisma.seance.findMany.mockResolvedValue([
        { id: 'seance-1' },
        { id: 'seance-2' },
      ]);
      prisma.verrouSeance.findFirst
        .mockResolvedValueOnce({
          id: 'verrou-existing',
          seanceId: 'seance-1',
          type: VerrouType.SALLE,
          auteurId: otherUserId,
          leveLe: null,
        })
        .mockResolvedValueOnce(null);
      prisma.verrouSeance.create.mockResolvedValue({
        id: 'verrou-new',
        versionId,
        seanceId: 'seance-2',
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Bulk pose',
        creeLe: new Date(),
        leveLe: null,
        levePar: null,
      });

      const result = await service.bulkPose(
        versionId,
        cibleGroupe,
        VerrouType.SALLE,
        'Bulk pose',
        auteurId,
        currentUser,
      );

      expect(result.poses).toBe(1);
      expect(result.ignores).toBe(1);
      expect(result.details).toHaveLength(2);
      expect(result.details.find((d) => d.seanceId === 'seance-1')?.status).toBe(
        'SKIPPED_EXISTING',
      );
      expect(result.details.find((d) => d.seanceId === 'seance-2')?.status).toBe('POSED');
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('rejette avec 423 si version PUBLIE', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ statut: VersionStatut.PUBLIE });

      await expect(
        service.bulkPose(versionId, cibleGroupe, VerrouType.SALLE, undefined, auteurId, currentUser),
      ).rejects.toThrow(/ne peut pas être modifiée/);
    });

    it('rejette avec 423 si version ARCHIVE', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ statut: VersionStatut.ARCHIVE });

      await expect(
        service.bulkPose(versionId, cibleGroupe, VerrouType.SALLE, undefined, auteurId, currentUser),
      ).rejects.toThrow(/ne peut pas être modifiée/);
    });

    it('autorise sur version BROUILLON, EDITION, CORRECTION', async () => {
      for (const statut of [VersionStatut.BROUILLON, VersionStatut.EDITION, VersionStatut.CORRECTION]) {
        vi.clearAllMocks();
        prisma.versionEdt.findUnique.mockResolvedValue({ statut });
        prisma.seanceGroupe.findMany.mockResolvedValue([{ seanceId: 'seance-1' }]);
        prisma.seance.findMany.mockResolvedValue([{ id: 'seance-1' }]);
        prisma.verrouSeance.findFirst.mockResolvedValue(null);
        prisma.verrouSeance.create.mockResolvedValue({
          id: 'verrou-new',
          versionId,
          seanceId: 'seance-1',
          type: VerrouType.SALLE,
          auteurId,
          justification: undefined,
          creeLe: new Date(),
          leveLe: null,
          levePar: null,
        });

        const result = await service.bulkPose(
          versionId,
          cibleGroupe,
          VerrouType.SALLE,
          undefined,
          auteurId,
          currentUser,
        );

        expect(result.poses).toBe(1);
      }
    });

    it('refuse par un role non autorise', async () => {
      const nonAutorise = { id: auteurId, role: RoleCode.RESPONSABLE_DEPARTEMENT };

      await expect(
        service.bulkPose(versionId, cibleGroupe, VerrouType.SALLE, undefined, auteurId, nonAutorise),
      ).rejects.toThrow(/Gestionnaire|Administrateur/);
    });
  });

  describe('previewLeve', () => {
    const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };
    const verrouId = 'verrou-1';

    it('retourne le preview avec avertissement', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue({
        id: verrouId,
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Test',
        creeLe: new Date(),
        leveLe: null,
      });

      const result = await service.previewLeve(verrouId, currentUser);

      expect(result.verrouId).toBe(verrouId);
      expect(result.seancesConcernees).toBe(1);
      expect(result.avertissement).toBe('La prochaine génération pourra déplacer cette séance.');
    });

    it('rejette 404 si verrou introuvable', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue(null);

      await expect(service.previewLeve(verrouId, currentUser)).rejects.toBeInstanceOf(Error);
    });

    it('rejette 409 si verrou déjà levé', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue({
        id: verrouId,
        leveLe: new Date(),
      });

      await expect(service.previewLeve(verrouId, currentUser)).rejects.toThrow(/déjà été levé/);
    });

    it('refuse par un role non autorise', async () => {
      const nonAutorise = { id: auteurId, role: RoleCode.RESPONSABLE_DEPARTEMENT };

      await expect(service.previewLeve(verrouId, nonAutorise)).rejects.toThrow(/Gestionnaire|Administrateur/);
    });
  });

  describe('leveWithPreview', () => {
    const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };
    const verrouId = 'verrou-1';

    it('retourne preview quand preview=true', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue({
        id: verrouId,
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Test',
        creeLe: new Date(),
        leveLe: null,
      });

      const result = await service.leveWithPreview(verrouId, currentUser, true);

      // Type narrowing pour le cas preview=true
      expect('seancesConcernees' in result).toBe(true);
      if ('seancesConcernees' in result) {
        expect(result.seancesConcernees).toBe(1);
        expect(result.avertissement).toBe('La prochaine génération pourra déplacer cette séance.');
      }
    });

    it('lève réellement le verrou quand preview=false', async () => {
      const now = new Date();
      prisma.verrouSeance.findUnique.mockResolvedValue({
        id: verrouId,
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Test',
        creeLe: new Date(),
        leveLe: null,
      });
      prisma.verrouSeance.update.mockResolvedValue({
        id: verrouId,
        seanceId,
        versionId,
        type: VerrouType.SALLE,
        auteurId,
        justification: 'Test',
        creeLe: new Date(),
        leveLe: now,
        levePar: currentUser.id,
      });

      const result = await service.leveWithPreview(verrouId, currentUser, false);

      // Type narrowing pour le cas preview=false
      expect('leveLe' in result).toBe(true);
      if ('leveLe' in result) {
        expect(result.leveLe).toBe(now);
        expect(result.levePar).toBe(currentUser.id);
      }
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('rejette 404 si verrou introuvable (preview=false)', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue(null);

      await expect(service.leveWithPreview(verrouId, currentUser, false)).rejects.toBeInstanceOf(Error);
    });

    it('rejette 409 si verrou déjà levé (preview=false)', async () => {
      prisma.verrouSeance.findUnique.mockResolvedValue({
        id: verrouId,
        leveLe: new Date(),
      });

      await expect(service.leveWithPreview(verrouId, currentUser, false)).rejects.toThrow(/déjà été levé/);
    });
  });
});
