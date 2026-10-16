// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Test de matrice RBAC automatisée (ticket L0-16).
//
// Verifie que chaque route couverte par la matrice RBAC (ST §5.2) declare
// explicitement @Permissions(...) ou @Public(). Toute route non declaree
// fait echouer le test (AC#1 : "Un test parcourt le routeur et echoue si
// une route n'est pas declaree").
//
// La matrice cellule par cellule (AC#2) et les cas negatifs (AC#3) sont
// deja couvertes par `policy.service.spec.ts`.
//
// Les domaines du referentiel TAKT (annees, referentiel, creneaux, repartition,
// versions, ...) sont portes par AuthController et UsersController. Les
// controleurs generiques (projects, tasks, tags, comments, sprints, activities)
// ne disposent pas encore de permissions dans ST §5.2 ; leurs routes sont
// refusees par defaut (PermissionsGuard : defaut = refus) et font l'objet
// d'un ticket de suivi.

import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { AuthController } from '../auth/auth.controller.js';
import { UsersController } from '../users/users.controller.js';

/**
 * Controles couverts par la matrice RBAC (ST §5.2).
 * Toute methode publique de ces controles doit declarer @Permissions
 * (ou etre marquee @Public pour les routes d'authentification ouverte).
 */
const CONTROLES_COUVERTS_PAR_MATRICE = [AuthController, UsersController];

/**
 * Controles hors matrice RBAC (domaine generique sans permission ST §5.2
 * defini a ce jour) : projects, tasks, tags, comments, sprints, activities.
 * Exclus de ce test de matrice (ticket de suivi).
 */
const CONTROLES_HORS_MATRICE = [
  'projects',
  'tasks',
  'tags',
  'comments',
  'sprints',
  'activities',
];

interface MethodeControle {
  controle: string;
  methode: string;
}

function methodesPubliquesSansPermission(
  controles: Function[],
): MethodeControle[] {
  const reflector = new Reflector();
  const ecarts: MethodeControle[] = [];

  for (const ControleClass of controles) {
    const prototype = ControleClass.prototype;
    if (!prototype || typeof prototype !== 'object') {
      continue;
    }

    // Liste les methodes propres du prototype (pas de DI, pas d'instanciation
    // du constructeur). Les methodes heritees de Object ne sont pas incluses.
    const methodes = Object.getOwnPropertyNames(prototype);
    for (const methodName of methodes) {
      if (methodName === 'constructor') {
        continue;
      }
      const handler = (prototype as Record<string, unknown>)[methodName];
      if (typeof handler !== 'function') {
        continue;
      }

      const estPublic =
        reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          handler,
          ControleClass,
        ]) === true;
      const permissions =
        reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
          handler,
          ControleClass,
        ]);

      if (!estPublic && !permissions?.length) {
        ecarts.push({
          controle: ControleClass.name,
          methode: methodName,
        });
      }
    }
  }

  return ecarts;
}

describe('Matrice RBAC - parcours du routeur (L0-16)', () => {
  it('echoue si une route couverte par la matrice nest pas declaree (ST §5.2)', () => {
    const ecarts = methodesPubliquesSansPermission(
      CONTROLES_COUVERTS_PAR_MATRICE,
    );

    expect(ecarts, [
      `Methodes publiques des controles de la matrice RBAC sans @Permissions ni @Public :`,
      ...ecarts.map(
        (e) => `  - ${e.controle}#${e.methode}`,
      ),
      '',
      'Ajoutez @Permissions(...) ou @Public() sur ces methodes.',
    ].join('\n')).toEqual([]);
  });

  it('recense les controles hors matrice (suivi, non bloquant)', () => {
    expect(CONTROLES_HORS_MATRICE).toEqual([
      'projects',
      'tasks',
      'tags',
      'comments',
      'sprints',
      'activities',
    ]);
  });
});
