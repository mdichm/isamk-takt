// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'intercepteur ETag.

import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ETagInterceptor } from './etag.interceptor.js';

function createMockContext(
  method: string = 'GET',
  statusCode: number = HttpStatus.OK,
): ExecutionContext {
  const response = {
    statusCode,
    setHeader: vi.fn(),
  } as any;

  const request = {
    headers: {},
    method,
    originalUrl: '/api/v1/test',
  } as any;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('ETagInterceptor', () => {
  it('doit ajouter un ETag faible sur une réponse GET 200 avec corps JSON', () => {
    const interceptor = new ETagInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);
    const body = { id: 'item-1', name: 'Test' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    expect(ctx.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      'ETag',
      expect.stringMatching(/^W\/".+"$/),
    );
  });

  it('ne doit pas ajouter d\'ETag sur une réponse GET en erreur', () => {
    const interceptor = new ETagInterceptor();
    const ctx = createMockContext('GET', HttpStatus.NOT_FOUND);
    const body = { message: 'Not found' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    expect(ctx.switchToHttp().getResponse().setHeader).not.toHaveBeenCalled();
  });

  it('ne doit pas ajouter d\'ETag sur un corps vide (GET 200 sans body)', () => {
    const interceptor = new ETagInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(null) } as any,
    );

    result.subscribe();
    expect(ctx.switchToHttp().getResponse().setHeader).not.toHaveBeenCalled();
  });

  it('ne doit pas ajouter d\'ETag sur une requête non-GET', () => {
    const interceptor = new ETagInterceptor();
    const ctx = createMockContext('PATCH', HttpStatus.OK);
    const body = { id: 'item-1' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    expect(ctx.switchToHttp().getResponse().setHeader).not.toHaveBeenCalled();
  });

  it('ne doit pas ajouter d\'ETag quand le flux émet une erreur', () => {
    const interceptor = new ETagInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);

    const result = interceptor.intercept(
      ctx,
      { handle: () => throwError(() => new Error('boom')) } as any,
    );

    result.subscribe({
      error: () => {}, // erreur consommée, pas de propagation
    });
    expect(ctx.switchToHttp().getResponse().setHeader).not.toHaveBeenCalled();
  });
});
