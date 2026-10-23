// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires de VoeuxEvalController (L3-35).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VoeuxEvalController } from './voeux-eval.controller.js';
import { VoeuxEvalService } from './voeux-eval.service.js';

const mockVoeuxEvalService = {
  score: vi.fn(),
  delta: vi.fn(),
};

describe('VoeuxEvalController', () => {
  let controller: VoeuxEvalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoeuxEvalController],
      providers: [
        { provide: VoeuxEvalService, useValue: mockVoeuxEvalService },
      ],
    }).compile();

    controller = module.get(VoeuxEvalController);
    vi.clearAllMocks();
  });

  it('score retourne le dto du service', async () => {
    const expected = {
      score: 78,
      details: [],
      enseignantId: 'e1',
      semestreId: 'sem1',
    };
    mockVoeuxEvalService.score.mockResolvedValue(expected);

    const result = await controller.score('v1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    } as any, { id: 'u1', role: 'GESTIONNAIRE', departments: [] });

    expect(result).toEqual(expected);
    expect(mockVoeuxEvalService.score).toHaveBeenCalledWith('v1', 'e1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    });
  });

  it('delta retourne le dto du service', async () => {
    const expected = {
      delta: 5,
      avant: { score: 70, details: [], enseignantId: 'e1', semestreId: 'sem1' },
      apres: { score: 75, details: [], enseignantId: 'e1', semestreId: 'sem1' },
      details: [],
    };
    mockVoeuxEvalService.delta.mockResolvedValue(expected);

    const result = await controller.delta('v1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    } as any, { id: 'u1', role: 'GESTIONNAIRE', departments: [] });

    expect(result).toEqual(expected);
    expect(mockVoeuxEvalService.delta).toHaveBeenCalledWith('v1', 'e1', {
      enseignantId: 'e1',
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: 'r1',
    });
  });

  it('score lance une erreur si enseignantId manquant', async () => {
    await expect(
      controller.score('v1', { jour: 'LUNDI' } as any, {
        id: 'u1',
        role: 'GESTIONNAIRE',
        departments: [],
      }),
    ).rejects.toThrow();
  });
});
