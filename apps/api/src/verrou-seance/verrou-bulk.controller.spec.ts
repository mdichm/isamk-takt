// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests contrôleur VerrouBulk (L3-37)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock des decorators avant l'import du contrôleur
vi.mock('@nestjs/swagger', () => ({
  ApiTags: () => () => {},
  ApiBearerAuth: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  Controller: () => () => {},
  Post: () => () => {},
  Delete: () => () => {},
  Param: () => () => {},
  Body: () => () => {},
  Query: () => () => {},
  HttpCode: () => () => {},
  HttpStatus: { OK: 200 },
  ParseBoolPipe: class { optional: boolean; constructor(opts: { optional: boolean }) { this.optional = opts.optional; } },
  ApiProperty: () => () => {},
  ApiPropertyOptional: () => () => {},
}));

vi.mock('../common/decorators/current-user.decorator.js', () => ({
  CurrentUser: () => () => {},
}));



import { VerrouBulkController, VerrouDeleteController } from './verrou-bulk.controller.js';
import { RoleCode, VerrouType } from '@takt/db';
import { BulkPoseVerrouDto } from './dto/bulk-pose-verrou.dto.js';

vi.mock('@takt/db', () => ({
  RoleCode: {
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    GESTIONNAIRE: 'GESTIONNAIRE',
    RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
  },
  VerrouType: {
    CRENEAU: 'CRENEAU',
    SALLE: 'SALLE',
    ENSEIGNANT: 'ENSEIGNANT',
    ACTIVITE: 'ACTIVITE',
  },
}));

describe('VerrouBulkController', () => {
  let controller: VerrouBulkController;
  let service: any;

  const versionId = '550e8400-e29b-41d4-a716-446655440001';
  const auteurId = '550e8400-e29b-41d4-a716-446655440000';
  const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };
  const cible = { type: 'GROUPE' as const, id: '550e8400-e29b-41d4-a716-446655440010' };

  beforeEach(() => {
    service = {
      bulkPose: vi.fn(),
    };
    controller = new VerrouBulkController(service);
  });

  it('appelle bulkPose avec les bons paramètres', async () => {
    const dto: BulkPoseVerrouDto = {
      cible,
      type: VerrouType.SALLE,
      justification: 'Test bulk',
    };
    const expectedResult = {
      poses: 2,
      ignores: 0,
      details: [
        { seanceId: 'seance-1', status: 'POSED' as const },
        { seanceId: 'seance-2', status: 'POSED' as const },
      ],
    };
    service.bulkPose.mockResolvedValue(expectedResult);

    const result = await controller.bulkPose(versionId, dto, currentUser);

    expect(service.bulkPose).toHaveBeenCalledWith(
      versionId,
      cible,
      VerrouType.SALLE,
      'Test bulk',
      auteurId,
      currentUser,
    );
    expect(result).toEqual(expectedResult);
  });

  it('gère idempotencyKey optionnel (via header, géré par intercepteur)', async () => {
    const dto: BulkPoseVerrouDto = {
      cible,
      type: VerrouType.SALLE,
    };
    service.bulkPose.mockResolvedValue({ poses: 1, ignores: 0, details: [] });

    // L'idempotencyKey n'est plus un paramètre explicite (géré par l'intercepteur global)
    await controller.bulkPose(versionId, dto, currentUser);

    expect(service.bulkPose).toHaveBeenCalled();
  });
});

describe('VerrouDeleteController', () => {
  let controller: VerrouDeleteController;
  let service: any;

  const verrouId = '550e8400-e29b-41d4-a716-446655440005';
  const auteurId = '550e8400-e29b-41d4-a716-446655440000';
  const currentUser = { id: auteurId, role: RoleCode.GESTIONNAIRE };

  beforeEach(() => {
    service = {
      leveWithPreview: vi.fn(),
    };
    controller = new VerrouDeleteController(service);
  });

  it('retourne preview quand preview=true', async () => {
    const expectedPreview = {
      verrouId,
      seancesConcernees: 1,
      avertissement: 'La prochaine génération pourra déplacer cette séance.',
    };
    service.leveWithPreview.mockResolvedValue(expectedPreview);

    const result = await controller.leve(verrouId, true, currentUser);

    expect(service.leveWithPreview).toHaveBeenCalledWith(verrouId, currentUser, true);
    expect(result).toEqual(expectedPreview);
  });

  it('lève le verrou quand preview=false (défaut)', async () => {
    const expectedResult = {
      id: verrouId,
      versionId: '550e8400-e29b-41d4-a716-446655440001',
      seanceId: '550e8400-e29b-41d4-a716-446655440002',
      type: VerrouType.SALLE,
      auteurId,
      justification: 'Test',
      creeLe: new Date(),
      leveLe: new Date(),
      levePar: auteurId,
    };
    service.leveWithPreview.mockResolvedValue(expectedResult);

    const result = await controller.leve(verrouId, false, currentUser);

    expect(service.leveWithPreview).toHaveBeenCalledWith(verrouId, currentUser, false);
    expect(result).toEqual(expectedResult);
  });

  it('par défaut preview=false si non fourni', async () => {
    const expectedResult = { id: verrouId, leveLe: new Date() };
    service.leveWithPreview.mockResolvedValue(expectedResult);

    // @ts-ignore - test du défaut
    await controller.leve(verrouId, undefined, currentUser);

    expect(service.leveWithPreview).toHaveBeenCalledWith(verrouId, currentUser, false);
  });
});