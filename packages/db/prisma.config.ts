import { defineConfig } from 'prisma/config';

// Prisma 7+ configuration
export default defineConfig({
  // Schema file location
  schema: './prisma/schema.prisma',
  
  // Output directory for generated client (resolved via @prisma/client import)
  client: {
    output: '../src/generated/prisma/client',
  },
  
  // Database connection for migrations
  datasource: {
    url: 'postgresql://postgres:postgres@localhost:5432/takt_dev?schema=public',
  },
});