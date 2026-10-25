import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E du workflow par rôle (L5-16).
 * Les tests s'exécutent contre une instance locale du web app (Next.js)
 * et de l'API (NestJS). L'authentification se fait via les appels API
 * (cookie httpOnly `token`), puis le navigateur est utilisé pour naviguer
 * dans l'interface.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Le token d'authentification est transmis via un cookie httpOnly ;
    // Playwright l'envoie automatiquement si le domaine correspond.
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
