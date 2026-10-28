// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur Export (L6-04)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { CreateExportDto } from './dto/create-export.dto.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
import { RoleCode } from '@takt/db';

const mockCurrentUser = (role: string = RoleCode.ADMINISTRATEUR) => ({
  id: 'user-123',
  role,
  departments: role === RoleCode.RESPONSABLE_DEPARTEMENT ? ['DEP-01'] : undefined,
});

const mockJob = {
  id: 'job-1',
  versionId: 'version-1',
  styleId: 'style-1',
  viewId: 'view-1',
  auteurId: 'user-123',
  format: 'PDF',
  mode: 'BROUILLON',
  grille: 'NORMALE',
  parametres: {},
  statut: 'QUEUED',
  storageKey: undefined,
  sha256: undefined,
  erreur: undefined,
  styleVersion: 1,
  viewVersion: 1,
  createdAt: new Date(),
  finishedAt: undefined,
};

const mockService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  download: vi.fn(),
};

describe('ExportController', () => {
  let controller: ExportController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ExportController(mockService as never);
  });

  describe('create', () => {
    const dto: CreateExportDto = {
      versionId: 'version-1',
      format: 'PDF' as const,
      mode: 'BROUILLON' as const,
      parametres: { departementIds: ['DEP-01'] },
    };

    it('devrait créer un job et le renvoyer', async () => {
      mockService.create.mockResolvedValue(mockJob);

      const response = await controller.create(dto, mockCurrentUser());

      expect(response).toEqual(mockJob);
      expect(mockService.create).toHaveBeenCalledWith(dto, {
        id: 'user-123',
        role: RoleCode.ADMINISTRATEUR,
      });
    });

    it('devrait propager NotFoundException si la version est introuvable', async () => {
      mockService.create.mockRejectedValue(
        new NotFoundException('Version introuvable'),
      );

      await expect(controller.create(dto, mockCurrentUser())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait propager BadRequestException sur mode officiel invalide', async () => {
      mockService.create.mockRejectedValue(
        new BadRequestException('L export officiel nécessite une version PUBLIEE ou ARCHIVEE (422).'),
      );

      await expect(
        controller.create({ ...dto, mode: 'OFFICIEL' as const }, mockCurrentUser()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const query: ExportQueryDto = { page: 1, limit: 10 };

    it('devrait retourner une liste paginée', async () => {
      const result = {
        data: [mockJob],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query, mockCurrentUser());

      expect(response).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith(
        query,
        { id: 'user-123', role: RoleCode.ADMINISTRATEUR },
      );
    });
  });

  describe('findById', () => {
    it('devrait retourner le job demandé', async () => {
      mockService.findById.mockResolvedValue(mockJob);

      const response = await controller.findById('job-1', mockCurrentUser());

      expect(response).toEqual(mockJob);
      expect(mockService.findById).toHaveBeenCalledWith('job-1', {
        id: 'user-123',
        role: RoleCode.ADMINISTRATEUR,
      });
    });

    it('devrait lever NotFoundException si le job est introuvable', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundException('ExportJob introuvable : job-999'),
      );

      await expect(
        controller.findById('job-999', mockCurrentUser()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('download', () => {
    it('devrait retourner une URL signée si le job est DONE', async () => {
      const doneJob = { ...mockJob, statut: 'DONE', storageKey: 'abc/export-1.txt' };
      mockService.download.mockResolvedValue({
        downloadUrl: '/filestore/abc/export-1.txt',
        expiresIn: 3600,
      });

      const response = await controller.download('job-1', mockCurrentUser());

      expect(response).toEqual({
        downloadUrl: '/filestore/abc/export-1.txt',
        expiresIn: 3600,
      });
      expect(mockService.download).toHaveBeenCalledWith('job-1', {
        id: 'user-123',
        role: RoleCode.ADMINISTRATEUR,
      });
    });

    it('devrait lever ConflictException si le job n est pas terminé', async () => {
      mockService.download.mockRejectedValue(
        new ConflictException("L export n est pas encore terminé."),
      );

      await expect(
        controller.download('job-1', mockCurrentUser()),
      ).rejects.toThrow(ConflictException);
    });
  });
});
