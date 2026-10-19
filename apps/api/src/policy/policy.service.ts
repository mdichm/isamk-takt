import { Injectable, ForbiddenException } from '@nestjs/common';
import { RoleCode } from '@takt/db';

type Permission = string;

interface RolePolicy {
  permissions: Permission[];
}

const AUTH_ME_LOGOUT_MFA = ['auth:me', 'auth:logout', 'mfa:manage'];

/**
 * Roles sans portée département : ils accèdent à tous les départements.
 */
const UNSCOPED_ROLES = new Set<RoleCode>([
  RoleCode.ADMINISTRATEUR,
  RoleCode.GESTIONNAIRE,
]);

/**
 * Moteur de politique RBAC avec portée (département), matricé sur ST §5.2.
 * Défaut = refus ; séparation des fonctions (Gestionnaire pas d'écriture sur la
 * répartition, Direction lecture seule, Administrateur = union des droits).
 *
 * Les routes d'authentification de soi (me / logout / mfa) sont accessibles à
 * tout utilisateur authentifié possédant l'un des quatre rôles métier.
 */
@Injectable()
export class PolicyService {
  private readonly policies = new Map<RoleCode, RolePolicy>([
    [
      RoleCode.ADMINISTRATEUR,
      {
        permissions: [
          'user:manage','role:manage','securite:write','security-event:read',
          'annee:manage','annee:transition','annee:read','annee:write',
          'referentiel:write','creneau:write','creneaux:generate','charge-ruleset:write','export-style:write','referentiel:read',
          'enseignant:write','salle:read','salle:write',
          'creneau-affichage:write','indisponibilite:write',
          'repartition:read','repartition:write','repartition:validate',
          'charges:read',
          'contrainte:read','contrainte:write','voeu:write','covoiturage:write','exigence-salle:write','profil:write',
          'version:create','generation:launch','seance:edit','verrou:write','avertissement:accept',
          'version:read','version:submit','version:abandon','version:validate','version:publish',
          'parametre:write','export:create','export-view:write','audit:read',
          'project:read','project:write','task:read','task:write','sprint:read','sprint:write','comment:read','comment:write','activity:read','tag:read','tag:write',
          'demande:create','demande:handle','notification:read','tableau-de-bord:read',
          ...AUTH_ME_LOGOUT_MFA,
        ],
      },
    ],
    [
      RoleCode.GESTIONNAIRE,
      {
        permissions: [
          'referentiel:read','salle:read','salle:write','creneau-affichage:write','indisponibilite:write','creneaux:generate',
          'repartition:read','charges:read','annee:read',
          'contrainte:read','contrainte:write','voeu:write','covoiturage:write','exigence-salle:write','profil:write',
          'version:create','generation:launch','verrou:write','avertissement:accept',
          'version:read','version:submit','version:abandon','version:publish',
          'export:create','export-view:write','demande:create',
          'project:read','project:write','task:read','task:write','sprint:read','sprint:write','comment:read','comment:write','activity:read','tag:read','tag:write',
          'notification:read','tableau-de-bord:read',
          'audit:read',
          ...AUTH_ME_LOGOUT_MFA,
        ],
      },
    ],
    [
      RoleCode.RESPONSABLE_DEPARTEMENT,
      {
        permissions: [
          'referentiel:read','salle:read','salle:write','enseignant:write','repartition:read','repartition:write',
          'repartition:validate','charges:read','version:read','version:validate','annee:read',
          'demande:handle',
          'project:read','project:write','task:read','task:write','sprint:read','sprint:write','comment:read','comment:write','activity:read','tag:read','tag:write',
          'notification:read','tableau-de-bord:read',
          'audit:read',
          ...AUTH_ME_LOGOUT_MFA,
        ],
      },
    ],
    [
      RoleCode.DIRECTION,
      {
        permissions: [
          'referentiel:read','salle:read','repartition:read','charges:read','version:read','annee:read',
          'contrainte:read',
          'project:read','task:read','sprint:read','comment:read','activity:read','tag:read',
          'export:create','notification:read','tableau-de-bord:read',
          'audit:read',
          ...AUTH_ME_LOGOUT_MFA,
        ],
      },
    ],
  ]);

  getPermissions(role: RoleCode): Permission[] {
    return this.policies.get(role)?.permissions ?? [];
  }

  /**
   * Verifie la portee departement d un role sur un objet cible.
   * - pas de cible departementale (objet partage) => true.
   * - role sans portee (Admin, Gestionnaire) => true.
   * - sinon, le departement de l utilisateur doit contenir le departement cible.
   */
  isWithinScope(
    role: RoleCode,
    userDepartments: string[] | undefined,
    targetDepartment: string | undefined | null,
  ): boolean {
    if (!targetDepartment) {
      return true;
    }
    if (UNSCOPED_ROLES.has(role)) {
      return true;
    }
    const departments = userDepartments ?? [];
    return departments.includes(targetDepartment);
  }

  hasPermission(role: RoleCode, required: Permission[]): boolean {
    const permissions = new Set(this.getPermissions(role));
    return required.some((p) => permissions.has(p));
  }

  hasAllPermissions(role: RoleCode, required: Permission[]): boolean {
    const permissions = new Set(this.getPermissions(role));
    return required.every((p) => permissions.has(p));
  }

  requirePermission(role: RoleCode, required: Permission[]): void {
    if (!this.hasPermission(role, required)) {
      throw new ForbiddenException('Permissions insuffisantes');
    }
  }

  /**
   * Verifie la separation des taches (EX-ROL-06, ST §4.1.2).
   *
   * Une personne ne peut pas prendre une decision de validation sur un cycle
   * qu elle a elle-meme soumise.
   *
   * - submitterId et userId definis et egaux => 403 SEGREGATION_OF_DUTIES.
   * - l un des deux IDs est indefini => aucune contrainte (pas de contexte de
   *   soumission connu).
   * - IDs differents => autorise.
   */
  checkSegregationOfDuties(
    submitterId: string | undefined,
    userId: string | undefined,
  ): void {
    if (submitterId && userId && submitterId === userId) {
      throw new ForbiddenException('SEGREGATION_OF_DUTIES');
    }
  }
}

