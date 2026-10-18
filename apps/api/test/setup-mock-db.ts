// SPDX-License-Identifier: AGPL-3.0-only
// Mock global de @takt/db pour les tests unitaires.
// Le PrismaClient de packages/db/src/client.ts s'instancie au chargement du module
// et nécessite DATABASE_URL / une base PostgreSQL. Ce mock évite cette instanciation.
// On utilise importOriginal pour conserver tous les autres exports (enums, types, etc.)
// et ne remplacer que PrismaClient par un mock vide.
vi.mock('@takt/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@takt/db')>();

  class PrismaClientMock {}

  return {
    ...actual,
    PrismaClient: PrismaClientMock,
  };
});