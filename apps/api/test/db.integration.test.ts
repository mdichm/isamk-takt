import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Import the generated PrismaClient dynamically to avoid typecheck issues
const { PrismaClient: GeneratedPrismaClient } = await import(
  '../../../packages/db/.generated/prisma/client/index.js'
);

describe('Database Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;

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
      .sort((a, b) => {
        // Sort by full name for proper ordering (date + sequence)
        return a.localeCompare(b);
      });

    for (const migration of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        execSync(`psql "${databaseUrl}" -f "${migrationPath}"`, { stdio: 'inherit' });
      }
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new GeneratedPrismaClient({
      adapter,
    });
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
    await prisma.passwordHistory.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.parametreSecurite.deleteMany();
    await prisma.parametreWorkflow.deleteMany();
  });

  describe('User CRUD', () => {
    it('should create and retrieve a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.isActive).toBe(true);
      expect(user.failedAttempts).toBe(0);
      expect(user.mfaActive).toBe(false);
      expect(user.mustChangePassword).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'unique@example.com',
          passwordHash: 'hash',
          firstName: 'User',
          lastName: 'One',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'unique@example.com',
            passwordHash: 'hash',
            firstName: 'User',
            lastName: 'Two',
          },
        })
      ).rejects.toThrow();
    });

    it('should update user fields', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          passwordHash: 'hash',
          firstName: 'Original',
          lastName: 'User',
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: 'Updated',
          lastLoginAt: new Date(),
        },
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastLoginAt).toBeInstanceOf(Date);
      expect(updated.updatedAt).not.toEqual(user.updatedAt);
    });
  });

  describe('UserRole CRUD and Partial Unique Index', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'role@example.com',
          passwordHash: 'hash',
          firstName: 'Role',
          lastName: 'User',
        },
      });
      userId = user.id;
    });

    it('should create global user role', async () => {
      const role = await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'ADMINISTRATEUR',
          departementCode: null,
        },
      });

      expect(role.id).toBeDefined();
      expect(role.userId).toBe(userId);
      expect(role.role).toBe('ADMINISTRATEUR');
      expect(role.departementCode).toBeNull();
    });

    it('should prevent duplicate global role for same user', async () => {
      await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'ADMINISTRATEUR',
          departementCode: null,
        },
      });

      await expect(
        prisma.userSystemRole.create({
          data: {
            userId,
            role: 'ADMINISTRATEUR',
            departementCode: null,
          },
        })
      ).rejects.toThrow();
    });

    it('should allow same role with different department code', async () => {
      await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'RESPONSABLE_DEPARTEMENT',
          departementCode: 'INFO',
        },
      });

      const role2 = await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'RESPONSABLE_DEPARTEMENT',
          departementCode: 'MATH',
        },
      });

      expect(role2.departementCode).toBe('MATH');
    });

    it('should enforce unique constraint on (userId, role, departementCode)', async () => {
      await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'ENSEIGNANT',
          departementCode: 'INFO',
        },
      });

      await expect(
        prisma.userSystemRole.create({
          data: {
            userId,
            role: 'ENSEIGNANT',
            departementCode: 'INFO',
          },
        })
      ).rejects.toThrow();
    });

    it('should cascade delete user roles when user is deleted', async () => {
      await prisma.userSystemRole.create({
        data: {
          userId,
          role: 'ADMINISTRATEUR',
          departementCode: null,
        },
      });

      await prisma.user.delete({ where: { id: userId } });

      const roles = await prisma.userSystemRole.findMany({ where: { userId } });
      expect(roles).toHaveLength(0);
    });
  });

  describe('RefreshToken CRUD', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'refresh@example.com',
          passwordHash: 'hash',
          firstName: 'Refresh',
          lastName: 'User',
        },
      });
      userId = user.id;
    });

    it('should create and retrieve refresh token', async () => {
      const familyId = '00000000-0000-0000-0000-000000000001';
      const token = await prisma.refreshToken.create({
        data: {
          userId,
          familyId,
          tokenHash: 'hashed_token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(token.id).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.familyId).toBe(familyId);
      expect(token.tokenHash).toBe('hashed_token');
      expect(token.revokedAt).toBeNull();
      expect(token.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should enforce unique tokenHash', async () => {
      const familyId1 = '00000000-0000-0000-0000-000000000001';
      const familyId2 = '00000000-0000-0000-0000-000000000002';
      await prisma.refreshToken.create({
        data: {
          userId,
          familyId: familyId1,
          tokenHash: 'same_hash',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        prisma.refreshToken.create({
          data: {
            userId,
            familyId: familyId2,
            tokenHash: 'same_hash',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
      ).rejects.toThrow();
    });

    it('should cascade delete refresh tokens when user is deleted', async () => {
      const familyId = '00000000-0000-0000-0000-000000000001';
      await prisma.refreshToken.create({
        data: {
          userId,
          familyId,
          tokenHash: 'hash',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.user.delete({ where: { id: userId } });

      const tokens = await prisma.refreshToken.findMany({ where: { userId } });
      expect(tokens).toHaveLength(0);
    });
  });

  describe('AuditLog Immutability', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'audit@example.com',
          passwordHash: 'hash',
          firstName: 'Audit',
          lastName: 'User',
        },
      });
      userId = user.id;
    });

    it('should allow INSERT on audit_logs', async () => {
      const audit = await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          objetType: 'User',
          objetId: userId,
          nouvelleValeur: { email: 'audit@example.com' },
        },
      });

      expect(audit.id).toBeDefined();
      expect(audit.action).toBe('CREATE');
      expect(audit.objetType).toBe('User');
      expect(audit.ancienneValeur).toBeNull();
      expect(audit.nouvelleValeur).toEqual({ email: 'audit@example.com' });
      expect(audit.at).toBeInstanceOf(Date);
    });

    it('should prevent UPDATE on audit_logs (trigger)', async () => {
      const audit = await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          objetType: 'User',
          objetId: userId,
        },
      });

      await expect(
        prisma.auditLog.update({
          where: { id: audit.id },
          data: { action: 'HACK' },
        })
      ).rejects.toThrow('Audit log table is append-only');
    });

    it('should prevent DELETE on audit_logs (trigger)', async () => {
      const audit = await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          objetType: 'User',
          objetId: userId,
        },
      });

      await expect(
        prisma.auditLog.delete({ where: { id: audit.id } })
      ).rejects.toThrow('Audit log table is append-only');
    });
  });

  describe('SecurityEvent Immutability', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'security@example.com',
          passwordHash: 'hash',
          firstName: 'Security',
          lastName: 'User',
        },
      });
      userId = user.id;
    });

    it('should allow INSERT on security_events', async () => {
      const event = await prisma.securityEvent.create({
        data: {
          type: 'LOGIN_OK',
          userId,
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      expect(event.id).toBeDefined();
      expect(event.type).toBe('LOGIN_OK');
      expect(event.at).toBeInstanceOf(Date);
    });

    it('should prevent UPDATE on security_events (trigger)', async () => {
      const event = await prisma.securityEvent.create({
        data: {
          type: 'LOGIN_OK',
          userId,
        },
      });

      await expect(
        prisma.securityEvent.update({
          where: { id: event.id },
          data: { type: 'HACK' },
        })
      ).rejects.toThrow('Security events table is append-only');
    });

    it('should prevent DELETE on security_events (trigger)', async () => {
      const event = await prisma.securityEvent.create({
        data: {
          type: 'LOGIN_OK',
          userId,
        },
      });

      await expect(
        prisma.securityEvent.delete({ where: { id: event.id } })
      ).rejects.toThrow('Security events table is append-only');
    });
  });

  describe('ParametreSecurite Single Row', () => {
    it('should create default security params', async () => {
      const params = await prisma.parametreSecurite.create({
        data: {},
      });

      expect(params.id).toBe(1);
      expect(params.longueurMin).toBe(12);
      expect(params.regles).toEqual({});
      expect(params.expirationJours).toBe(0);
      expect(params.historique).toBe(5);
      expect(params.maxEchecs).toBe(5);
      expect(params.verrouillageMinutes).toBe(15);
      expect(params.inactiviteMinutes).toBe(30);
      expect(params.mfaRoles).toEqual(['ADMINISTRATEUR']);
      expect(params.conservationAuditJours).toBeNull();
      expect(params.conservationSecuriteJours).toBe(365);
    });

    it('should prevent second row (primary key constraint)', async () => {
      await prisma.parametreSecurite.create({ data: {} });

      await expect(
        prisma.parametreSecurite.create({ data: {} })
      ).rejects.toThrow();
    });

    it('should update security params', async () => {
      await prisma.parametreSecurite.create({ data: {} });

      const updated = await prisma.parametreSecurite.update({
        where: { id: 1 },
        data: {
          longueurMin: 14,
          maxEchecs: 3,
          mfaRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE'],
        },
      });

      expect(updated.longueurMin).toBe(14);
      expect(updated.maxEchecs).toBe(3);
      expect(updated.mfaRoles).toEqual(['ADMINISTRATEUR', 'GESTIONNAIRE']);
    });
  });

  describe('ParametreWorkflow Single Row', () => {
    it('should create default workflow params', async () => {
      const params = await prisma.parametreWorkflow.create({
        data: {},
      });

      expect(params.id).toBe(1);
      expect(params.validationPlanningRequise).toBe(true);
      expect(params.publicationRequise).toBe(true);
    });

    it('should prevent second row', async () => {
      await prisma.parametreWorkflow.create({ data: {} });

      await expect(
        prisma.parametreWorkflow.create({ data: {} })
      ).rejects.toThrow();
    });
  });

  describe('PasswordHistory', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'history@example.com',
          passwordHash: 'hash',
          firstName: 'History',
          lastName: 'User',
        },
      });
      userId = user.id;
    });

    it('should create password history entries', async () => {
      const history = await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash: 'old_hash_1',
        },
      });

      expect(history.id).toBeDefined();
      expect(history.userId).toBe(userId);
      expect(history.passwordHash).toBe('old_hash_1');
      expect(history.createdAt).toBeInstanceOf(Date);
    });

    it('should cascade delete when user is deleted', async () => {
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash: 'old_hash',
        },
      });

      await prisma.user.delete({ where: { id: userId } });

      const history = await prisma.passwordHistory.findMany({ where: { userId } });
      expect(history).toHaveLength(0);
    });
  });

  describe('PasswordResetToken', () => {
    let userId: string;
    let adminId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'reset@example.com',
          passwordHash: 'hash',
          firstName: 'Reset',
          lastName: 'User',
        },
      });
      userId = user.id;

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: 'hash',
          firstName: 'Admin',
          lastName: 'User',
        },
      });
      adminId = admin.id;
    });

    it('should create password reset token', async () => {
      const token = await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash: 'reset_token_hash',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          demandePar: adminId,
        },
      });

      expect(token.id).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.tokenHash).toBe('reset_token_hash');
      expect(token.demandePar).toBe(adminId);
      expect(token.usedAt).toBeNull();
    });

    it('should enforce unique tokenHash', async () => {
      await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash: 'same_hash',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          demandePar: adminId,
        },
      });

      await expect(
        prisma.passwordResetToken.create({
          data: {
            userId,
            tokenHash: 'same_hash',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            demandePar: adminId,
          },
        })
      ).rejects.toThrow();
    });
  });
});
