// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Helper de construction de réponse paginée par curseur.
// @see ST §3.1 : Curseur ?limit=50&cursor=... → { data, nextCursor }.

/**
 * Construit le curseur opaque pour la page suivante à partir du dernier élément.
 * Le curseur est un base64 URL-safe de l'identifiant du dernier élément.
 */
export function buildNextCursor<T extends { id: string }>(
  items: T[],
  limit: number,
): string | null {
  if (!items || items.length === 0) return null;
  if (items.length < limit) return null;

  const lastItem = items[items.length - 1];
  return Buffer.from(lastItem.id).toString('base64url');
}

/**
 * Décode un curseur opaque en identifiant d'élément (ou undefined si invalide).
 */
export function decodeCursor(cursor: string | undefined): string | undefined {
  if (!cursor) return undefined;
  try {
    return Buffer.from(cursor, 'base64url').toString('utf-8');
  } catch {
    return undefined;
  }
}
