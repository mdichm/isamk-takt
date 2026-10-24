// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur des profils de génération (L4-10)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilsController } from './profils.controller.js';
import { ProfilsService } from './profils.service.js';

const mockCreate = vi.fn();
const mockGetProfils = vi.fn();
const mockGetProfil = vi.fn();
const mockUpdate = vi.fn();
const mockSetDefault = vi.fn();
const mockGetDefault = vi.fn();

const mockService = {
  createProfil: mockCreate,
  getProfils: mockGetProfils,
  getProfil: mockGetProfil,
  updateProfil: mockUpdate,
  setDefaultProfil: mockSetDefault,
  getDefaultProfil: mockGetDefault,
};

vi.mock('./profils.service.js', () => ({
  ProfilsService: vi.fn().mockImplementation(() => mockService),
}));

describe('ProfilsController', () => {
  let controller: ProfilsController;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'GESTIONNAIRE',
    departments: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ProfilsController(mockService as unknown as ProfilsService);
  });

  it('should create a profil', async () => {
    const dto = {
      semestreId: 's1',
      nom: 'Standard S1',
      dureeLimiteMinutes: 120,
    };
    const expected = { id: 'p1', semestreId: 's1', nom: 'Standard S1', numero: 1 };
    mockCreate.mockResolvedValue(expected);

    const result = await controller.create(dto, mockUser);

    expect(mockCreate).toHaveBeenCalledWith('s1', dto, mockUser);
    expect(result).toEqual(expected);
  });

  it('should return list of profils for a semestre', async () => {
    const expected = [{ id: 'p1', semestreId: 's1', nom: 'Standard S1', numero: 1 }];
    mockGetProfils.mockResolvedValue(expected);

    const result = await controller.findBySemestre('s1');

    expect(mockGetProfils).toHaveBeenCalledWith('s1');
    expect(result).toEqual(expected);
  });

  it('should return a profil by id', async () => {
    const expected = { id: 'p1', semestreId: 's1', nom: 'Standard S1', numero: 1 };
    mockGetProfil.mockResolvedValue(expected);

    const result = await controller.findOne('p1');

    expect(mockGetProfil).toHaveBeenCalledWith('p1');
    expect(result).toEqual(expected);
  });

  it('should update a profil', async () => {
    const dto = { nom: 'Standard S1 v2' };
    const expected = { id: 'p1', semestreId: 's1', nom: 'Standard S1 v2', numero: 1 };
    mockUpdate.mockResolvedValue(expected);

    const result = await controller.update('p1', dto, mockUser);

    expect(mockUpdate).toHaveBeenCalledWith('p1', dto, mockUser);
    expect(result).toEqual(expected);
  });

  it('should set default profil', async () => {
    const dto = { profilId: 'p1' };
    const expected = { id: 'p1', semestreId: 's1', nom: 'Standard S1', estParDefaut: true };
    mockSetDefault.mockResolvedValue(expected);

    const result = await controller.setDefault('s1', dto, mockUser);

    expect(mockSetDefault).toHaveBeenCalledWith('s1', dto, mockUser);
    expect(result).toEqual(expected);
  });

  it('should return default profil for a semestre', async () => {
    const expected = { id: 'p1', semestreId: 's1', nom: 'Standard S1', estParDefaut: true };
    mockGetDefault.mockResolvedValue(expected);

    const result = await controller.getDefault('s1');

    expect(mockGetDefault).toHaveBeenCalledWith('s1');
    expect(result).toEqual(expected);
  });
});