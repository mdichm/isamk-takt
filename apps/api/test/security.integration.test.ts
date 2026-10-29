// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests de sécurité (DAST) : CSRF guard testé unitairement.
// Les en-têtes helmet (CSP, etc.) sont appliqués dans main.ts et vérifiés
// manuellement ou via un test e2e dédié.

import { describe, it, expect } from 'vitest';
import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CsrfGuard } from '../src/common/guards/csrf.guard.js';

function makeRequest(method: string, headers: Record<string, string> = {}) {
  return {
    method,
    path: '/test',
    headers,
  } as unknown as Express.Request;
}

function makeExecutionContext(req: Express.Request): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard (unit)', () => {
  it('should reject POST without X-CSRF-Token', () => {
    const guard = new CsrfGuard({
      get: () => '',
    } as unknown as ConfigService);

    expect(() =>
      guard.canActivate(makeExecutionContext(makeRequest('POST'))),
    ).toThrow(ForbiddenException);
  });

  it('should reject POST with unknown Origin', () => {
    const guard = new CsrfGuard({
      get: () => 'http://allowed.example.com',
    } as unknown as ConfigService);

    expect(() =>
      guard.canActivate(
        makeExecutionContext(makeRequest('POST', { origin: 'http://evil.example.com' })),
      ),
    ).toThrow(ForbiddenException);
  });

  it('should accept POST with X-CSRF-Token', () => {
    const guard = new CsrfGuard({
      get: () => '',
    } as unknown as ConfigService);

    const result = guard.canActivate(
      makeExecutionContext(makeRequest('POST', { 'x-csrf-token': 'test-token' })),
    );
    expect(result).toBe(true);
  });

  it('should allow GET without CSRF token', () => {
    const guard = new CsrfGuard({
      get: () => '',
    } as unknown as ConfigService);

    const result = guard.canActivate(makeExecutionContext(makeRequest('GET')));
    expect(result).toBe(true);
  });
});
