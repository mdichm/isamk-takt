// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires des permissions du contrôleur Groupes
import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { GroupesController } from './groupes.controller.js';
import { PERMISSIONS_KEY } from '../policy/decorators/permissions.decorator.js';
import { PolicyService } from '../policy/policy.service.js';
import { RoleCode } from '@takt/db';

vi.mock('@takt/db', () => ({
  PrismaClient: class PrismaClientMock {},
  RoleCode: {
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    GESTIONNAIRE: 'GESTIONNAIRE',
    RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
    DIRECTION: 'DIRECTION',
    ENSEIGNANT: 'ENSEIGNANT',
    ETUDIANT: 'ETUDIANT',
  },
}));

const ROLES_METIER = [
  RoleCode.ADMINISTRATEUR,
  RoleCode.GESTIONNAIRE,
  RoleCode.RESPONSABLE_DEPARTEMENT,
  RoleCode.DIRECTION,
];

describe('GroupesController (métadonnées de permissions)', () => {
  const policy = new PolicyService();

  function declaredPermissions(): string[] {
    const prototype = GroupesController.prototype as unknown as Record<string, unknown>;
    const permissions = new Set<string>();
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (name === 'constructor') continue;
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, prototype[name] as object);
      if (Array.isArray(metadata)) {
        for (const permission of metadata) permissions.add(permission);
      }
    }
    return [...permissions];
  }

  it('ne déclare que des permissions connues de PolicyService', () => {
    const permissions = declaredPermissions();
    expect(permissions.length).toBeGreaterThan(0);

    for (const permission of permissions) {
      const granted = ROLES_METIER.some((role) => policy.getPermissions(role).includes(permission));
      expect(granted, `permission « ${permission} » inconnue de PolicyService`).toBe(true);
    }
  });

  it('utilise le vocabulaire du référentiel pour lire et modifier les groupes', () => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, GroupesController.prototype.findAllGroupes),
    ).toEqual(['referentiel:read']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, GroupesController.prototype.createGroupe),
    ).toEqual(['referentiel:write']);
  });
});
