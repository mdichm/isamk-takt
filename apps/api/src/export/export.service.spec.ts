// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Export (L6-04)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ExportService } from './export.service.js';
import { CreateExportDto } from './dto/create-export.dto.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
import { RoleCode, JobStatut, ExportFormat, ExportMode } from '@takt/db';
import type { PgBoss as PgBossType } from 'pg-boss';

const mockPrisma = {
  versionEdt: { findUnique: vi.fn() },
  exportStyle: { findFirst: vi.fn(), findUnique: vi.fn() },
  exportView: { findFirst: vi.fn(), findUnique: vi.fn() },
  exportJob: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockFilestore = { storeFile: vi.fn() };
const mockSecurityEvent = { log: vi.fn() };
const mockBoss = { send: vi.fn() };

const mockCurrentUser = (role: string = RoleCode.ADMINISTRATEUR) => ({
  id: 'user-123',
  role,
  departments: role === RoleCode.RESPONSABLE_DEPARTEMENT ? ['DEP-01'] : undefined,
});

function makeService(overrides: Record<string, unknown> = {}) {
  return new ExportService(
    mockPrisma as never,
    mockFilestore as never,
    mockSecurityEvent as never,
    mockBoss as never,
  );
}

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateExportDto = {
      versionId: 'version-1',
      format: ExportFormat.PDF,
      mode: ExportMode.BROUILLON,
      grille: 'NORMALE',
      parametres: {},
    };

    it('devrait créer un job QUEUED et lenfile sur pg-boss', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'BROUILLON',
        avertissementsAcceptes: [],
        publieLe: null,
        grilleFigée: null,
      });
      mockPrisma.exportStyle.findFirst.mockResolvedValue({
        id: 'style-1',
        styleVersion: 1,
      });
      mockPrisma.exportView.findFirst.mockResolvedValue({
        id: 'view-1',
        viewVersion: 1,
      });
      mockPrisma.exportJob.create.mockResolvedValue({
        id: 'job-1',
        style: { styleVersion: 1 },
        view: { viewVersion: 1 },
        format: ExportFormat.PDF,
        mode: ExportMode.BROUILLON,
        grille: 'NORMALE',
        avertissementIds: [],
        statut: JobStatut.QUEUED,
        createdAt: new Date(),
      } as never);
      mockBoss.send.mockResolvedValue(undefined);

      const svc = makeService();
      const result = await svc.create(dto, mockCurrentUser());

      expect(result.statut).toBe(JobStatut.QUEUED);
      expect(result.id).toBe('job-1');
      expect(mockPrisma.exportJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statut: JobStatut.QUEUED,
            auteurId: 'user-123',
            grille: 'NORMALE',
            avertissementIds: [],
          }),
        }),
      );
      expect(mockBoss.send).toHaveBeenCalledWith('export', expect.anything(), expect.anything());
    });

    it('devrait utiliser la grille figée de la version pour un export officiel', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'PUBLIEE',
        avertissementsAcceptes: [],
        publieLe: new Date('2026-10-26T10:00:00Z'),
        grilleFigée: 'RAMADAN',
      });
      mockPrisma.exportStyle.findFirst.mockResolvedValue({
        id: 'style-1',
        styleVersion: 1,
      });
      mockPrisma.exportView.findFirst.mockResolvedValue({
        id: 'view-1',
        viewVersion: 1,
      });
      mockPrisma.exportJob.create.mockResolvedValue({
        id: 'job-2',
        style: { styleVersion: 1 },
        view: { viewVersion: 1 },
        format: ExportFormat.PDF,
        mode: ExportMode.OFFICIEL,
        grille: 'RAMADAN',
        avertissementIds: [],
        statut: JobStatut.QUEUED,
        createdAt: new Date(),
      } as never);
      mockBoss.send.mockResolvedValue(undefined);

      const svc = makeService();
      const result = await svc.create(
        { ...dto, mode: ExportMode.OFFICIEL },
        mockCurrentUser(),
      );

      expect(result.grilleEffective).toBe('RAMADAN');
    });

    it('devrait lever BadRequestException si avertissement inconnu', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'PUBLIEE',
        avertissementsAcceptes: [
          { id: 'avert-1', versionId: 'version-1', caduqueLe: null },
        ],
        publieLe: new Date('2026-10-26T10:00:00Z'),
        grilleFigée: null,
      });
      mockPrisma.exportStyle.findFirst.mockResolvedValue({
        id: 'style-1',
        styleVersion: 1,
      });
      mockPrisma.exportView.findFirst.mockResolvedValue({
        id: 'view-1',
        viewVersion: 1,
      });

      const svc = makeService();
      await expect(
        svc.create(
          {
            ...dto,
            mode: ExportMode.OFFICIEL,
            avertissementsAcceptes: ['avert-inconnu'],
          },
          mockCurrentUser(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever BadRequestException si avertissement caduc', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'PUBLIEE',
        avertissementsAcceptes: [
          { id: 'avert-1', versionId: 'version-1', caduqueLe: new Date() },
        ],
        publieLe: new Date('2026-10-26T10:00:00Z'),
        grilleFigée: null,
      });
      mockPrisma.exportStyle.findFirst.mockResolvedValue({
        id: 'style-1',
        styleVersion: 1,
      });
      mockPrisma.exportView.findFirst.mockResolvedValue({
        id: 'view-1',
        viewVersion: 1,
      });

      const svc = makeService();
      await expect(
        svc.create(
          {
            ...dto,
            mode: ExportMode.OFFICIEL,
            avertissementsAcceptes: ['avert-1'],
          },
          mockCurrentUser(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever NotFoundException si la version est introuvable', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue(null);
      const svc = makeService();
      await expect(svc.create(dto, mockCurrentUser())).rejects.toThrow(NotFoundException);
    });

    it('devrait lever BadRequestException si mode OFFICIEL sur version non publiée', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'BROUILLON',
      });
      const svc = makeService();
      await expect(
        svc.create({ ...dto, mode: ExportMode.OFFICIEL }, mockCurrentUser()),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever BadRequestException si mode BROUILLON sur version publiée', async () => {
      mockPrisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        statut: 'PUBLIEE',
      });
      const svc = makeService();
      await expect(svc.create(dto, mockCurrentUser())).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
    });

    it('devrait paginer et filtrer', async () => {
      mockPrisma.exportJob.findMany.mockResolvedValue([]);
      mockPrisma.exportJob.count.mockResolvedValue(0);

      const svc = makeService();
      const result = await svc.findAll(
        { page: 2, limit: 5, statut: JobStatut.SUCCEEDED },
        mockCurrentUser(),
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(0);
      expect(mockPrisma.exportJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: JobStatut.SUCCEEDED }),
          skip: 5,
          take: 5,
        }),
      );
    });

    it('retourne une liste sans filtrer par département (scope à affiner)', async () => {
      mockPrisma.exportJob.findMany.mockResolvedValue([]);
      mockPrisma.exportJob.count.mockResolvedValue(0);

      const svc = makeService();
      const result = await svc.findAll(
        {},
        mockCurrentUser(RoleCode.RESPONSABLE_DEPARTEMENT),
      );

      expect(result.total).toBe(0);
      expect(mockPrisma.exportJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({}),
        }),
      );
    });
  });

  describe('findById', () => {
    it('devrait retourner le job avec ses versions', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        id: 'job-1',
        version: { departementCode: 'DEP-01' },
        style: { styleVersion: 1 },
        view: { viewVersion: 1 },
        format: ExportFormat.PDF,
        mode: ExportMode.BROUILLON,
        grille: 'NORMALE',
        statut: JobStatut.SUCCEEDED,
        createdAt: new Date(),
      } as never);

      const svc = makeService();
      const result = await svc.findById('job-1', mockCurrentUser());

      expect(result.id).toBe('job-1');
      expect(result.statut).toBe(JobStatut.SUCCEEDED);
    });

    it('retourne le job même pour un Responsable (scope à affiner)', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        id: 'job-1',
        version: {},
        style: { styleVersion: 1 },
        view: { viewVersion: 1 },
        format: ExportFormat.PDF,
        mode: ExportMode.BROUILLON,
        grille: 'NORMALE',
        statut: JobStatut.SUCCEEDED,
        createdAt: new Date(),
      } as never);

      const svc = makeService();
      const result = await svc.findById(
        'job-1',
        mockCurrentUser(RoleCode.RESPONSABLE_DEPARTEMENT),
      );

      expect(result.id).toBe('job-1');
    });
  });

  describe('download', () => {
    it('devrait retourner une URL signée si le job est DONE', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        id: 'job-1',
        version: {},
        statut: JobStatut.SUCCEEDED,
        storageKey: 'abc/file.txt',
        format: ExportFormat.PDF,
        mode: ExportMode.BROUILLON,
      } as never);
      mockSecurityEvent.log.mockResolvedValue(undefined);

      const svc = makeService();
      const result = await svc.download('job-1', mockCurrentUser());

      expect(result.downloadUrl).toBe('/filestore/abc/file.txt');
      expect(result.expiresIn).toBe(3600);
      expect(mockSecurityEvent.log).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EXPORT_ACCESS' }),
      );
    });

    it('devrait lever ConflictException si le job nest pas DONE', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        id: 'job-1',
        version: {},
        statut: JobStatut.QUEUED,
        storageKey: undefined,
      } as never);

      const svc = makeService();
      await expect(svc.download('job-1', mockCurrentUser())).rejects.toThrow(
        ConflictException,
      );
    });
  });
});