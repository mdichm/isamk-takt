# ADR-S4 : Migration vers Prisma 8 (contrat PSL 8)

- **Statut** : Accepté.
- **Date** : 9 octobre 2026
- **Contexte** : Spike S4 de la spécification technique (§6.1). Le lot L1 (années, semestres, référentiel) et l'API NestJS en dépendent.
- **Documents liés** : `ST_TAKT.md` (§0.1, §2.4, §3.1, §6.1), `SF_TAKT.md` (Decision Log DL‑047), `prisma/contract.prisma`, `prisma.config.ts`, `packages/db/src/db.ts`.

## 1. Décision

1. Adopter **Prisma 8** (`@prisma/orm-postgres` 8.0.0‑rc.17) comme ORM PostgreSQL.
2. Le **contrat de données** unique est `prisma/contract.prisma` écrit en **PSL 8** (types `Uuid`, `Date`, `Decimal` en position de type, index partiels avec liste de colonnes, etc.).
3. Les artefacts sont émis par `prisma contract emit` vers `packages/db/src/generated/` (`contract.json`, `contract.d.ts`).
4. Le client ORM est instancié dans `@takt/db` (`packages/db/src/db.ts`) et expose les collections typées (`collections.AnneeUniversitaire`, …).
5. Les migrations sont gérées par le graphe de migrations Prisma 8 (`prisma migration plan`, `prisma db migrate`, refs). La migration initiale `20261009T2028_init` (358 ops) a été appliquée ; `prisma db verify` confirme que le marqueur de base correspond au contrat.
6. Les colonnes PSL `Date` sont mappées sur **`Temporal.PlainDate`** (pas `Date` JavaScript). L'API NestJS importe `temporal-spec` pour disposer des types `Temporal` au moment de la compilation.
7. Les invariants non supportés par Prisma 8 (index partiels avec expression, `CHECK` complexes, triggers) restent gérés via des migrations SQL brutes (`prisma migration plan --create-only`) et intégrées au graphe.

## 2. Conséquences

| Aspect | Impact |
|--------|--------|
| **Modèle de données** | Un seul fichier source `contract.prisma` ; plus de `schema.prisma` Prisma 7. |
| **Migrations** | Graphe de migrations versionné, refs (`db`, `staging`, `production`). Pas de `prisma migrate dev` interactif en CI ; utilisation de `db migrate` sur la base marquée. |
| **Client API** | `@takt/db` exporte `db`, `collections`, `Contract`. Les services (ex. `AnneesService`) manipulent des `Temporal.PlainDate`. |
| **Types** | Dépendance `temporal-spec` ajoutée en `devDependencies` de `apps/api` (et du monorepo). `tsconfig.json` inclut `"temporal-spec"` dans `compilerOptions.types`. |
| **Tests / CI** | `pnpm build` et `pnpm typecheck` passent sur l'ensemble du monorepo (9 packages). |
| **Documentation** | ST §0.1, §2.4, §3.1, §6.1 mis à jour ; Decision Log DL‑047 ajouté. |

## 3. Procédure de mise à jour future

1. Modifier `prisma/contract.prisma`.
2. `pnpm prisma contract emit`.
3. `pnpm prisma migration plan --name <slug>` (répondre aux questions de perte de données si nécessaire).
4. Revoir le fichier `migration.ts` généré, compléter les `placeholder(...)` le cas échéant, puis `node migrations/app/<dir>/migration.ts` (self‑emit).
5. `pnpm prisma db migrate --db $DATABASE_URL` (applique et met à jour le marqueur).
6. `pnpm prisma migration ref set db <new‑hash>` pour avancer le ref `db`.
7. Lancer `pnpm build` / `pnpm typecheck` pour valider la compilation.

## 4. Alternatives envisagées

- Rester sur Prisma 7 (`schema.prisma` + `@prisma/client`) : écarté car le CLI épinglé était déjà Prisma 8 rc et le modèle PSL 8 apporte les types `Uuid`, `Date`, `Decimal` natifs ainsi que le système de migrations graph‑based.
- Utiliser un autre ORM (Kysely, Drizzle) : écarté pour conserver l'investissement Prisma et la génération de client typé.

## 5. Validation

- `prisma db verify` → *Database marker and schema match contract*.
- `pnpm build` (racine) → 9 packages built sans erreur.
- `pnpm typecheck` → 0 erreurs.
- L'API `annees` compile et utilise `Temporal.PlainDate` correctement.

---  
*Fin de l'ADR‑S4.*