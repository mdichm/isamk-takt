// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'intercepteur d'en-tête Link (pagination curseur).

import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import type { ExecutionContext } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { LinkInterceptor } from './link.interceptor.js';

function createMockContext(
  method = 'GET',
  statusCode = HttpStatus.OK,
  originalUrl = '/api/v1/items?limit=10',
  query: Record<string, string> = { limit: '10' },
): ExecutionContext {
  const response = {
    statusCode,
    setHeader: vi.fn(),
  } as any;

  const request = {
    headers: { host: 'api.takt.example.fr' },
    method,
    originalUrl,
    protocol: 'https',
    query,
    get: (name: string) => {
      if (name === 'host') return 'api.takt.example.fr';
      return undefined;
    },
  } as any;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('LinkInterceptor', () => {
  it('doit ajouter un en-tête Link rel=next quand nextCursor est présent', () => {
    const interceptor = new LinkInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);
    const body = { items: [{ id: 'item-1' }], nextCursor: 'eyJpZCI6IjEifQ==' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    const setHeader = ctx.switchToHttp().getResponse().setHeader;
    expect(setHeader).toHaveBeenCalledWith(
      'Link',
      expect.stringMatching(
        /<https:\/\/api\.takt\.example\.fr\/api\/v1\/items\?limit=10&cursor=.*>; rel="next"/,
      ),
    );
  });

  it('ne doit pas ajouter d\'en-tête Link quand nextCursor est absent', () => {
    const interceptor = new LinkInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);
    const body = { items: [{ id: 'item-1' }] };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    const setHeader = ctx.switchToHttp().getResponse().setHeader;
    expect(setHeader).not.toHaveBeenCalledWith('Link', expect.any(String));
  });

  it('ne doit pas ajouter d\'en-tête Link sur une réponse en erreur', () => {
    const interceptor = new LinkInterceptor();
    const ctx = createMockContext('GET', HttpStatus.NOT_FOUND);
    const body = { items: [], nextCursor: 'abc' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    const setHeader = ctx.switchToHttp().getResponse().setHeader;
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('ne doit pas ajouter d\'en-tête Link sur un corps vide', () => {
    const interceptor = new LinkInterceptor();
    const ctx = createMockContext('GET', HttpStatus.OK);

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(null) } as any,
    );

    result.subscribe();
    const setHeader = ctx.switchToHttp().getResponse().setHeader;
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('doit conserver les paramètres de requête existants dans l\'URL du lien', () => {
    const interceptor = new LinkInterceptor();
    const ctx = createMockContext(
      'GET',
      HttpStatus.OK,
      '/api/v1/items?department=RH&limit=20',
      { department: 'RH', limit: '20' },
    );
    const body = { items: [], nextCursor: 'cursor123' };

    const result = interceptor.intercept(
      ctx,
      { handle: () => of(body) } as any,
    );

    result.subscribe();
    const setHeader = ctx.switchToHttp().getResponse().setHeader;
    const linkCall = setHeader.mock.calls.find(
      (call: [string, unknown]) => call[0] === 'Link',
    );
    const linkValue = linkCall?.[1];
    expect(linkValue).toContain('department=RH');
    expect(linkValue).toContain('limit=20');
    expect(linkValue).toContain('cursor=cursor123');
  });
});
