// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Cache mémoire de l'OccupancyIndex par version@revision (L3-23)
// Clé : versionId@revision. Invalidation naturelle quand revision change.
// Une instance qui rencontre une revision plus récente reconstruit l'index.
// Aucun Redis en v1.0.
import { Injectable } from '@nestjs/common';
import { OccupancyIndex } from '@takt/conflict-engine';

interface CacheEntry {
  revision: number;
  index: OccupancyIndex;
}

@Injectable()
export class OccupancyCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Retourne l'OccupancyIndex en cache pour (versionId, revision), ou le reconstruit
   * via buildFn si la revision a changé ou si aucune entrée n'existe.
   */
  getOrBuild(
    versionId: string,
    revision: number,
    buildFn: () => OccupancyIndex,
  ): OccupancyIndex {
    const key = `${versionId}@${revision}`;
    const entry = this.cache.get(key);

    if (entry && entry.revision === revision) {
      return entry.index;
    }

    const index = buildFn();
    this.cache.set(key, { revision, index });
    return index;
  }

  /** Invalide toutes les entrées en cache pour une version donnée. */
  invalidate(versionId: string): void {
    const prefix = `${versionId}@`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /** Nombre d'entrées en cache (debug/monitoring). */
  size(): number {
    return this.cache.size;
  }
}
