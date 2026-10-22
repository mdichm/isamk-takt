// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'occupations (L3-10)
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { OccupationService } from './occupation.service.js';
import { VersionStatut } from '@takt/db';

// ============================================
// OccupationService (L3-10)
// ============================================

describe('OccupationService', () => {
  let service: OccupationService;
  let prisma: any;
  let audit: any;

  const versionId = 'version-1';
  const seanceId = 'seance-1';
  const userId = 'user-1';

  const dto = {
    versionId,
    seanceId,
    jour: 'LUNDI',
    creneauId: 'creneau-1',
    ressourceType: 'ENSEIGNANT',
    ressourceId: 'enseignant-1',
  };

  beforeEach(async () => {
    prisma = {
      versionEdt: { findUnique: vi.fn() },
      seance: { findUnique: vi.fn() },
      occupation: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    audit = {
      auditTransaction: vi.fn(async (_cb: any, _meta: any) => {
        const tx = {
          occupation: {
            create: prisma.occupation.create,
            delete: prisma.occupation.delete,
          },
        };
        return _cb(tx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccupationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(OccupationService);
  });

  it('crée une occupation avec succès (version BROUILLON, pas de conflit)', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.BROUILLON,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      id: seanceId,
      versionId,
    } as any);
    prisma.occupation.findFirst.mockResolvedValue(null);
    prisma.occupation.create.mockResolvedValue({
      id: 'occupation-1',
      versionId,
      seanceId,
      jour: 'LUNDI',
      creneauId: 'creneau-1',
      ressourceType: 'ENSEIGNANT',
      ressourceId: 'enseignant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await service.createOccupation(dto as any, userId);

    expect(result.id).toBe('occupation-1');
    expect(result.ressourceType).toBe('ENSEIGNANT');
    expect(prisma.occupation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          versionId,
          seanceId,
          jour: 'LUNDI',
          creneauId: 'creneau-1',
          ressourceType: 'ENSEIGNANT',
          ressourceId: 'enseignant-1',
        }),
      }),
    );
  });

  it('lève 409 si la version est PUBLIE (immutabilité)', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.PUBLIE,
    } as any);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(ConflictException);
  });

  it('lève 409 si la version est ARCHIVE (immutabilité)', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.ARCHIVE,
    } as any);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(ConflictException);
  });

  it('lève 409 si une occupation existe déjà pour cette ressource/créneau/version', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.BROUILLON,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      id: seanceId,
      versionId,
    } as any);
    prisma.occupation.findFirst.mockResolvedValue({
      id: 'occupation-existante',
      versionId,
      jour: 'LUNDI',
      creneauId: 'creneau-1',
      ressourceType: 'ENSEIGNANT',
      ressourceId: 'enseignant-1',
    } as any);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(ConflictException);
  });

  it('lève NotFoundException si la version n\'existe pas', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException si la séance n\'existe pas', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.BROUILLON,
    } as any);
    prisma.seance.findUnique.mockResolvedValue(null);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(NotFoundException);
  });

  it('lève BadRequestException si la séance n\'appartient pas à la version', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.BROUILLON,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      id: seanceId,
      versionId: 'autre-version',
    } as any);

    await expect(
      service.createOccupation(dto as any, userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('libère une occupation avec succès', async () => {
    const occupationId = 'occupation-1';
    prisma.occupation.findUnique.mockResolvedValue({
      id: occupationId,
      version: { id: versionId, statut: VersionStatut.BROUILLON },
    } as any);
    prisma.occupation.delete.mockResolvedValue({ id: occupationId } as any);

    await service.releaseOccupation(occupationId, userId);

    expect(prisma.occupation.delete).toHaveBeenCalledWith({
      where: { id: occupationId },
    });
  });

  it('lève 409 si libération sur version PUBLIE (immutabilité)', async () => {
    prisma.occupation.findUnique.mockResolvedValue({
      id: 'occupation-1',
      version: { id: versionId, statut: VersionStatut.PUBLIE },
    } as any);

    await expect(
      service.releaseOccupation('occupation-1', userId),
    ).rejects.toThrow(ConflictException);
  });

  it('lève NotFoundException si l\'occupation n\'existe pas', async () => {
    prisma.occupation.findUnique.mockResolvedValue(null);

    await expect(
      service.releaseOccupation('occupation-inexistante', userId),
    ).rejects.toThrow(NotFoundException);
  });
});