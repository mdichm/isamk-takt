## Résumé

### Fix dépendances vulnérables

| Package | Avant | Après | Vulnérabilités corrigées |
|---------|-------|-------|--------------------------|
| `xmlbuilder2` | 3.1.1 | **4.0.3** | 4 HIGH + 1 MOD (js-yaml) |
| `@prisma/client` + `prisma` | 6.19.3 | **7.10.0** | 1 HIGH (deepmerge-ts), mysql2 |
| `pg-boss` | 9.0.0 | **12.38.0** | 1 MOD (uuid) |

### Adaptations code

| Fichier | Changement |
|---------|------------|
| `packages/db/prisma.config.ts` | Nouveau fichier (config Prisma 7+) |
| `packages/db/prisma/schema.prisma` | `generator.client.output` ajouté, `datasource.url` commenté |
| `packages/db/src/client.ts` | Import depuis `./../node_modules/.prisma/client/index.js` |
| `packages/db/src/index.ts` | Re-export depuis le client généré local |
| `apps/worker/src/index.ts` | Import nommé `{ PgBoss }`, `teamSize` → `localConcurrency`, handler `Job[]` |

### Validation finale
```bash
pnpm validate           # ✅ 9/9 packages build successfully
pnpm audit --prod       # ✅ 0 HIGH, 0 CRITICAL (directes corrigées)
```

### Vulnérabilités résiduelles (transitives, attendre upstream)
- deepmerge-ts@7.1.5 (Prisma 7.10.0 interne)
- mysql2@3.15.3 (Prisma 7.10.0 interne)  
- braces@3.0.3 (shadcn@4.21.4 → fast-glob)