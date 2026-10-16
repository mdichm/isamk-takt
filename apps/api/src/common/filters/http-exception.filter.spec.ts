// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du filtre d'erreur ProblemJson (L0-19)
import { describe, it, expect } from 'vitest';
import { handlePrismaError } from './http-exception.filter.js';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@takt/db';

vi.mock('@takt/db', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      public code: string;
      public meta?: Record<string, unknown>;
      public clientVersion: string;
      constructor(message: string, code: string, meta?: Record<string, unknown>) {
        super(message);
        this.code = code;
        this.meta = meta;
        this.clientVersion = 'test';
        this.name = 'PrismaClientKnownRequestError';
      }
      get [Symbol.toStringTag]() {
        return 'PrismaClientKnownRequestError';
      }
    },
    PrismaClientValidationError: class PrismaClientValidationError extends Error {
      public clientVersion: string;
      constructor(message: string) {
        super(message);
        this.clientVersion = 'test';
        this.name = 'PrismaClientValidationError';
      }
      get [Symbol.toStringTag]() {
        return 'PrismaClientValidationError';
      }
    },
  },
}));

function makePrismaKnownError(code: string, message: string, meta?: Record<string, unknown>): Prisma.PrismaClientKnownRequestError {
  return new (Prisma as unknown as { PrismaClientKnownRequestError: new (message: string, code: string, meta?: Record<string, unknown>) => Prisma.PrismaClientKnownRequestError }).PrismaClientKnownRequestError(message, code, meta);
}

describe('handlePrismaError (L0-19 - Erreurs RFC 9457)', () => {
  it('P2002 (23505 unicité) → 409 DUPLICATE_RESOURCE', () => {
    const result = handlePrismaError(makePrismaKnownError('P2002', 'Unique violation', { target: ['email'] }));
    expect(result.status).toBe(HttpStatus.CONFLICT);
    expect(result.code).toBe('DUPLICATE_RESOURCE');
    expect(result.detail).toContain('email');
  });

  it('P0001 IMMUTABLE_VERSION → 423 VERSION_IMMUTABLE', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'IMMUTABLE_VERSION'));
    expect(result.status).toBe(HttpStatus.LOCKED);
    expect(result.code).toBe('VERSION_IMMUTABLE');
    expect(result.detail).toBe('La version est immuable');
  });

  it('P0001 YEAR_CLOSED → 423 YEAR_CLOSED', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'YEAR_CLOSED'));
    expect(result.status).toBe(HttpStatus.LOCKED);
    expect(result.code).toBe('YEAR_CLOSED');
    expect(result.detail).toContain('clôturée');
  });

  it('P0001 APPEND_ONLY_TABLE → 423 APPEND_ONLY_TABLE', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'APPEND_ONLY_TABLE'));
    expect(result.status).toBe(HttpStatus.LOCKED);
    expect(result.code).toBe('APPEND_ONLY_TABLE');
  });

  it('P0001 CHARGE_RULESET_PUBLISHED → 423 CHARGE_RULESET_PUBLISHED', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'CHARGE_RULESET_PUBLISHED'));
    expect(result.status).toBe(HttpStatus.LOCKED);
    expect(result.code).toBe('CHARGE_RULESET_PUBLISHED');
  });

  it('P0001 CONFIG_IN_USE → 423 CONFIG_IN_USE', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'CONFIG_IN_USE'));
    expect(result.status).toBe(HttpStatus.LOCKED);
    expect(result.code).toBe('CONFIG_IN_USE');
  });

  it('P0001 inconnu → 400 avec code brut', () => {
    const result = handlePrismaError(makePrismaKnownError('P0001', 'UNKNOWN_P0001'));
    expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    expect(result.code).toBe('P0001');
  });

  it('P2025 (enregistrement non trouvé) → 404 NOT_FOUND', () => {
    const result = handlePrismaError(makePrismaKnownError('P2025', 'Record not found'));
    expect(result.status).toBe(HttpStatus.NOT_FOUND);
    expect(result.code).toBe('NOT_FOUND');
  });

  it('P2003 (clé étrangère) → 400 FOREIGN_KEY_VIOLATION', () => {
    const result = handlePrismaError(makePrismaKnownError('P2003', 'Foreign key violation'));
    expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
  });
});
