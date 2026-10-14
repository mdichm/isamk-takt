# @takt/contracts

Package partagé de schémas Zod et types TypeScript pour l'application TAKT.

## Contenu

- **Schémas Zod** (`src/zod/`) : Validation runtime + types TypeScript inférés
- **Types OpenAPI** (`src/openapi/`) : Types générés depuis `apps/api/openapi.json`

## Installation

```bash
pnpm add @takt/contracts
```

## Utilisation

### Dans l'API (NestJS)

```typescript
import { 
  loginRequestSchema,
  LoginRequest,
  userDtoSchema,
  UserDto 
} from '@takt/contracts';

// Validation avec ZodValidationPipe
@Post('login')
async login(@Body(ZodValidationPipe(loginRequestSchema)) dto: LoginRequest) {
  // dto est typé automatiquement
}
```

### Dans le Web (Next.js + React Query)

```typescript
import { 
  UserDto,
  PaginatedUsersResponse,
  paths 
} from '@takt/contracts';

// Types pour React Query
type UsersResponse = PaginatedUsersResponse;

// Types pour les chemins API
type LoginPath = paths['/auth/login']['post'];
```

## Structure

```
src/
├── index.ts           # Barrel export
├── zod/
│   ├── common.ts      # Primitives (UUID, email, pagination, RFC 9457...)
│   ├── enums.ts       # Tous les enums TAKT (alignés sur Prisma)
│   ├── auth.ts        # Auth: login, register, tokens, MFA, security params
│   ├── user.ts        # User: DTO, create/update inputs, queries
│   └── ...            # Autres domaines (département, formation, séance, etc.)
└── openapi/
    └── index.ts       # Types générés (NE PAS ÉDITER)
```

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm build` | Build ESM + CJS + types (`dist/`) |
| `pnpm dev` | Watch mode |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | Lint avec oxlint |
| `pnpm generate:openapi` | Régénère les types depuis `apps/api/openapi.json` |

## Régénération des types OpenAPI

```bash
# 1. Build l'API pour générer openapi.json
pnpm --filter api build

# 2. Régénère les types dans contracts
pnpm --filter @takt/contracts generate:openapi

# 3. Vérifie que tout compile
pnpm --filter @takt/contracts typecheck
```

## Conventions

- **Un fichier par domaine** dans `src/zod/`
- **Export barrel** via `src/index.ts`
- **Schémas nommés** `xxxSchema` + types `Xxx = z.infer<typeof xxxSchema>`
- **Messages d'erreur en français**
- **Enums alignés** sur le schéma Prisma (`packages/db/prisma/schema.prisma`)
- **Types OpenAPI** : ne jamais éditer `src/openapi/index.ts` à la main

## Dépendances

- `zod` v4 : validation runtime
- `openapi-typescript` : génération types (dev only)

## CI / Gate de cohérence

Le pipeline CI vérifie :
1. `contracts:build` + `contracts:typecheck`
2. `contracts:generate:openapi` + `contracts:typecheck` (valide types générés)
3. `api:build` + `api:typecheck` (doit importer @takt/contracts)
4. `web:typecheck` (doit importer types OpenAPI)
5. **Gate** : si `apps/api/openapi.json` a changé → `generate:openapi` obligatoire
