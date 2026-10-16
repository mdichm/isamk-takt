import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AuditService } from '../../src/audit/audit.service.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

// @takt/db est mocké car le PrismaClient nécessite DATABASE_URL au chargement du module.
// Le vrai client est instancié dans beforeAll avec l'adapter pg et passé à AuditService.
vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return {
    PrismaClient: PrismaClientMock,
    Prisma: {
      JsonNull: {},
    },
  };
});

// Import the generated PrismaClient dynamically to avoid typecheck issues
const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/node_modules/.prisma/client/index.js'
);

describe('AuditService Integration (EX-AUD-01, ST §2.4, §0.5)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;
  let userId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('takt_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    const migrationsDir = path.resolve(__dirname, '../../../packages/db/prisma/migrations');
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort((a, b) => a.localeCompare(b));

    for (const migration of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        execSync(`psql "${databaseUrl}" -f "${migrationPath}"`, { stdio: 'inherit' });
      }
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new GeneratedPrismaClient({ adapter });
    await prisma.$connect();
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // audit_logs and security_events are append-only (triggers prevent DELETE)
    // Clean only mutable tables
    await prisma.userSystemRole.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'audit.integration@example.com',
        passwordHash: 'hash',
        firstName: 'Audit',
        lastName: 'Integration',
      },
    });
    userId = user.id;
  });

  it('should write an audit entry with old and new values via writeAudit', async () => {
    const service = new AuditService(prisma as unknown as PrismaService);

    const audit = await service.writeAudit(prisma as unknown as PrismaService, {
      userId,
      action: 'UPDATE',
      objetType: 'User',
      objetId: userId,
      ancienneValeur: { email: 'audit.integration@example.com' },
      nouvelleValeur: { email: 'audit.integration.modified@example.com' },
      motif: 'Mise à jour email',
    });

    expect(audit.id).toBeDefined();
    expect(audit.action).toBe('UPDATE');
    expect(audit.objetType).toBe('User');
    expect(audit.objetId).toBe(userId);
    expect(audit.userId).toBe(userId);
    expect(audit.ancienneValeur).toEqual({ email: 'audit.integration@example.com' });
    expect(audit.nouvelleValeur).toEqual({ email: 'audit.integration.modified@example.com' });
    expect(audit.motif).toBe('Mise à jour email');
    expect(audit.at).toBeInstanceOf(Date);
  });

  it('should persist business operation and audit together on success (atomicity)', async () => {
    const service = new AuditService(prisma as unknown as PrismaService);

    const result = await service.auditTransaction(
      async (tx) => {
        return tx.user.update({
          where: { id: userId },
          data: { firstName: 'Modified' },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'User',
        objetId: userId,
        ancienneValeur: { firstName: 'Audit' },
        nouvelleValeur: { firstName: 'Modified' },
        motif: 'Test atomicité succès',
      },
    );

    expect(result.firstName).toBe('Modified');

    const audits = await prisma.auditLog.findMany({
      where: { objetId: userId, action: 'UPDATE' },
    });
    expect(audits.length).toBeGreaterThan(0);
    const lastAudit = audits[audits.length - 1];
    expect(lastAudit.nouvelleValeur).toEqual({ firstName: 'Modified' });
    expect(lastAudit.motif).toBe('Test atomicité succès');
  });

  it('should rollback both business operation and audit when operation fails', async () => {
    const service = new AuditService(prisma as unknown as PrismaService);

    const beforeEmail = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await expect(
      service.auditTransaction(
        async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: { email: 'should.not.persist@example.com' },
          });
          await tx.auditLog.create({
            data: {
              userId,
              action: 'UPDATE',
              objetType: 'User',
              objetId: userId,
              nouvelleValeur: { email: 'should.not.persist@example.com' },
            },
          });
          throw new Error('Business failure');
        },
        {
          userId,
          action: 'UPDATE',
          objetType: 'User',
          objetId: userId,
          ancienneValeur: { email: beforeEmail?.email },
          nouvelleValeur: { email: 'should.not.persist@example.com' },
          motif: 'Test rollback',
        },
      ),
    ).rejects.toThrow('Business failure');

    const userAfter = await prisma.user.findUnique({ where: { id: userId } });
    expect(userAfter?.email).toBe(beforeEmail?.email);

    const rollbackAudits = await prisma.auditLog.findMany({
      where: { motif: 'Test rollback' },
    });
    expect(rollbackAudits).toHaveLength(0);
  });
});
