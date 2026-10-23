// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du cache OccupancyIndex (L3-23)
import { OccupancyCacheService } from './occupancy-cache.service.js';
import { OccupancyIndex } from '@takt/conflict-engine';

describe('OccupancyCacheService', () => {
  let service: OccupancyCacheService;

  beforeEach(() => {
    service = new OccupancyCacheService();
  });

  it('construit et retourne un index en cache pour une version@revision', () => {
    const buildFn = () => {
      const idx = new OccupancyIndex();
      idx.build([{ seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' }]);
      return idx;
    };

    const idx1 = service.getOrBuild('v1', 1, buildFn);
    const idx2 = service.getOrBuild('v1', 1, buildFn);

    expect(idx1).toBe(idx2);
    expect(service.size()).toBe(1);
  });

  const newBuildFn = () => {
    const idx = new OccupancyIndex();
    idx.build([{ seanceId: 's2', jour: 'MARDI', creneauId: 'c2', ressourceType: 'SALLE', ressourceId: 'r1' }]);
    return idx;
  };

  it('reconstruit l\'index quand la revision change', () => {
    const idx1 = service.getOrBuild('v1', 1, () => newBuildFn());
    const idx2 = service.getOrBuild('v1', 2, newBuildFn);

    expect(idx1).not.toBe(idx2);
    expect(service.size()).toBe(2);
  });

  it('isole les caches par version', () => {
    service.getOrBuild('v1', 1, newBuildFn);
    service.getOrBuild('v2', 1, newBuildFn);

    expect(service.size()).toBe(2);
  });

  it('invalide toutes les entrées d\'une version', () => {
    service.getOrBuild('v1', 1, newBuildFn);
    service.getOrBuild('v1', 2, newBuildFn);
    service.getOrBuild('v2', 1, newBuildFn);

    expect(service.size()).toBe(3);

    service.invalidate('v1');

    expect(service.size()).toBe(1);
  });
});
