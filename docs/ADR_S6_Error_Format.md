# ADR S6 – Format d'erreur API (RFC 9457)

## Contexte
L'API TAKT doit retourner des erreurs structurées, cohérentes et exploitables par les clients (front, scripts, outils de monitoring). Le format doit être standard, extensible et inclure un identifiant de requête pour la traçabilité.

## Décision
- Adopter **RFC 9457** – *Problem Details for HTTP APIs* (`application/problem+json`).
- Chaque réponse d'erreur contient :
  - `type` : URI stable `https://takt.example.fr/errors/{status}`.
  - `title` : libellé court du code HTTP.
  - `status` : code HTTP.
  - `detail` : message lisible.
  - `instance` : chemin de la requête.
  - `requestId` : UUID généré par middleware (corrélation logs).
  - `errors` (optionnel) : tableau d'erreurs de validation (champ, code, message).
- Implémentation via un **filtre global** `ProblemJsonFilter` (NestJS `@Catch()`) qui transforme toute `HttpException` ou erreur imprévue.
- Catalogue de codes métier (ex. `IMMUTABLE_VERSION`, `YEAR_CLOSED`, `CHARGE_RULESET_PUBLISHED`, `CONFIG_IN_USE`) mappés sur 409/423.
- Les erreurs de validation `class-validator` sont sérialisées dans `errors`.

## Conséquences
- Uniformité : tous les endpoints (y compris erreurs 500) respectent le même schéma.
- Interopérabilité : clients peuvent parser génériquement.
- Traçabilité : `requestId` présent dans logs, réponse et journal d'audit.
- Documentation OpenAPI générée automatiquement (schéma `ProblemDetails`).

## Références
- EX‑NFR‑05, ST §3.2 (Conventions d'API), §5.4 (Observabilité)
- Ticket L0‑34 (filtre), L0‑25 (catalogue codes)

## Statut
Accepté – filtre global en production, documentation OpenAPI à jour (2026‑10‑09).