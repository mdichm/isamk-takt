// SPDX-License-Identifier: AGPL-3.0-only
// TAKT Worker - pg-boss job processor avec instrumentation OpenTelemetry
// Conforme ST §5.4 : traces OpenTelemetry (API → base → worker)

import 'dotenv/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
// Load .env from project root (works regardless of working directory)
// From apps/worker/src -> ../../../.env = project root
import { config } from 'dotenv';
const envPath = resolve(__dirname, '../../../.env');
console.log('[Worker] Loading .env from:', envPath);
console.log('[Worker] __dirname:', __dirname);
console.log('[Worker] cwd:', process.cwd());
config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('[Worker] DATABASE_URL is not set. envPath:', envPath);
  console.error('[Worker] process.env.DATABASE_URL:', process.env.DATABASE_URL);
  throw new Error('DATABASE_URL is not set. Please check .env file.');
}
console.log('[Worker] DATABASE_URL loaded successfully');

import { PgBoss } from 'pg-boss';
import { prisma } from '@takt/db';
import type { Job } from 'pg-boss';
import {
  trace,
  context,
  propagation,
  SpanStatusCode,
} from '@opentelemetry/api';
import {
  NodeSDK,
} from '@opentelemetry/sdk-node';
import {
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node';
import {
  OTLPTraceExporter,
} from '@opentelemetry/exporter-trace-otlp-grpc';
import { handleGenerationJob } from './jobs/generation.job.js';
import { handleGenerationImportManuelJob } from './jobs/generation-import-manuel.job.js';
import { startOrphanRecoveryScan } from './services/orphan-recovery.service.js';

// ---------------------------------------------------------------------------
// Initialisation OpenTelemetry (traces uniquement)
// ---------------------------------------------------------------------------
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? 'http://tempo:4317',
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: false,
      },
    }),
  ],
});

void Promise.resolve(sdk.start()).catch((err: Error) => {
  console.error('Erreur initialisation OpenTelemetry worker:', err);
});

process.on('SIGTERM', async () => {
  await sdk.shutdown();
  context.disable();
});

// ---------------------------------------------------------------------------

const boss = new PgBoss(process.env.DATABASE_URL || '');

// Fonctions d'arrêt pour les services de fond
let stopOrphanScan: (() => void) | undefined;

async function start() {
  await boss.start();
  console.log('Worker started, listening for jobs...');

  // Créer les files si elles n'existent pas
  await ensureQueuesExist();

  // Démarrage du scan des jobs orphelins (reprise idempotente)
  stopOrphanScan = startOrphanRecoveryScan();

  // Generation queue — consommateur idempotent avec claim et guard par semestre
  await boss.work('generation', { localConcurrency: 1 }, async (jobs: Job[]) => {
    for (const job of jobs) {
      await handleGenerationJob(job);
    }
  });

  // Generation import manuel queue — import de résultat FET manuel
  await boss.work('generation-import-manuel', { localConcurrency: 1 }, async (jobs: Job[]) => {
    for (const job of jobs) {
      await handleGenerationImportManuelJob(job);
    }
  });

  // Export queue — désactivé pour l'instant (TODO: implémenter la logique d'export)
  // await boss.work('export', { localConcurrency: 2 }, async (jobs: Job[]) => {
  //   for (const job of jobs) {
  //     // Propager le contexte de trace depuis les headers du job (si envoyés par l'API)
  //     const parentCtx = propagation.extract(context.active(), {
  //       'traceparent': (job.data as Record<string, unknown> | undefined)?.traceparent as string | undefined,
  //       'tracestate': (job.data as Record<string, unknown> | undefined)?.tracestate as string | undefined,
  //     });
  //
  //     const tracer = trace.getTracer('takt-worker');
  //     const span = tracer.startSpan('worker.job.export', {
  //       attributes: {
  //         'job.id': job.id,
  //         'job.queue': 'export',
  //       },
  //     }, parentCtx);
  //
  //     try {
  //       console.log(`Processing export job: ${job.id}`);
  //       // TODO: Implement export logic
  //
  //       span.setStatus({ code: SpanStatusCode.OK });
  //     } catch (err) {
  //       span.setStatus({
  //         code: SpanStatusCode.ERROR,
  //         message: err instanceof Error ? err.message : 'Unknown error',
  //       });
  //       throw err;
  //     } finally {
  //       span.end();
  //     }
  //   }
  // });

  // La file e-mail est consommée par l'API (ST §4.16), qui est le seul
  // point de sortie SMTP autorisé. Le worker reste dédié aux traitements
  // génération/import/export.

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, stopping worker...');
    if (stopOrphanScan) stopOrphanScan();
    await boss.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
}

// S'assurer que les files pg-boss existent avant de les écouter
async function ensureQueuesExist() {
  const queues = [
    'generation',
    'generation-import-manuel',
    'export',
  ];

  for (const queue of queues) {
    try {
      await boss.createQueue(queue);
      console.log(`[Worker] Queue '${queue}' ready`);
    } catch (err) {
      // Ignore error if queue already exists
      if (err instanceof Error && !err.message.includes('already exists')) {
        console.warn(`[Worker] Could not create queue '${queue}':`, err.message);
      }
    }
  }
}

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
