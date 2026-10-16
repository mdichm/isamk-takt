import { describe, it, expect } from 'vitest';
import { PolicyService } from './policy.service.js';
import { RoleCode } from '@takt/db';

vi.mock('@takt/db', () => ({
  RoleCode: {
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    GESTIONNAIRE: 'GESTIONNAIRE',
    RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
    DIRECTION: 'DIRECTION',
    ENSEIGNANT: 'ENSEIGNANT',
    ETUDIANT: 'ETUDIANT',
  },
}));

describe('PolicyService (matrice RBAC ST §5.2)', () => {
  const policy = new PolicyService();

  const adm = RoleCode.ADMINISTRATEUR;
  const ges = RoleCode.GESTIONNAIRE;
  const resp = RoleCode.RESPONSABLE_DEPARTEMENT;
  const dir = RoleCode.DIRECTION;

  it('Administrateur possède l union des droits (EX-ROL-02)', () => {
    const perms = policy.getPermissions(adm);
    expect(perms).toContain('user:manage');
    expect(perms).toContain('repartition:write');
    expect(perms).toContain('version:publish');
    expect(perms).toContain('securite:write');
  });

  it('Gestionnaire ne modifie pas la répartition (EX-ROL-05)', () => {
    expect(policy.hasPermission(ges, ['repartition:write'])).toBe(false);
    expect(policy.hasPermission(ges, ['repartition:validate'])).toBe(false);
    expect(policy.hasPermission(ges, ['enseignant:write'])).toBe(false);
    // mais il peut lire le référentiel et créer des versions
    expect(policy.hasPermission(ges, ['referentiel:read'])).toBe(true);
    expect(policy.hasPermission(ges, ['version:create'])).toBe(true);
  });

  it('Direction est lecture seule (aucun *:write)', () => {
    const perms = policy.getPermissions(dir);
    const metier = perms.filter((p) => !p.startsWith('auth:') && !p.startsWith('mfa:'));
    expect(metier.some((p) => p.endsWith(':write'))).toBe(false);
    expect(metier.some((p) => p.endsWith(':manage'))).toBe(false);
    expect(policy.getPermissions(dir)).toContain('referentiel:read');
    expect(policy.getPermissions(dir)).toContain('version:read');
    expect(policy.hasPermission(dir, ['version:read'])).toBe(true);
    expect(policy.hasPermission(dir, ['version:publish'])).toBe(false);
    expect(policy.hasPermission(dir, ['user:manage'])).toBe(false);
  });

  it('Responsable de département peut valider sa répartition', () => {
    expect(policy.hasPermission(resp, ['repartition:write'])).toBe(true);
    expect(policy.hasPermission(resp, ['repartition:validate'])).toBe(true);
    expect(policy.hasPermission(resp, ['enseignant:write'])).toBe(true);
    // il ne génère ni ne publie
    expect(policy.hasPermission(resp, ['generation:launch'])).toBe(false);
    expect(policy.hasPermission(resp, ['version:publish'])).toBe(false);
  });

  it('ENSEIGNANT et ETUDIANT n ont aucune permission (defaut = refus)', () => {
    expect(policy.getPermissions(RoleCode.ENSEIGNANT)).toEqual([]);
    expect(policy.getPermissions(RoleCode.ETUDIANT)).toEqual([]);
    expect(policy.hasPermission(RoleCode.ENSEIGNANT, ['referentiel:read'])).toBe(
      false,
    );
    expect(policy.hasPermission(RoleCode.ETUDIANT, ['version:read'])).toBe(false);
  });

  it('hasAllPermissions requiert toutes les permissions', () => {
    expect(policy.hasAllPermissions(adm, ['user:manage', 'version:read'])).toBe(
      true,
    );
    expect(policy.hasAllPermissions(dir, ['referentiel:read', 'user:manage'])).toBe(
      false,
    );
  });

  it('isWithinScope: pas de portée => accès tout', () => {
    expect(
      policy.isWithinScope(adm, undefined, 'DEP1'),
    ).toBe(true);
    expect(
      policy.isWithinScope(ges, undefined, 'DEP1'),
    ).toBe(true);
  });

  it('isWithinScope: responsable limité a son departement', () => {
    // Le responsable n a pas de departement fixe dans la matrice (portée dynamique),
    // la fonction renvoie true quand le rôle n est pas limité par departement dans
    // la politique statique (le ScopeGuard resout le departement de l utilisateur).
    expect(policy.isWithinScope(resp, ['DEP1'], 'DEP1')).toBe(true);
    expect(policy.isWithinScope(resp, ['DEP1'], 'DEP2')).toBe(false);
    // La Direction n a pas de departement : elle ne peut pas acceder a un objet
    // départemental via la portee (elle lit les versions publiees, hors portee).
    expect(policy.isWithinScope(dir, undefined, 'DEP1')).toBe(false);
    // Objet sans departement (partage) => accessible.
    expect(policy.isWithinScope(dir, undefined, null)).toBe(true);
    expect(policy.isWithinScope(dir, undefined, undefined)).toBe(true);
  });

  it('requirePermission lance ForbiddenException en cas de refus', () => {
    expect(() =>
      policy.requirePermission(dir, ['user:manage']),
    ).toThrow(/Permissions insuffisantes/);
    expect(() =>
      policy.requirePermission(adm, ['user:manage']),
    ).not.toThrow();
  });

  it('checkSegregationOfDuties: meme utilisateur soumet et valide (EX-ROL-06)', () => {
    const sameUser = 'user-1';
    expect(() =>
      policy.checkSegregationOfDuties(sameUser, sameUser),
    ).toThrow(/SEGREGATION_OF_DUTIES/);
  });

  it('checkSegregationOfDuties: utilisateurs differents est autorise', () => {
    expect(() =>
      policy.checkSegregationOfDuties('user-submitter', 'user-validator'),
    ).not.toThrow();
  });

  it('checkSegregationOfDuties: submitter indefini => aucune contrainte', () => {
    expect(() =>
      policy.checkSegregationOfDuties(undefined, 'user-validator'),
    ).not.toThrow();
  });

  it('checkSegregationOfDuties: user indefini => aucune contrainte', () => {
    expect(() =>
      policy.checkSegregationOfDuties('user-submitter', undefined),
    ).not.toThrow();
  });
});
