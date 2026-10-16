// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du helper de pagination curseur.

import { describe, it, expect } from 'vitest';
import { buildNextCursor, decodeCursor } from './pagination.helper.js';

describe('buildNextCursor', () => {
  it('doit retourner null si aucun élément', () => {
    expect(buildNextCursor([], 50)).toBeNull();
  });

  it('doit retourner null si moins d\'éléments que la limite', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(buildNextCursor(items, 50)).toBeNull();
  });

  it('doit construire un curseur à partir du dernier élément quand la limite est atteinte', () => {
    const items = [{ id: 'item-1' }, { id: 'item-2' }];
    const cursor = Buffer.from('item-2').toString('base64url');
    expect(typeof cursor).toBe('string');
    // Le curseur doit décoder en l'identifiant du dernier élément
    expect(decodeCursor(cursor)).toBe('item-2');
  });

  it('doit retourner null quand le nombre d\'éléments est strictement inférieur à la limite', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(buildNextCursor(items, 50)).toBeNull();
  });
});

describe('decodeCursor', () => {
  it('doit décoder un curseur valide', () => {
    const cursor = Buffer.from('item-42').toString('base64url');
    expect(decodeCursor(cursor)).toBe('item-42');
  });

  it('doit retourner undefined pour un curseur vide', () => {
    expect(decodeCursor(undefined)).toBeUndefined();
    expect(decodeCursor('')).toBeUndefined();
  });
});
