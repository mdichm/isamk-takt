// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur ExportStyle (L6-02)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExportStyleController } from './export-style.controller.js';
import { ExportStyleService } from './export-style.service.js';
import { CreateExportStyleDto, UpdateExportStyleDto, ExportStyleResponseDto } from './dto/index.js';
import { RoleCode } from '@takt/db';

const mockCurrentUser = (role: string = RoleCode.ADMINISTRATEUR) => ({
  id: 'user-123',
  role,
});

const mockStyle: ExportStyleResponseDto = {
  id: 'style-1',
  code: 'DEFAULT',
  styleVersion: 1,
  libelle: 'Style par défaut',
  config: { logo: { storageKey: 'key1', sha256: 'hash1' } },
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
  ensureDefaultStyle: vi.fn(),
  markAsUsed: vi.fn(),
};

describe('ExportStyleController', () => {
  let controller: ExportStyleController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ExportStyleController(
      mockService as never,
    );
  });

  describe('findAll', () => {
    it('devrait retourner une liste paginée de styles', async () => {
      const result = {
        data: [mockStyle],
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

      await controller.findAll({ code: 'DEFAULT', actif: true });

      expect(mockService.findAll).toHaveBeenCalledWith({
        code: 'DEFAULT',
        actif: true,
      });
    });
  });

  describe('findById', () => {
    it('devrait retourner le style demandé', async () => {
      mockService.findById.mockResolvedValue(mockStyle);

      const response = await controller.findById('style-1');

      expect(response).toEqual(mockStyle);
      expect(mockService.findById).toHaveBeenCalledWith('style-1');
    });

    it('devrait lever NotFoundException si le style n\'existe pas', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException('ExportStyle introuvable : style-999'));

      await expect(controller.findById('style-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateExportStyleDto = {
      code: 'TEST',
      libelle: 'Style test',
      config: { couleur: '#ff0000' },
    };

    it('devrait créer un nouveau style', async () => {
      const created = { ...mockStyle, code: 'TEST', libelle: 'Style test' };
      mockService.create.mockResolvedValue(created);

      const response = await controller.create(createDto, mockCurrentUser());

      expect(response).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith(createDto, 'user-123', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever ForbiddenException si l\'utilisateur n\'est pas Admin', async () => {
      mockService.create.mockRejectedValue(new ForbiddenException('Réservé à l\'Administrateur'));

      await expect(
        controller.create(createDto, mockCurrentUser('MANAGER')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateExportStyleDto = {
      libelle: 'Nouveau libellé',
    };

    it('devrait mettre à jour un style non utilisé', async () => {
      const updated = { ...mockStyle, libelle: 'Nouveau libellé' };
      mockService.update.mockResolvedValue(updated);

      const response = await controller.update('style-1', updateDto, mockCurrentUser());

      expect(response).toEqual(updated);
      expect(mockService.update).toHaveBeenCalledWith('style-1', updateDto, 'user-123', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever ForbiddenException si l\'utilisateur n\'est pas Admin', async () => {
      mockService.update.mockRejectedValue(new ForbiddenException('Réservé à l\'Administrateur'));

      await expect(
        controller.update('style-1', updateDto, mockCurrentUser('MANAGER')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer un style', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('style-1', mockCurrentUser());

      expect(mockService.remove).toHaveBeenCalledWith('style-1', RoleCode.ADMINISTRATEUR);
    });

    it('devrait lever BadRequestException si le style est déjà utilisé', async () => {
      mockService.remove.mockRejectedValue(new BadRequestException('CONFIG_IN_USE'));

      await expect(controller.remove('style-1', mockCurrentUser())).rejects.toThrow(BadRequestException);
    });
  });
});