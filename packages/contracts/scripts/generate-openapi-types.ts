#!/usr/bin/env tsx
/**
 * Génère les types TypeScript depuis l'OpenAPI de l'API
 * Usage: pnpm --filter @takt/contracts generate:openapi
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../..');
const OPENAPI_PATH = resolve(ROOT, 'apps/api/openapi.json');
const OUTPUT_PATH = resolve(__dirname, '../src/openapi/index.ts');

async function main() {
  console.log('🔍 Génération des types OpenAPI...');
  console.log(`   Source: ${OPENAPI_PATH}`);
  console.log(`   Sortie: ${OUTPUT_PATH}`);

  if (!existsSync(OPENAPI_PATH)) {
    console.error(`❌ Fichier OpenAPI introuvable: ${OPENAPI_PATH}`);
    console.error('   Lancez d\'abord le build de l\'API pour générer openapi.json');
    process.exit(1);
  }

  try {
    // Use openapi-typescript CLI via npx
    const result = spawnSync('npx', [
      'openapi-typescript',
      OPENAPI_PATH,
      '-o', OUTPUT_PATH,
      '--export-type'
    ], {
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      throw new Error(`openapi-typescript exited with code ${result.status}`);
    }
    
    console.log('✅ Types OpenAPI générés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la génération:');
    console.error(error);
    process.exit(1);
  }
}

main();