// TAKT Worker - pg-boss job processor with FET integration
import PgBoss from 'pg-boss';
import { prisma } from '@takt/db';
import type { Job } from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL || '');

async function start() {
  await boss.start();
  console.log('Worker started, listening for jobs...');

  // Generation queue
  await boss.work('generation', { teamSize: 1 }, async (job: Job) => {
    console.log(`Processing generation job: ${job.id}`);
    // TODO: Implement FET generation logic
    // 1. Fetch generation data from DB
    // 2. Build FET XML using @takt/engine-fet
    // 3. Run FET binary (fet-cl)
    // 4. Parse results and store back to DB
  });

  // Export queue
  await boss.work('export', { teamSize: 2 }, async (job: Job) => {
    console.log(`Processing export job: ${job.id}`);
    // TODO: Implement export logic
  });

  // Email queue
  await boss.work('email', { teamSize: 5 }, async (job: Job) => {
    console.log(`Processing email job: ${job.id}`);
    // TODO: Implement email sending logic
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, stopping worker...');
    await boss.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
