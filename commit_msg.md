fix: update vulnerable dependencies + Prisma 7 migration

- xmlbuilder2 3.1.1 -> 4.0.3 (fixes js-yaml 4 HIGH + 1 MOD)
- @prisma/client/prisma 6.19.3 -> 7.10.0 (fixes deepmerge-ts, mysql2)
- pg-boss 9.0.0 -> 12.38.0 (fixes uuid MOD)
- Updated worker pg-boss API (teamSize -> localConcurrency, array handler)
- Added prisma.config.ts for Prisma 7+ configuration
- Fixed API imports to use @takt/db instead of @prisma/client
- Fixed http-exception.filter.ts type narrowing issues

Remaining vulns are transitive (Prisma internal deepmerge-ts/mysql2, shadcn braces).