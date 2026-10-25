// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur Parametres (L5-17)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParametresController } from './parametres.controller.js';
import { ParametresService } from './parametres.service.js';
import type { WorkflowParamsResponseDto } from './dto/workflow-params-response.dto.js';
import type { WorkflowParamsUpdateDto } from './dto/workflow-params-update.dto.js';

const mockGetParams = vi.fn();
const mockUpdateParams = vi.fn();

const mockService = {
  getParams: mockGetParams,
  updateParams: mockUpdateParams,
};

vi.mock('./parametres.service.js', () => ({
  ParametresService: vi.fn().mockImplementation(() => mockService),
}));

describe('ParametresController', () => {
  let controller: ParametresController;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'ADMINISTRATEUR',
  };

  const expectedParams: WorkflowParamsResponseDto = {
    validationPlanningRequise: true,
    publicationRequise: false,
    updatedAt: new Date('2026-10-25T10:00:00Z'),
    updatedBy: mockUser.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ParametresController(
      mockService as unknown as ParametresService,
    );
  });

  describe('getWorkflowParams', () => {
    it('retourne les paramètres du workflow', async () => {
      mockGetParams.mockResolvedValue(expectedParams);

      const result = await controller.getWorkflowParams();

      expect(mockGetParams).toHaveBeenCalledWith();
      expect(result).toEqual(expectedParams);
    });
  });

  describe('updateWorkflowParams', () => {
    const dto: WorkflowParamsUpdateDto = {
      validationPlanningRequise: false,
      publicationRequise: true,
      motif: 'Mise à jour de test',
    };

    const updatedParams: WorkflowParamsResponseDto = {
      validationPlanningRequise: false,
      publicationRequise: true,
      updatedAt: new Date('2026-10-25T11:00:00Z'),
      updatedBy: mockUser.id,
    };

    it('met à jour les paramètres avec l utilisateur courant', async () => {
      mockUpdateParams.mockResolvedValue(updatedParams);

      const result = await controller.updateWorkflowParams(dto, mockUser);

      expect(mockUpdateParams).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(updatedParams);
    });

    it('transmet uniquement l id utilisateur au service', async () => {
      mockUpdateParams.mockResolvedValue(updatedParams);

      await controller.updateWorkflowParams(dto, mockUser);

      expect(mockUpdateParams).toHaveBeenCalledWith(dto, mockUser.id);
      expect(mockUpdateParams).not.toHaveBeenCalledWith(dto, mockUser);
    });
  });
});
