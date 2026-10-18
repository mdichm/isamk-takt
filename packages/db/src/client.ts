import { PrismaClient } from './generated/prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Initialisation paresseuse : le client n'est créé qu'à la première utilisation,
// évitant toute tentative de connexion au chargement du module (utile en tests).
let prismaInstance: PrismaClient | undefined;

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }
  return prismaInstance;
};

// Export rétrocompatible : `import { prisma }` fonctionne, le client est créé à la première accès.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    return getPrisma()[prop];
  },
});

if (process.env.NODE_ENV !== 'production') {
  // Ne pas stocker dans globalThis avant la première utilisation effective
  void globalForPrisma;
}

export default prisma;
