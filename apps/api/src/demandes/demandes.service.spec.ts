// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Demandes (L2-15)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemandesService } from './demandes.service.js';
import {
  CreateDemandeDto,
  TraiterDemandeDto,
  DemandeStatut,
  DemandeType,
} from './dto/demande.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
  DemandeStatut: { OUVERTE: 'OUVERTE', TRAITEE: 'TRAITEE', REFUSEE: 'REFUSEE' },
  DemandeType: { ANOMALIE: 'ANOMALIE', MODIFICATION: 'MODIFICATION' },
}));

describe('DemandesService', () => {
  let service: DemandesService;
  let prisma: any;
  let audit: any;

  const demandeId = '550e8400-e29b-41d4-a716-446655440010';
  const semestreId = '550e8400-e29b-41d4-a716-446655440011';
  const auteurId = '550e8400-e29b-41d4-a716-446655440012';

  beforeEach(() => {
    vi.clearAllMocks();

    audit = {
      auditTransaction: vi.fn(async (callback: any, _meta: any) => {
        return callback(prisma);
      }),
    };

    prisma = {
      semestre: {
        findUnique: vi.fn(),
      },
      demandeModification: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    service = new DemandesService(prisma, audit);
  });

  describe('createDemande', () => {
    const dto: CreateDemandeDto = {
      semestreId,
      departementCode: 'INFO',
      versionId: undefined,
      type: DemandeType.ANOMALIE,
      cible: { moduleId: 'mod-1', type: 'TD' },
      motif: 'Volume horaire incohérent',
    };

    it('devrait créer une demande avec statut OUVERTE', async () => {
      prisma.semestre.findUnique.mockResolvedValue({ id: semestreId });
      prisma.demandeModification.create.mockResolvedValue({
        id: demandeId,
        semestreId,
        departementCode: 'INFO',
        auteurId,
        versionId: null,
        type: 'ANOMALIE',
        cible: { moduleId: 'mod-1', type: 'TD' },
        motif: 'Volume horaire incohérent',
        statut: 'OUVERTE',
        reponse: null,
        traiteePar: null,
        traiteeLe: null,
        createdAt: new Date(),
      });

      const result = await service.createDemande(dto, auteurId);

      expect(result.id).toBe(demandeId);
      expect(result.semestreId).toBe(semestreId);
      expect(result.departementCode).toBe('INFO');
      expect(result.type).toBe('ANOMALIE');
      expect(result.statut).toBe('OUVERTE');
      expect(result.motif).toBe('Volume horaire incohérent');
      expect(prisma.demandeModification.create).toHaveBeenCalledWith({
        data: {
          semestreId,
          departementCode: 'INFO',
          auteurId,
          versionId: null,
          type: 'ANOMALIE',
          cible: { moduleId: 'mod-1', type: 'TD' },
          motif: 'Volume horaire incohérent',
          statut: 'OUVERTE',
        },
      });
    });

    it('devrait lever 404 si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.createDemande(dto, auteurId)).rejects.toThrow(
        `Semestre ${semestreId} introuvable`,
      );
    });
  });

  describe('findAllDemandes', () => {
    it('devrait retourner une liste paginée de demandes', async () => {
      const currentUser = { id: auteurId, role: 'ADMINISTRATEUR' };
      prisma.demandeModification.findMany.mockResolvedValue([
        {
          id: demandeId,
          semestreId,
          departementCode: 'INFO',
          auteurId,
          versionId: null,
          type: 'ANOMALIE',
          cible: {},
          motif: 'Test',
          statut: 'OUVERTE',
          reponse: null,
          traiteePar: null,
          traiteeLe: null,
          createdAt: new Date(),
          semestre: { id: semestreId, numero: 1 },
          auteur: { id: auteurId, email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ]);
      prisma.demandeModification.count.mockResolvedValue(1);

      const result = await service.findAllDemandes(
        { page: 1, limit: 10 },
        currentUser,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0].statut).toBe('OUVERTE');
    });

    it('devrait filtrer par département pour un responsable', async () => {
      const currentUser = {
        id: auteurId,
        role: 'RESPONSABLE_DEPARTEMENT',
        departments: ['INFO'],
      };
      prisma.demandeModification.findMany.mockResolvedValue([]);
      prisma.demandeModification.count.mockResolvedValue(0);

      await service.findAllDemandes({}, currentUser);

      expect(prisma.demandeModification.findMany).toHaveBeenCalledWith({
        where: { departementCode: { in: ['INFO'] } },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.anything(),
      });
    });
  });

  describe('findDemandeById', () => {
    it('devrait retourner une demande par ID', async () => {
      prisma.demandeModification.findUnique.mockResolvedValue({
        id: demandeId,
        semestreId,
        departementCode: 'INFO',
        auteurId,
        versionId: null,
        type: 'ANOMALIE',
        cible: {},
        motif: 'Test',
        statut: 'OUVERTE',
        reponse: null,
        traiteePar: null,
        traiteeLe: null,
        createdAt: new Date(),
        semestre: { id: semestreId, numero: 1 },
        auteur: { id: auteurId, email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      });

      const result = await service.findDemandeById(demandeId);

      expect(result.id).toBe(demandeId);
      expect(prisma.demandeModification.findUnique).toHaveBeenCalledWith({
        where: { id: demandeId },
        include: expect.anything(),
      });
    });

    it('devrait lever 404 si la demande est introuvable', async () => {
      prisma.demandeModification.findUnique.mockResolvedValue(null);

      await expect(service.findDemandeById('inconnu')).rejects.toThrow(
        'Demande inconnu introuvable',
      );
    });
  });

  describe('traiterDemande', () => {
    const dto: TraiterDemandeDto = {
      statut: DemandeStatut.TRAITEE,
      reponse: 'Demande acceptée après vérification',
    };
    const currentUser = {
      id: 'user-traiteur',
      role: 'ADMINISTRATEUR',
    };

    it('devrait traiter une demande ouverte', async () => {
      prisma.demandeModification.findUnique.mockResolvedValue({
        id: demandeId,
        departementCode: 'INFO',
        statut: 'OUVERTE',
      });
      prisma.demandeModification.update.mockResolvedValue({
        id: demandeId,
        semestreId,
        departementCode: 'INFO',
        auteurId,
        versionId: null,
        type: 'ANOMALIE',
        cible: {},
        motif: 'Test',
        statut: 'TRAITEE',
        reponse: 'Demande acceptée après vérification',
        traiteePar: 'user-traiteur',
        traiteeLe: new Date(),
        createdAt: new Date(),
      });

      const result = await service.traiterDemande(demandeId, dto, currentUser);

      expect(result.statut).toBe('TRAITEE');
      expect(result.reponse).toBe('Demande acceptée après vérification');
      expect(result.traiteePar).toBe('user-traiteur');
      expect(prisma.demandeModification.update).toHaveBeenCalledWith({
        where: { id: demandeId },
        data: {
          statut: 'TRAITEE',
          reponse: 'Demande acceptée après vérification',
          traiteePar: 'user-traiteur',
          traiteeLe: expect.any(Date),
        },
      });
    });

    it('devrait lever 409 si la demande est déjà traitée', async () => {
      prisma.demandeModification.findUnique.mockResolvedValue({
        id: demandeId,
        departementCode: 'INFO',
        statut: 'TRAITEE',
      });

      await expect(
        service.traiterDemande(demandeId, dto, currentUser),
      ).rejects.toThrow('déjà été traitée');
    });

    it('devrait lever 404 si la demande est introuvable', async () => {
      prisma.demandeModification.findUnique.mockResolvedValue(null);

      await expect(
        service.traiterDemande('inconnu', dto, currentUser),
      ).rejects.toThrow('Demande inconnu introuvable');
    });

    it('devrait lever 403 OUT_OF_SCOPE pour un responsable hors département', async () => {
      const currentUserHorsDepartement = {
        id: 'user-2',
        role: 'RESPONSABLE_DEPARTEMENT',
        departments: ['MATH'],
      };
      prisma.demandeModification.findUnique.mockResolvedValue({
        id: demandeId,
        departementCode: 'INFO',
        statut: 'OUVERTE',
      });

      await expect(
        service.traiterDemande(demandeId, dto, currentUserHorsDepartement),
      ).rejects.toThrow('OUT_OF_SCOPE');
    });
  });
});