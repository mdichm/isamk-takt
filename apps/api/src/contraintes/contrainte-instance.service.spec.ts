// SPDX-License-Identifier: AGPL-3.0-only
// eslint-disable @typescript-eslint/no-explicit-any
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContrainteInstanceService } from './contrainte-instance.service.js';

vi.mock('@takt/db', () => ({ PrismaClient: class {} }));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('ContrainteInstanceService (duplicate - L3-07)', () => {
  let service: ContrainteInstanceService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const sourceSemestreId = '550e8400-e29b-41d4-a716-446655440001';
  const cibleSemestreId = '550e8400-e29b-41d4-a716-446655440002';
  const enseignantId = '550e8400-e29b-41d4-a716-446655440003';
  const defId = '550e8400-e29b-41d4-a716-446655440007';
  const instanceId = '550e8400-e29b-41d4-a716-446655440008';
  const newInstanceId = '550e8400-e29b-41d4-a716-446655440009';
  const indispoId = '550e8400-e29b-41d4-a716-446655440010';
  const newIndispoId = '550e8400-e29b-41d4-a716-446655440011';
  const creneauId = '550e8400-e29b-41d4-a716-446655440012';

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      semestre: { findUnique: vi.fn() },
      contrainteInstance: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      enseignant: { findUnique: vi.fn() },
      groupe: { findUnique: vi.fn() },
      salle: { findUnique: vi.fn() },
      module: { findUnique: vi.fn() },
      indisponibilite: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      creneau: { findFirst: vi.fn() },
    };
    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };
    service = new ContrainteInstanceService(prisma as any, audit as any);
  });

  it('should throw BadRequest when source and cible semestres are identical', async () => {
    await expect(
      service.duplicate(sourceSemestreId, sourceSemestreId, undefined, userId),
    ).rejects.toThrow('doivent être différents');
  });

  it('should throw NotFound when semestre source does not exist', async () => {
    prisma.semestre.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.duplicate(sourceSemestreId, cibleSemestreId, undefined, userId),
    ).rejects.toThrow('Semestre source');
  });

  it('should copy constraints and indisponibilités successfully', async () => {
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: sourceSemestreId })
      .mockResolvedValueOnce({ id: cibleSemestreId });
    prisma.contrainteInstance.findMany.mockResolvedValue([
      {
        id: instanceId,
        semestreId: sourceSemestreId,
        definitionId: defId,
        enseignantId: enseignantId,
        groupeId: null,
        salleId: null,
        moduleId: null,
        originId: null,
        params: {},
        poids: null,
        nature: 'REGLE',
        commentaire: null,
        actif: true,
        creePar: userId,
        creeLe: new Date(),
        definition: { portee: 'ENSEIGNANT', categorie: 'DURE' },
      },
    ]);
    prisma.enseignant.findUnique.mockResolvedValue({ id: enseignantId });
    prisma.contrainteInstance.findFirst.mockResolvedValue(null);
    prisma.contrainteInstance.create.mockResolvedValue({
      id: newInstanceId,
      semestreId: cibleSemestreId,
      definitionId: defId,
      enseignantId,
      groupeId: null,
      salleId: null,
      moduleId: null,
      originId: instanceId,
      params: {},
      poids: null,
      nature: 'REGLE',
      commentaire: null,
      actif: true,
      creePar: userId,
      creeLe: new Date(),
    });
    prisma.indisponibilite.findMany.mockResolvedValue([
      {
        id: indispoId,
        semestreId: sourceSemestreId,
        jour: 'LUNDI',
        ordre: 3,
        enseignantId: enseignantId,
        salleId: null,
        estActive: true,
      },
    ]);
    prisma.creneau.findFirst.mockResolvedValue({ id: creneauId });
    prisma.indisponibilite.create.mockResolvedValue({
      id: newIndispoId,
      semestreId: cibleSemestreId,
      jour: 'LUNDI',
      ordre: 3,
      enseignantId: enseignantId,
      salleId: null,
      estActive: true,
    });

    const result = await service.duplicate(
      sourceSemestreId,
      cibleSemestreId,
      undefined,
      userId,
    );

    expect(result.contraintesCrees).toBe(1);
    expect(result.contraintesIds).toContain(newInstanceId);
    expect(result.contraintesNonCopiees).toEqual([]);
    expect(result.indisponibilitesCrees).toBe(1);
    expect(result.indisponibilitesIds).toContain(newIndispoId);
    expect(result.indisponibilitesNonCopiees).toEqual([]);
    expect(prisma.contrainteInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          originId: instanceId,
          semestreId: cibleSemestreId,
        }),
      }),
    );
  });

  it('should skip existing constraints (idempotence via originId)', async () => {
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: sourceSemestreId })
      .mockResolvedValueOnce({ id: cibleSemestreId });
    prisma.contrainteInstance.findMany.mockResolvedValue([
      {
        id: instanceId,
        semestreId: sourceSemestreId,
        definitionId: defId,
        enseignantId: null,
        groupeId: null,
        salleId: null,
        moduleId: null,
        originId: null,
        params: {},
        poids: null,
        nature: 'REGLE',
        commentaire: null,
        actif: true,
        creePar: userId,
        creeLe: new Date(),
        definition: { portee: 'GLOBALE', categorie: 'DURE' },
      },
    ]);
    prisma.contrainteInstance.findFirst.mockResolvedValue({
      id: 'already-copied',
      semestreId: cibleSemestreId,
      originId: instanceId,
    });
    prisma.indisponibilite.findMany.mockResolvedValue([]);

    const result = await service.duplicate(
      sourceSemestreId,
      cibleSemestreId,
      undefined,
      userId,
    );

    expect(result.contraintesCrees).toBe(0);
    expect(result.contraintesIds).toEqual([]);
    expect(prisma.contrainteInstance.create).not.toHaveBeenCalled();
  });

  it('should not copy constraint when target enseignant does not exist', async () => {
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: sourceSemestreId })
      .mockResolvedValueOnce({ id: cibleSemestreId });
    prisma.contrainteInstance.findMany.mockResolvedValue([
      {
        id: instanceId,
        semestreId: sourceSemestreId,
        definitionId: defId,
        enseignantId: enseignantId,
        groupeId: null,
        salleId: null,
        moduleId: null,
        originId: null,
        params: {},
        poids: null,
        nature: 'REGLE',
        commentaire: null,
        actif: true,
        creePar: userId,
        creeLe: new Date(),
        definition: { portee: 'ENSEIGNANT', categorie: 'DURE' },
      },
    ]);
    prisma.contrainteInstance.findFirst.mockResolvedValue(null);
    prisma.enseignant.findUnique.mockResolvedValue(null);
    prisma.indisponibilite.findMany.mockResolvedValue([]);

    const result = await service.duplicate(
      sourceSemestreId,
      cibleSemestreId,
      undefined,
      userId,
    );

    expect(result.contraintesCrees).toBe(0);
    expect(result.contraintesNonCopiees).toHaveLength(1);
    expect(result.contraintesNonCopiees[0]).toMatchObject({
      definitionId: defId,
      sujetType: 'enseignant',
      sujetId: enseignantId,
      raison: 'Enseignant cible introuvable',
    });
    expect(prisma.contrainteInstance.create).not.toHaveBeenCalled();
  });

  it('should not copy indisponibilité when no creneau cible found', async () => {
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: sourceSemestreId })
      .mockResolvedValueOnce({ id: cibleSemestreId });
    prisma.contrainteInstance.findMany.mockResolvedValue([]);
    prisma.indisponibilite.findMany.mockResolvedValue([
      {
        id: indispoId,
        semestreId: sourceSemestreId,
        jour: 'LUNDI',
        ordre: 3,
        enseignantId: enseignantId,
        salleId: null,
        estActive: true,
      },
    ]);
    prisma.creneau.findFirst.mockResolvedValue(null);

    const result = await service.duplicate(
      sourceSemestreId,
      cibleSemestreId,
      undefined,
      userId,
    );

    expect(result.indisponibilitesCrees).toBe(0);
    expect(result.indisponibilitesNonCopiees).toHaveLength(1);
    expect(result.indisponibilitesNonCopiees[0]).toMatchObject({
      jour: 'LUNDI',
      ordre: 3,
      raison: expect.stringContaining('Aucun créneau cible trouvé'),
    });
    expect(prisma.indisponibilite.create).not.toHaveBeenCalled();
  });

  it('should filter by natures when provided', async () => {
    prisma.semestre.findUnique
      .mockResolvedValueOnce({ id: sourceSemestreId })
      .mockResolvedValueOnce({ id: cibleSemestreId });
    prisma.contrainteInstance.findMany.mockResolvedValue([]);
    prisma.indisponibilite.findMany.mockResolvedValue([]);

    await service.duplicate(
      sourceSemestreId,
      cibleSemestreId,
      ['VOEU'],
      userId,
    );

    expect(prisma.contrainteInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          semestreId: sourceSemestreId,
          actif: true,
          nature: { in: ['VOEU'] },
        }),
      }),
    );
  });
});