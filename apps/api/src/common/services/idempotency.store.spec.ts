// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du magasin d'idempotence.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdempotencyStore } from './idempotency.store.js';

describe('IdempotencyStore', () => {
  beforeEach(() => {
    IdempotencyStore.clearForTest();
  });

  it('doit stocker et récupérer une entrée', () => {
    IdempotencyStore.set('key-1', { statusCode: 201, headers: {}, body: { id: 'abc' } });
    const entry = IdempotencyStore.get('key-1');
    expect(entry).toBeDefined();
    expect(entry?.statusCode).toBe(201);
    expect(entry?.body).toEqual({ id: 'abc' });
  });

  it('doit retourner undefined pour une clé inconnue', () => {
    expect(IdempotencyStore.get('inconnu')).toBeUndefined();
  });

  it('doit supprimer une entrée', () => {
    IdempotencyStore.set('key-1', { statusCode: 200, headers: {}, body: {} });
    IdempotencyStore.delete('key-1');
    expect(IdempotencyStore.get('key-1')).toBeUndefined();
  });

  it('doit retourner la taille du magasin', () => {
    expect(IdempotencyStore.size()).toBe(0);
    IdempotencyStore.set('key-1', { statusCode: 200, headers: {}, body: {} });
    IdempotencyStore.set('key-2', { statusCode: 200, headers: {}, body: {} });
    expect(IdempotencyStore.size()).toBe(2);
  });

  it('doit vider le magasin', () => {
    IdempotencyStore.set('key-1', { statusCode: 200, headers: {}, body: {} });
    IdempotencyStore.clearForTest();
    expect(IdempotencyStore.size()).toBe(0);
  });
});
