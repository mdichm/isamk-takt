# Scénarios de recette — Stratégie de tests (ticket L7-14)

Ce document référence les **onze scénarios de recette** définis dans la **SF §23** (Critères d'acceptation et recette),
exprimés en Given / When / Then. Pour chaque scénario, il indique s'il est automatisé (test existant) ou documenté
(procédure manuelle), et le cas échéant le fichier de test qui le couvre.

Le jeu de données de recette associé se trouve dans `tests/data/fet/`.

---

## Scénario 1 — Blocage avant génération

**Given** une activité sans enseignant,
**When** le Gestionnaire ouvre la préparation,
**Then** l'activité est signalée bloquante avec un accès direct à la correction et FET ne peut pas être lancé.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à créer une activité sans enseignant, ouvrir la préparation et vérifier que l'interface affiche le blocage avec lien vers la correction, et que le lancement de FET est désactivé. |
| Liens | `docs/SF_TAKT.md` §23, `ST_TAKT.md` §4.6.1 |

---

## Scénario 2 — Génération échouée

**Given** une version de travail,
**When** FET retourne une erreur,
**Then** la génération est conservée en échec et la version de travail est intacte.

| Statut | Automatisé |
|--------|-----------|
| Couverture | Logique couverte par `apps/api/tests/integration/generation.failure.spec.ts` (worker + import, tickets L4-08/L4-09) et `docs/ADR_S1_FET.md` tests T4/T5 (SIGTERM, sigwrite). |
| Liens | `tests/load/` (k6 scénarios de charge), `docs/ADR_S1_FET.md` §7 |

---

## Scénario 3 — Modification manuelle

**Given** une proposition adoptée,
**When** le Gestionnaire déplace une séance,
**Then** les conflits sont recalculés immédiatement et la modification est historisée ; un déplacement créant un blocage est refusé.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à adopter une génération, déplacer une séance sur la grille, vérifier le recalcul immédiat des conflits et l'historisation, puis tenter un déplacement créant un blocage et vérifier le refus. |
| Liens | `ST_TAKT.md` §4.3 (ConflictEngine, recalcul incrémental) |

---

## Scénario 4 — Enseignant partagé

**Given** un enseignant intervenant dans deux départements dont les plannings sont validés,
**When** une de ses séances est modifiée dans une nouvelle version,
**Then** le second département est marqué à revalider ; si aucune de ses séances ni aucun enseignant partagé n'est touché, son approbation est reportée.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à configurer deux départements partageant un enseignant, valider les deux plannings, modifier une séance de l'enseignant dans un département, et vérifier que le second est marqué "à revalider". |
| Liens | `ST_TAKT.md` §4.13 (règle d'impact), `docs/SF_TAKT.md` RB-WF-06 |

---

## Scénario 5 — Génération groupée

**Given** des modifications de répartition en cours dans plusieurs départements,
**When** l'un d'eux termine,
**Then** aucune génération n'est lancée tant que toutes les répartitions requises ne sont pas validées.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à lancer des modifications dans deux départements, terminer l'un, et vérifier qu'aucune génération n'est déclenchée tant que l'autre n'est pas validé. |
| Liens | `ST_TAKT.md` §4.6.1 (pré-validation synchrone) |

---

## Scénario 6 — Publication

**Given** une version validée,
**When** le Gestionnaire publie,
**Then** les contrôles finaux passent, la version devient immuable, la précédente est archivée et la provenance est conservée.

| Statut | Automatisé (partiel) |
|--------|---------------------|
| Couverture | Le flux de publication est couvert par `apps/web/tests/e2e/workflow-e2e.spec.ts` (ticket L5-16). L'immuabilité et l'archivage de la version précédente sont vérifiés manuellement. |
| Liens | `apps/web/tests/e2e/workflow-e2e.spec.ts`, `ST_TAKT.md` §3.4.8 (adoption) |

---

## Scénario 7 — Modification d'une version publiée

**Given** une version V1 publiée,
**When** une modification est demandée,
**Then** V1 reste inchangée et une version de travail est créée.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à ouvrir une version publiée, demander une modification, et vérifier que V1 est inchangée et qu'une version de travail est créée. |
| Liens | `ST_TAKT.md` §4.13 (règle d'impact), `docs/SF_TAKT.md` RB-WF-06 |


---

## Scénario 8 — Import impactant

**Given** une donnée utilisée dans une répartition validée,
**When** l'aperçu d'import est calculé,
**Then** l'impact est présenté avant application et aucune validation n'est modifiée silencieusement.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à importer une donnée utilisée dans une répartition validée, consulter l'aperçu d'impact, et vérifier qu'aucune validation n'est modifiée sans confirmation explicite. |
| Liens | `ST_TAKT.md` §4.19 (import) |

---

## Scénario 9 — Clôture

**Given** une année active,
**When** l'Administrateur demande la clôture,
**Then** la confirmation par saisie du code est exigée et l'année devient définitivement en lecture seule.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à demander la clôture d'une année active, saisir le code de confirmation, et vérifier que l'année passe en lecture seule définitivement. |
| Liens | `ST_TAKT.md` §4.14 (clôture d'année) |

---

## Scénario 10 — Verrou incompatible

**Given** une séance verrouillée sur un créneau où son enseignant est indisponible,
**When** le Gestionnaire lance la génération,
**Then** le lancement est refusé avec la liste des séances en cause.

| Statut | Automatisé (partiel) |
|--------|---------------------|
| Couverture | Le contrôle pré-génération (verrous incompatibles) est couvert par `apps/api/tests/integration/generation.prevalidation.spec.ts` (ticket L4-14). Le refus avec liste des séances en cause est vérifié manuellement. |
| Liens | `ST_TAKT.md` §4.6.1 (pré-validation, 422 LOCK_INCOMPATIBLE) |

---

## Scénario 11 — Avertissement accepté

**Given** un avertissement de capacité recommandée,
**When** le Gestionnaire l'accepte,
**Then** l'acceptation est tracée et visible à la publication ; si la séance est déplacée, l'acceptation tombe.

| Statut | Documenté (procédure manuelle) |
|--------|-------------------------------|
| Couverture | Aucun test automatisé à ce jour. La procédure de recette consiste à générer avec un avertissement de capacité, l'accepter, vérifier la trace à la publication, puis déplacer la séance et vérifier que l'acceptation est réinitialisée. |
| Liens | `ST_TAKT.md` §4.3 (sévérités, avertissement), `docs/SF_TAKT.md` §23 |

---

## Récapitulatif

| # | Scénario | Statut |
|---|----------|--------|
| 1 | Blocage avant génération | Documenté |
| 2 | Génération échouée | Automatisé |
| 3 | Modification manuelle | Documenté |
| 4 | Enseignant partagé | Documenté |
| 5 | Génération groupée | Documenté |
| 6 | Publication | Automatisé (partiel) |
| 7 | Modification d'une version publiée | Documenté |
| 8 | Import impactant | Documenté |
| 9 | Clôture | Documenté |
| 10 | Verrou incompatible | Automatisé (partiel) |
| 11 | Avertissement accepté | Documenté |

**Critère d'acceptation 1 — satisfait** : les onze scénarios de la SF §23 sont soit automatisés, soit documentés ci-dessus.

