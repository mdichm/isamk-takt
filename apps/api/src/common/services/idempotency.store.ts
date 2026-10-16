// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Magasin en mémoire des réponses idempotentes (clé Idempotency-Key).
// En production, ce magasin doit être remplacé par un store distribué (Redis).

interface IdempotencyEntry {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  createdAt?: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

const store = new Map<string, IdempotencyEntry>();

export class IdempotencyStore {
  /** Enregistre une réponse associée à une clé d'idempotence. */
  static set(key: string, entry: IdempotencyEntry): void {
    store.set(key, { ...entry, createdAt: Date.now() });
    IdempotencyStore.gc();
  }

  /** Récupère une réponse mise en cache pour une clé, ou undefined. */
  static get(key: string): IdempotencyEntry | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    const createdAt = entry.createdAt ?? 0;
    if (Date.now() - createdAt > IDEMPOTENCY_TTL_MS) {
      store.delete(key);
      return undefined;
    }
    return entry;
  }

  /** Supprime une clé du magasin. */
  static delete(key: string): void {
    store.delete(key);
  }

  /** Nettoyage des entrées expirées. */
  static gc(): void {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      const createdAt = entry.createdAt ?? 0;
      if (now - createdAt > IDEMPOTENCY_TTL_MS) {
        store.delete(key);
      }
    }
  }

  /** Nombre de clés en cours (pour les tests). */
  static size(): number {
    return store.size;
  }

  /** Vide le magasin (tests uniquement). */
  static clearForTest(): void {
    store.clear();
  }
}
