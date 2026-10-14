import { defineConfig } from 'prisma/config';

// Prisma 7+ configuration
export default defineConfig({
  // Schema file location
  schema: './prisma/schema.prisma',
  
  // Output directory for generated client
  client: {
    output: '../node_modules/.prisma/client',
  },
  
  // Database connection for migrations
  datasourceUrl: 'postgresql://postgres:postgres@localhost:5432/takt_dev?schema=public',
});