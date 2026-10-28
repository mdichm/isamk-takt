// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur ExportView (L6-03)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExportViewController } from './export-view.controller.js';
import { ExportViewService } from './export-view.service.js';
import { CreateExportViewDto, UpdateExportViewDto, ExportViewResponseDto } from './dto/index.js';
import { RoleCode } from '@takt/db';

const mockCurrentUser = (role: string = RoleCode.ADMINISTRATEUR) => ({
  id: 'user-123',
  role,
});

const mockView: ExportViewResponseDto = {
  id: 'view-1',
  code: 'GROUPE',
  viewVersion: 1,
  libelle: 'Vue Groupe',
  vue: 'groupe',
  format: 'PDF',
  config: { colonnes: ['nom', 'effectif'], ordre: 'asc' },
  actif: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  ensureDefaultViews: vi.fn(),
  markAsUsed: vi.fn(),
};

describe('ExportViewController', () => {
  let controller: ExportViewController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ExportViewController(
      mockService as never,
    );
  });

  describe('findAll', () => {
    it('devrait retourner une liste paginée de vues', async () => {
      const result = {
        data: [mockView],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockService.findAll.mockResolvedValue(result);

      const response = await controller.findAll({ page: 1, limit: 10 });

      expect(response).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('devrait passer les filtres au service', async () => {
      mockService.findAll.mockResolvedValue({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      });

      await controller.findAll({ code: 'GROUPE', actif: true });

      expect(mockService.findAll).toHaveBeenCalledWith({
        code: 'GROUPE',
        actif: true,
      });
    });
  });

  describe('findById', () => {
    it('devrait retourner la vue demandée', async () => {
      mockService.findById.mockResolvedValue(mockView);

      const response = await controller.findById('view-1');

      expect(response).toEqual(mockView);
      expect(mockService.findById).toHaveBeenCalledWith('view-1');
    });

    it('devrait lever NotFoundException si la vue n\'existe pas', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException('ExportView introuvable : view-999'));

      await expect(controller.findById('view-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateExportViewDto = {
      code: 'TEST',
      libelle: 'Vue test',
      vue: 'groupe',
      format: 'PDF',
      config: { colonnes: ['nom'] },
    };

    it('devrait créer une nouvelle vue', async () => {
      const created = { ...mockView, code: 'TEST', libelle: 'Vue test' };
      mockService.create.mockResolvedValue(created);

      const response = await controller.create(createDto, mockCurrentUser());

      expect(response).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith(createDto, 'user-123', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever ForbiddenException si l\'utilisateur n\'est ni Admin ni Gestionnaire', async () => {
      mockService.create.mockRejectedValue(new ForbiddenException('Réservé à l\'Administrateur et au Gestionnaire'));

      await expect(
        controller.create(createDto, mockCurrentUser('VIEWER')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateExportViewDto = {
      libelle: 'Nouveau libellé',
    };

    it('devrait mettre à jour une vue non utilisée', async () => {
      const updated = { ...mockView, libelle: 'Nouveau libellé' };
      mockService.update.mockResolvedValue(updated);

      const response = await controller.update('view-1', updateDto, mockCurrentUser());

      expect(response).toEqual(updated);
      expect(mockService.update).toHaveBeenCalledWith('view-1', updateDto, 'user-123', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever ForbiddenException si l\'utilisateur n\'est ni Admin ni Gestionnaire', async () => {
      mockService.update.mockRejectedValue(new ForbiddenException('Réservé à l\'Administrateur et au Gestionnaire'));

      await expect(
        controller.update('view-1', updateDto, mockCurrentUser('VIEWER')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une vue', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('view-1', mockCurrentUser());

      expect(mockService.remove).toHaveBeenCalledWith('view-1', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever BadRequestException si la vue est déjà utilisée', async () => {
      mockService.remove.mockRejectedValue(new BadRequestException('CONFIG_IN_USE'));

      await expect(controller.remove('view-1', mockCurrentUser())).rejects.toThrow(BadRequestException);
    });
  });
});