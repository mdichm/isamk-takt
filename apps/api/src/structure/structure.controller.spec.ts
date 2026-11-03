// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du contrôleur Structure académique (L1-03)
import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { StructureController } from './structure.controller.js';
import { PERMISSIONS_KEY } from '../policy/decorators/permissions.decorator.js';
import { PolicyService } from '../policy/policy.service.js';
import { RoleCode } from '@takt/db';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return {
    PrismaClient: PrismaClientMock,
    RoleCode: {
      ADMINISTRATEUR: 'ADMINISTRATEUR',
      GESTIONNAIRE: 'GESTIONNAIRE',
      RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
      DIRECTION: 'DIRECTION',
      ENSEIGNANT: 'ENSEIGNANT',
      ETUDIANT: 'ETUDIANT',
    },
  };
});

const ROLES_METIER = [
  RoleCode.ADMINISTRATEUR,
  RoleCode.GESTIONNAIRE,
  RoleCode.RESPONSABLE_DEPARTEMENT,
  RoleCode.DIRECTION,
];

describe('StructureController (métadonnées de permissions)', () => {
  const policy = new PolicyService();

  /** Toutes les permissions déclarées par @Permissions sur les méthodes du contrôleur. */
  function declaredPermissions(): string[] {
    const prototype = StructureController.prototype as unknown as Record<string, unknown>;
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

  // Une permission inexistante dans PolicyService (ex. « structure:read ») rend la
  // route inaccessible à tous les rôles : le contrôleur doit n'utiliser que le
  // vocabulaire « referentiel:read » / « referentiel:write ».
  it('ne déclare que des permissions connues de PolicyService', () => {
    const permissions = declaredPermissions();
    expect(permissions.length).toBeGreaterThan(0);

    for (const permission of permissions) {
      const granted = ROLES_METIER.some((role) => policy.getPermissions(role).includes(permission));
      expect(granted, `permission « ${permission} » inconnue de PolicyService`).toBe(true);
    }
  });

  it('exige referentiel:read pour lister les départements', () => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, StructureController.prototype.findAllDepartements),
    ).toEqual(['referentiel:read']);
  });

  it('exige referentiel:write pour créer un département', () => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, StructureController.prototype.createDepartement),
    ).toEqual(['referentiel:write']);
  });

  it('autorise les quatre rôles métier à lire le référentiel', () => {
    for (const role of ROLES_METIER) {
      expect(policy.getPermissions(role)).toContain('referentiel:read');
    }
  });
});