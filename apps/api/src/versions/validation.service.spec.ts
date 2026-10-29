// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de la décision de validation par département (L5-04)
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionService } from './version.service.js';
import type { ValidationDepartementDto } from './dto/validation-departement.dto.js';
import { PolicyService } from '../policy/policy.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AnneeImmutabilityService } from '../annees/annee-immutability.service.js';

// ============================================
// VersionService.submitValidation (L5-04)
// ============================================

describe('VersionService.submitValidation', () => {
  let service: VersionService;
  let prisma: any;
  const policyService = new PolicyService();

  const versionId = 'version-1';
  const dept1Id = 'dept-1';
  const dept2Id = 'dept-2';
  const userId = 'user-resp';
  const submitterId = 'user-submitter';

  const makeVersion = (overrides: Record<string, unknown> = {}) => ({
    id: versionId,
    numero: '1.0',
    statut: 'EN_VALIDATION',
    cycleValidation: 1,
    soumisPar: submitterId,
    ...overrides,
  });

  const dto = (overrides: Partial<ValidationDepartementDto> = {}): ValidationDepartementDto => ({
    departementId: dept1Id,
    decision: 'APPROUVE' as const,
    motif: undefined,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      versionEdt: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      validationDepartement: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      impactDepartement: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      workflowTransition: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: any) => cb(prisma)),
      userSystemRole: { findMany: vi.fn().mockResolvedValue([]) },
      departement: { findUnique: vi.fn().mockResolvedValue({ id: dept1Id, code: 'INFO' }) },
    };

    const preparationService = { getPreparation: vi.fn() };
    const conflitService = { recomputeConflits: vi.fn() };
    const bossMock = { send: vi.fn().mockResolvedValue('job-id') };

    void preparationService;
    void conflitService;
    void bossMock;

    const notificationsService = { creerNotifications: vi.fn().mockResolvedValue({ count: 0 }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: preparationService },
        { provide: ConflitService, useValue: conflitService },
        { provide: 'BOSS', useValue: bossMock },
        { provide: PolicyService, useValue: policyService },
        { provide: NotificationsService, useValue: notificationsService },
        {
          provide: AnneeImmutabilityService,
          useValue: { verifyAnneeWritable: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(VersionService);
  });

  it('cas 1 : Responsable approuve son département impacté EN_ATTENTE → décision créée, parAdministrateur=false', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });
    prisma.validationDepartement.upsert.mockResolvedValue({
      id: 'val-1',
      decision: 'APPROUVE',
      motif: null,
      parAdministrateur: false,
      at: new Date(),
    });
    prisma.impactDepartement.findMany.mockResolvedValue([
      { departementId: dept1Id },
      { departementId: dept2Id },
    ]);
    prisma.validationDepartement.count.mockResolvedValue(1);

    const result = await service.submitValidation(
      versionId,
      dto({ departementId: dept1Id, decision: 'APPROUVE' }),
      userId,
      'RESPONSABLE_DEPARTEMENT',
      [dept1Id],
    );

    expect(result.departementId).toBe(dept1Id);
    expect(result.decision).toBe('APPROUVE');
    expect(result.parAdministrateur).toBe(false);
    expect(result.unanimiteAtteinte).toBe(false);
    expect(result.nouveauStatutVersion).toBeUndefined();
  });

  it('cas 2 : Administrateur décide pour un département nommé → parAdministrateur=true', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });
    prisma.validationDepartement.upsert.mockResolvedValue({
      id: 'val-2',
      decision: 'REJETE',
      motif: 'Conflit horaire',
      parAdministrateur: true,
      at: new Date(),
    });
    prisma.impactDepartement.findMany.mockResolvedValue([
      { departementId: dept1Id },
      { departementId: dept2Id },
    ]);
    prisma.validationDepartement.count.mockResolvedValue(1);

    const result = await service.submitValidation(
      versionId,
      dto({ departementId: dept2Id, decision: 'REJETE', motif: 'Conflit horaire' }),
      userId,
      'ADMINISTRATEUR',
      [],
    );

    expect(result.departementId).toBe(dept2Id);
    expect(result.decision).toBe('REJETE');
    expect(result.parAdministrateur).toBe(true);
    expect(result.motif).toBe('Conflit horaire');
  });

  it('cas 3 : REJETE sans motif → 422', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });

    await expect(
      service.submitValidation(
        versionId,
        dto({ departementId: dept1Id, decision: 'REJETE', motif: undefined }),
        userId,
        'RESPONSABLE_DEPARTEMENT',
        [dept1Id],
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('cas 4 : Décision déjà existante (APPROVE/REJECT) → 409', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue({
      decision: 'APPROUVE',
    });

    await expect(
      service.submitValidation(
        versionId,
        dto({ departementId: dept1Id, decision: 'REJETE' }),
        userId,
        'RESPONSABLE_DEPARTEMENT',
        [dept1Id],
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cas 5 : Responsable tente de décider pour un autre département → 403 (scope)', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });

    await expect(
      service.submitValidation(
        versionId,
        dto({ departementId: dept2Id, decision: 'APPROUVE' }),
        userId,
        'RESPONSABLE_DEPARTEMENT',
        [dept1Id],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cas 6 : Décideur = soumetteur du cycle → 403 SEGREGATION_OF_DUTIES', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });

    await expect(
      service.submitValidation(
        versionId,
        dto({ departementId: dept1Id, decision: 'APPROUVE' }),
        submitterId,
        'RESPONSABLE_DEPARTEMENT',
        [dept1Id],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cas 7 : Unanimité atteinte (tous APPROVE) → version passe VALIDE', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });
    prisma.validationDepartement.upsert.mockResolvedValue({
      id: 'val-3',
      decision: 'APPROUVE',
      motif: null,
      parAdministrateur: false,
      at: new Date(),
    });
    prisma.impactDepartement.findMany.mockResolvedValue([
      { departementId: dept1Id },
      { departementId: dept2Id },
    ]);
    prisma.validationDepartement.count.mockResolvedValueOnce(2);
    prisma.validationDepartement.count.mockResolvedValue(0);

    const result = await service.submitValidation(
      versionId,
      dto({ departementId: dept1Id, decision: 'APPROUVE' }),
      userId,
      'RESPONSABLE_DEPARTEMENT',
      [dept1Id],
    );

    expect(result.unanimiteAtteinte).toBe(true);
    expect(result.nouveauStatutVersion).toBe('VALIDE');
    expect(prisma.versionEdt.update).toHaveBeenCalledWith({
      where: { id: versionId },
      data: { statut: 'VALIDE' },
    });
  });

  it('cas 8 : Unanimité atteinte (un REJECT) → version passe REJETE', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'IMPACTE' });
    prisma.validationDepartement.upsert.mockResolvedValue({
      id: 'val-4',
      decision: 'REJETE',
      motif: 'Refusé',
      parAdministrateur: false,
      at: new Date(),
    });
    prisma.impactDepartement.findMany.mockResolvedValue([
      { departementId: dept1Id },
      { departementId: dept2Id },
    ]);
    prisma.validationDepartement.count.mockResolvedValueOnce(2);
    prisma.validationDepartement.count.mockResolvedValue(1);

    const result = await service.submitValidation(
      versionId,
      dto({ departementId: dept1Id, decision: 'REJETE', motif: 'Refusé' }),
      userId,
      'RESPONSABLE_DEPARTEMENT',
      [dept1Id],
    );

    expect(result.unanimiteAtteinte).toBe(true);
    expect(result.nouveauStatutVersion).toBe('REJETE');
    expect(prisma.versionEdt.update).toHaveBeenCalledWith({
      where: { id: versionId },
      data: { statut: 'REJETE' },
    });
  });

  it('cas 9 : Version pas en EN_VALIDATION → 400', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion({ statut: 'EDITION' }));

    await expect(
      service.submitValidation(versionId, dto(), userId, 'RESPONSABLE_DEPARTEMENT', [dept1Id]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève NotFoundException si la version est introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);

    await expect(
      service.submitValidation(versionId, dto(), userId, 'RESPONSABLE_DEPARTEMENT', [dept1Id]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si le département nest pas impacté', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.validationDepartement.findUnique.mockResolvedValue(null);
    prisma.impactDepartement.findUnique.mockResolvedValue({ statut: 'NON_IMPACTE' });

    await expect(
      service.submitValidation(versionId, dto(), userId, 'RESPONSABLE_DEPARTEMENT', [dept1Id]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
