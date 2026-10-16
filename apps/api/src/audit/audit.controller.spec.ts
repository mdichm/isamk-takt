// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur de consultation de l'audit (L0-18)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

const mockFindAll = vi.fn();

vi.mock('./audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    findAll: mockFindAll,
  })),
}));

describe('AuditController', () => {
  let controller: AuditController;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'ADMINISTRATEUR',
    departments: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuditController({ findAll: mockFindAll } as unknown as AuditService);
  });

  it('should return paginated audit entries for administrator', async () => {
    const expected = {
      data: [
        {
          id: '1',
          at: new Date('2026-10-16T12:00:00Z'),
          userId: mockUser.id,
          action: 'CREATE',
          objetType: 'User',
          objetId: '550e8400-e29b-41d4-a716-446655440001',
          ancienneValeur: null,
          nouvelleValeur: { email: 'new@test.com' },
          versionId: null,
          motif: null,
          requestId: null,
          ip: null,
        },
      ],
      nextCursor: null,
    };
    mockFindAll.mockResolvedValue(expected);

    const result = await controller.findAll(
      { limit: 50 },
      mockUser,
    );

    expect(mockFindAll).toHaveBeenCalledWith(
      {
        objetType: undefined,
        objetId: undefined,
        userId: undefined,
        from: undefined,
        to: undefined,
        limit: 50,
        cursor: undefined,
      },
      { id: mockUser.id, role: mockUser.role, departments: undefined },
    );
    expect(result).toEqual(expected);
  });

  it('should pass filters and cursor to service', async () => {
    mockFindAll.mockResolvedValue({ data: [], nextCursor: null });

    await controller.findAll(
      {
        objetType: 'User',
        objetId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser.id,
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-31T23:59:59Z',
        limit: 25,
        cursor: '100',
      },
      mockUser,
    );

    expect(mockFindAll).toHaveBeenCalledWith(
      {
        objetType: 'User',
        objetId: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUser.id,
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-31T23:59:59Z',
        limit: 25,
        cursor: '100',
      },
      { id: mockUser.id, role: mockUser.role, departments: undefined },
    );
  });
});
