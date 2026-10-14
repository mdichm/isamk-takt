## Résumé

### L0-03 : Paquet contracts (Zod + types OpenAPI)

- Créé package `@takt/contracts` avec build `tsup` (ESM+CJS+types)
- Schémas Zod: common, enums (27 enums TAKT), auth, user
- Script `generate:openapi` utilisant `openapi-typescript` CLI
- Types OpenAPI générés depuis `apps/api/openapi.json`
- Dépendances workspace:* ajoutées à `@takt/api` et `@takt/web`
- Validation CI: build, typecheck, lint, generate:openapi passent

### Backlog
- L0-03: Terminé
- Vélocité régénérée

---

Closes: L0-03

/cc @team