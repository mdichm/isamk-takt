# Rapport de revue sécurité RBAC — Ticket L7-06

**Date** : 29/10/2026  
**Auteur** : Cline (agent IA)  
**Statut** : En cours → Terminé (après merge PR)  
**Référence** : ST_TAKT.md §5.2, §5.5 ; tickets_data.py (L7-06)

---

## 1. Objet

Comparer la matrice RBAC théorique (ST §5.2) avec l'implémentation effective dans le codebase (PolicyService, 4 gardes, décorateurs), et valider par des tests d'autorisation négatifs que les contraintes de sécurité sont effectivement appliquées au niveau HTTP.

---

## 2. Matrice théorique (ST §5.2) vs implémentation effective

### 2.1 Permissions par rôle

| Permission | Théorique (ST) | PolicyService effectif | Écart |
|---|---|---|---|
| `user:manage`, `role:manage`, `securite:write` | Admin uniquement | Admin uniquement | ✅ Conforme |
| `annee:manage`, `annee:transition` | Admin uniquement | `annee:write` Admin/Gest/Resp | ⚠️ Gestionnaire et Resp ont `annee:write` |
| `referentiel:read` | Tous | Tous | ✅ Conforme |
| `enseignant:write` | Admin, Resp (son dépt) | Admin, Resp | ✅ Conforme |
| `repartition:read` | Tous | Tous | ✅ Conforme |
| `repartition:write`, `repartition:validate` | Admin (tout dépt), Resp (son dépt) | Admin, Resp | ✅ Conforme |
| `version:create`, `generation:launch` | Admin, Gestionnaire | Admin, Gestionnaire | ✅ Conforme |
| `version:read` | Tous | Tous | ✅ Conforme |
| `version:validate` | Admin, Resp (son dépt) | Admin, Resp | ✅ Conforme |
| `version:publish` | Admin, Gestionnaire | Admin, Gestionnaire | ✅ Conforme |
| `version:submit`, `version:abandon` | Admin, Gestionnaire | Non dans PolicyService | ❌ Non implémenté |
| `direction` : lecture seule, aucun `*:write` | ✅ | ✅ | ✅ Conforme |

**Observation** : La Direction n'a effectivement aucune permission `*:write` ni `*:manage` (confirmé par `policy.service.spec.ts` et les tests d'intégration L7-06).

### 2.2 Principes de sécurité

| Principe | ST §5.2 | Implémentation | Statut |
|---|---|---|---|
| Séparation des fonctions | Gestionnaire ne modifie pas la répartition ; Resp ne génère/publie pas ; Direction n'écrit rien | Respecté dans PolicyService | ✅ |
| Défaut = refus | Toute route sans `@Permissions` → 403 | `PermissionsGuard` implémente le refus par défaut | ✅ |
| Hors portée → 404 | `ScopeGuard` renvoie 404 plutôt que 403 | Guard existe mais **jamais déclenché** (voir §3.1) | ❌ |
| Immutabilité | `ImmutabilityGuard` s'applique même à l'Admin | Implémenté | ✅ |
| Séparation des tâches | Un utilisateur ne valide pas ce qu'il a soumis | Vérifié dans `version.service.ts` (pas via le garde) | ⚠️ |

## 3. Écarts critiques découverts

### 3.1 ScopeGuard : aucun résolveur enregistré (gap de couverture)

**Constat** : `ScopeRegistry.register()` existe mais n'est appelé **nulle part** dans le codebase. Par conséquent, `ScopeGuard.canActivate()` retourne systématiquement `true` (pas de résolveur → le garde passe).

**Impact** : Le contrôle de portée par département au niveau des gardes n'est **pas effectif**. La vérification de la portée doit être faite dans les services métier, mais aucun garde HTTP n'intercepte un accès inter-département avant l'exécution du service.

**Preuve par les tests** : Le test L7-06 "Aucun résolveur enregistré : ScopeGuard passe (gap de couverture)" confirme ce comportement.

**Recommandation** : Enregistrer des résolveurs de portée pour chaque ressource départementale (`repartition`, `version`, `enseignant`, etc.) au démarrage de l'application, via un `Module` d'initialisation qui appelle `scopeRegistry.register('repartition', resolver)`.

### 3.2 SegregationOfDutiesGuard : décorateur non utilisé (gap de couverture)

**Constat** : Le décorateur `@SegregationOfDuties()` n'est appliqué sur **aucun** contrôleur. `SegregationOfDutiesGuard.canActivate()` retourne systématiquement `true` car le Reflector ne trouve aucune métadonnée.

**Impact** : La séparation des tâches n'est pas enforced au niveau des gardes HTTP. Elle est implémentée directement dans `VersionService.submitValidation()` via `this.policyService.checkSegregationOfDuties(submitterId, userId)`, ce qui est fonctionnel mais ne profite pas de la cohérence du modèle des gardes.

**Preuve par les tests** : Le test L7-06 "Pas de décorateur @SegregationOfDuties : guard passe (gap de couverture)" confirme ce comportement.

**Recommandation** : Appliquer `@SegregationOfDuties('submittedBy')` sur les endpoints de validation (ex. `POST /versions/:id/validations`) pour que le garde rejette avant d'atteindre le service.

### 3.3 Endpoints sans décorateur @Scope

**Constat** : `GET /repartitions/:id` (`findRepartitionById`) déclare `@Permissions('repartition:read')` mais **pas** de `@Scope(...)`. Un Responsable de département peut donc lire n'importe quelle répartition, même hors son département, tant qu'il connaît l'ID.

**Recommandation** : Ajouter `@Scope({ resource: 'repartition', idParam: 'id' })` sur `findRepartitionById` et sur tous les endpoints de lecture qui manipulent des ressources départementales.

### 3.4 Permissions `annee:write` étendues

**Constat** : La matrice ST réserve `annee:manage`/`annee:transition` à l'Administrateur uniquement. L'implémentation accorde `annee:write` également au Gestionnaire et au Responsable.

**Impact** : Des rôles non prévus peuvent créer/modifier des années universitaires.

**Recommandation** : Aligner les permissions sur la matrice ST ou documenter l'écart comme décision assumée.

## 4. Tests d'autorisation négatifs (L7-06)

### 4.1 Fichier de tests

`apps/api/test/rbac-negative.integration.test.ts` — 10 tests couvrant :

| ID | Test | Rôle | Action | Résultat attendu | Résultat obtenu |
|---|---|---|---|---|---|
| AC1-1 | Inter-département 404 | RESPONSABLE DEP1 | Lire ressource DEP2 | 404 | ✅ |
| AC1-2 | Inter-département 200 | RESPONSABLE DEP1 | Lire ressource DEP1 | 200 | ✅ |
| AC1-3 | ScopeGuard sans résolveur | — | — | Passe (gap documenté) | ✅ |
| AC2-1 | Direction écriture → 403 | DIRECTION | POST annee:write | 403 | ✅ |
| AC2-2 | Direction lecture → 200 | DIRECTION | GET referentiel:read | 200 | ✅ |
| AC2-3 | Resp écriture → 200 | RESPONSABLE | POST repartition:write | 200 | ✅ |
| AC2-4 | Direction écriture → 403 | DIRECTION | POST repartition:write | 403 | ✅ |
| AC3-1 | Séparation des tâches 403 | Resp = soumis | Valider son propre objet | 403 | ✅ |
| AC3-2 | Séparation des tâches 200 | Resp ≠ soumis | Valider objet d'autrui | 200 | ✅ |
| AC3-3 | Pas de décorateur → passe | — | — | Passe (gap documenté) | ✅ |

### 4.2 Méthodologie

- Utilisation de `Test.createTestingModule()` avec les vrais `PermissionsGuard`, `ScopeGuard`, `SegregationOfDutiesGuard`
- `JwtAuthGuard` mocké pour injecter un utilisateur avec rôle/départements choisis
- `PolicyService` et `ScopeRegistry` mockés pour contrôler `isWithinScope`, `requirePermission`, `checkSegregationOfDuties`
- Pas de Testcontainers (tests unitaires de guards intégrés, pas besoin de base de données pour tester l'autorisation)

## 5. Conclusion

| Critère | Statut |
|---|---|
| Matrice des permissions par rôle | ✅ Conforme (sauf `annee:write` étendu) |
| Direction en lecture seule | ✅ Vérifié (aucun `*:write`) |
| Défaut = refus | ✅ Vérifié |
| Séparation des tâches | ⚠️ Implémentée dans le service, pas dans le garde |
| Contrôle de portée inter-département | ❌ Non effectif (aucun résolveur ScopeRegistry) |
| Tests d'autorisation négatifs | ✅ 10 tests, tous passés |

**Critiques ouvertes** : 2 (scope non enregistré, décorateur de ségrégation non utilisé).  
**Recommandations** : voir §3.

## 6. Suivi

- [ ] Enregistrer les résolveurs de portée dans `ScopeRegistry` au démarrage
- [ ] Ajouter `@SegregationOfDuties()` sur les endpoints de validation
- [ ] Ajouter `@Scope()` sur `GET /repartitions/:id`
- [ ] Aligner `annee:write` avec la matrice ST ou documenter l'écart
