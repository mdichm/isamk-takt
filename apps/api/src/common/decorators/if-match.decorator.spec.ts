// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du décorateur IfMatch.

import { describe, it, expect } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { extractIfMatch } from './if-match.decorator.js';

function createMockRequest(headers: Record<string, string>): Request {
  return { headers } as unknown as Request;
}

describe('extractIfMatch', () => {
  it('doit extraire la valeur de l\'en-tête If-Match', () => {
    const req = createMockRequest({ 'if-match': '"abc-123"' });
    const result = extractIfMatch(req);
    expect(result).toBe('"abc-123"');
  });

  it('doit accepter une valeur sans guillemets', () => {
    const req = createMockRequest({ 'if-match': 'abc-123' });
    const result = extractIfMatch(req);
    expect(result).toBe('abc-123');
  });

  it('doit lever une exception 412 si l\'en-tête est absent', () => {
    const req = createMockRequest({});
    let error: unknown;
    try {
      extractIfMatch(req);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    const httpError = error as { status?: number };
    expect(httpError.status).toBe(HttpStatus.PRECONDITION_FAILED);
  });
});
