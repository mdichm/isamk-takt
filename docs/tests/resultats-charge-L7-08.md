# Résultats des tests de charge — Ticket L7-08

## Contexte

Tests de charge k6 : 10 éditeurs simultanés sur 4 000 séances, génération parallèle refusée (409).

## Objectifs p95 (ST §5.4)

| Opération | Objectif p95 | Mesuré | Statut |
|-----------|-------------|--------|--------|
| `PATCH /seances/{id}/placement` | < 200 ms | — | À exécuter |
| Chargement grille (`GET /versions/{id}/seances`) | < 500 ms | — | À exécuter |
| `GET /tableau-de-bord` | < 500 ms | — | À exécuter |
| `GET /seances/{id}/suggestions` | < 1 s | — | À exécuter |
| `GET /charges?departementId=` | < 500 ms | — | À exécuter |
| Export PDF 100 pages (`POST /exports` + download) | < 60 s | — | À exécuter |
| Génération parallèle (2ème appel) | 409 `GENERATION_ALREADY_RUNNING` | — | À exécuter |

## Scénarios k6

Tous les scénarios se trouvent dans `tests/load/k6/scenarios/` et s'exécutent indépendamment :

| Fichier | Endpoint testé | VUs | Objectif p95 |
|---------|---------------|-----|-------------|
| `placement.js` | `PATCH /seances/{id}/placement` | 10 | < 200 ms |
| `grille.js` | `GET /versions/{id}/seances` | 10 | < 500 ms |
| `tableau-de-bord.js` | `GET /tableau-de-bord` | 10 | < 500 ms |
| `suggestions.js` | `GET /seances/{id}/suggestions` | 10 | < 1 s |
| `charges-departement.js` | `GET /charges?departementId=` | 10 | < 500 ms |
| `generation-parallele.js` | `POST /versions/{id}/generations` ×2 | 1 | 409 attendu |
| `export-pdf.js` | `POST /exports` + `GET /exports/{id}/download` | 1 | < 60 s |

## Prérequis

1. Base de données PostgreSQL démarrée et migrée (`pnpm --filter @takt/api db:migrate`)
2. API démarrée sur `http://localhost:3000` (`pnpm --filter @takt/api dev`)
3. Données de charge seedées (`pnpm tsx tests/load/seed.ts`)
4. k6 installé (`brew install k6` ou `sudo apt-get install k6`)

## Procédure d'exécution

```bash
# 1. Générer le client Prisma
pnpm --filter @takt/api db:generate

# 2. Seed la base de données (4 000 séances, utilisateur gestionnaire)
pnpm tsx tests/load/seed.ts

# 3. Récupérer le token JWT
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"gestionnaire@takt.test","password":"TaktTest2026!"}' | \
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken))")

# 4. Exécuter chaque scénario
export TOKEN
k6 run tests/load/k6/scenarios/placement.js
k6 run tests/load/k6/scenarios/grille.js
k6 run tests/load/k6/scenarios/tableau-de-bord.js
k6 run tests/load/k6/scenarios/suggestions.js
k6 run tests/load/k6/scenarios/charges-departement.js
k6 run tests/load/k6/scenarios/generation-parallele.js
k6 run tests/load/k6/scenarios/export-pdf.js
```

## Critères d'acceptation (L7-08)

- [ ] Objectifs p95 de ST §5.4 mesurés et documentés pour chaque scénario
- [ ] Une seconde génération sur le même semestre est refusée avec 409 `GENERATION_ALREADY_RUNNING`
- [ ] Ce rapport est rempli avec les mesures réelles

## Notes

- Les tests k6 utilisent l'authentification JWT via le token passé en variable d'environnement `TOKEN`.
- La découverte des ressources (version, séances, département, sémestre, salles, créneaux) se fait automatiquement via les endpoints GET de l'API au démarrage de chaque scénario.
- Les résultats bruts sont écrits dans `tests/load/k6/results/summary.json`.
- Aucun job CI n'est ajouté pour l'instant (tests exécutés localement ou en environnement de recette).
