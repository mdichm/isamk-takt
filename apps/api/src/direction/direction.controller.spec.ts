// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur Espace Direction (L5-29)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectionController } from './direction.controller.js';

const mockFindVersions = vi.fn();
const mockFindSeancesByVersion = vi.fn();
const mockFindSeanceById = vi.fn();
const mockFindRepartitions = vi.fn();
const mockFindCharges = vi.fn();
const mockFindContraintes = vi.fn();
const mockFindAudit = vi.fn();
const mockFindExports = vi.fn();

const mockDirectionService = {
  findVersions: mockFindVersions,
  findSeancesByVersion: mockFindSeancesByVersion,
  findSeanceById: mockFindSeanceById,
  findRepartitions: mockFindRepartitions,
  findCharges: mockFindCharges,
  findContraintes: mockFindContraintes,
  findAudit: mockFindAudit,
  findExports: mockFindExports,
};

describe('DirectionController', () => {
  let controller: DirectionController;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'DIRECTION',
    departments: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DirectionController(
      mockDirectionService as never,
    );
  });

  it('should list published/archived versions', async () => {
    const expected = [
      { id: 'v1', numero: '1.0', statut: 'PUBLIE' },
      { id: 'v2', numero: '2.0', statut: 'ARCHIVE' },
    ];
    mockFindVersions.mockResolvedValue(expected);

    const result = await controller.findVersions();

    expect(mockFindVersions).toHaveBeenCalledWith();
    expect(result).toEqual(expected);
  });

  it('should list seances for a published version', async () => {
    const expected = {
      data: [{ id: 's1', versionId: 'v1', jour: '2026-01-05' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    mockFindSeancesByVersion.mockResolvedValue(expected);

    const result = await controller.findSeancesByVersion(
      'v1',
      { page: 1, limit: 20 },
      mockUser,
    );

    expect(mockFindSeancesByVersion).toHaveBeenCalledWith(
      'v1',
      { page: 1, limit: 20 },
      mockUser,
    );
    expect(result).toEqual(expected);
  });

  it('should list repartitions', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    mockFindRepartitions.mockResolvedValue(expected);

    const result = await controller.findRepartitions({ page: 1, limit: 10 });

    expect(mockFindRepartitions).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      expect.objectContaining({ role: 'DIRECTION' }),
    );
    expect(result).toEqual(expected);
  });

  it('should list charges', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    mockFindCharges.mockResolvedValue(expected);

    const result = await controller.findCharges(
      { page: 1, limit: 10 },
      mockUser,
    );

    expect(mockFindCharges).toHaveBeenCalledWith({ page: 1, limit: 10 }, mockUser);
    expect(result).toEqual(expected);
  });

  it('should list contraintes', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    mockFindContraintes.mockResolvedValue(expected);

    const result = await controller.findContraintes({ page: 1, limit: 10 });

    expect(mockFindContraintes).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(result).toEqual(expected);
  });

  it('should list audit entries', async () => {
    const expected = { data: [], nextCursor: null };
    mockFindAudit.mockResolvedValue(expected);

    const result = await controller.findAudit(
      { limit: 50 },
      mockUser,
    );

    expect(mockFindAudit).toHaveBeenCalledWith({ limit: 50 }, mockUser);
    expect(result).toEqual(expected);
  });

  it('should list exports', async () => {
    const expected = [{ id: 'plannings-publies', libelle: 'Plannings publiés', disponible: true }];
    mockFindExports.mockResolvedValue(expected);

    const result = await controller.findExports();

    expect(mockFindExports).toHaveBeenCalledWith();
    expect(result).toEqual(expected);
  });
});
