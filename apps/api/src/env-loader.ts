// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Environment loader - must be imported FIRST before any other modules

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Try multiple possible locations for .env
const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const possiblePaths = [
  resolve(__dirname, '../../.env'),      // apps/api/src -> project root
  resolve(__dirname, '../../../.env'),   // apps/api/dist/src -> project root (compiled)
  resolve(process.cwd(), '.env'),        // current working directory
];

let loaded = false;
for (const envPath of possiblePaths) {
  try {
    config({ path: envPath });
    if (process.env.DATABASE_URL) {
      console.log(`[API] Loaded .env from: ${envPath}`);
      loaded = true;
      break;
    }
  } catch {
    // ignore
  }
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('[API] DATABASE_URL is not set. Tried paths:', possiblePaths);
  console.error('[API] Current working directory:', process.cwd());
  console.error('[API] __dirname:', __dirname);
  process.exit(1);
}
console.log('[API] DATABASE_URL loaded successfully');