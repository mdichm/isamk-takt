// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'intercepteur d'idempotence.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';
import { IdempotencyStore } from '../services/idempotency.store.js';

function createMockContext(
  headers: Record<string, string>,
  statusCode: number = HttpStatus.OK,
): ExecutionContext {
  const response = {
    statusCode,
    getHeaderNames: () => [],
    getHeader: () => undefined,
    setHeader: vi.fn(),
    status: vi.fn(),
  } as any;

  const request = {
    headers,
    method: 'POST',
    originalUrl: '/api/v1/test',
  } as any;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('IdempotencyInterceptor', () => {
  beforeEach(() => {
    IdempotencyStore.clearForTest();
    vi.restoreAllMocks();
  });

  it('doit passer à travers si aucun en-tête Idempotency-Key', () => {
    const interceptor = new IdempotencyInterceptor();
    const ctx = createMockContext({});
    const next = {
      handle: () => of({ ok: true }),
    } as any;

    const result = interceptor.intercept(ctx, next);
    expect(result).toBeDefined();
    // Souscrire pour exécuter les opérateurs RxJS (tap)
    result.subscribe();
    expect(IdempotencyStore.size()).toBe(0);
  });

  it('doit capturer et mettre en cache la réponse du premier appel', () => {
    const interceptor = new IdempotencyInterceptor();
    const response = {
      statusCode: HttpStatus.CREATED,
      getHeaderNames: () => ['content-type'],
      getHeader: () => 'application/json',
      setHeader: vi.fn(),
      status: vi.fn(),
    } as any;

    const request = {
      headers: { 'idempotency-key': 'idem-1' },
      method: 'POST',
      originalUrl: '/api/v1/test',
    } as any;

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const body = { id: 'created-1' };
    const next = {
      handle: () => of(body),
    } as any;

    const result = interceptor.intercept(ctx, next);
    expect(result).toBeDefined();
    result.subscribe();
    expect(IdempotencyStore.size()).toBe(1);

    const entry = IdempotencyStore.get('idem-1:POST:/api/v1/test');
    expect(entry).toBeDefined();
    expect(entry?.statusCode).toBe(HttpStatus.CREATED);
    expect(entry?.body).toEqual(body);
  });

  it('doit utiliser des clés distinctes pour des endpoints différents', () => {
    const interceptor = new IdempotencyInterceptor();
    const response = {
      statusCode: HttpStatus.OK,
      getHeaderNames: () => [],
      getHeader: () => undefined,
      setHeader: vi.fn(),
      status: vi.fn(),
    } as any;

    const baseRequest = {
      headers: { 'idempotency-key': 'idem-shared' },
      method: 'POST',
    } as any;

    const ctx1 = {
      switchToHttp: () => ({
        getRequest: () => ({ ...baseRequest, originalUrl: '/api/v1/a' }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const ctx2 = {
      switchToHttp: () => ({
        getRequest: () => ({ ...baseRequest, originalUrl: '/api/v1/b' }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of({ ok: true }),
    } as any;

    interceptor.intercept(ctx1, next).subscribe();
    interceptor.intercept(ctx2, next).subscribe();

    expect(IdempotencyStore.size()).toBe(2);
    expect(IdempotencyStore.get('idem-shared:POST:/api/v1/a')).toBeDefined();
    expect(IdempotencyStore.get('idem-shared:POST:/api/v1/b')).toBeDefined();
  });
});
