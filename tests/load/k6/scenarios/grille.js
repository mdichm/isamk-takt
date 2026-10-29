import http from 'k6/http';
import { check, sleep } from 'k6';
import { gridDuration, gridFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Chargement de la grille d'édition (4 000 séances)
// GET /versions/{id}/seances — objectif p95 < 500 ms (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/grille.js
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'grid_duration': ['p95(grid_duration) < 500'],
    'grid_fail_rate': ['rate<0.05'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario grille');
  }
  resources = discoverResources(token, BASE_URL);
  if (!resources.versionId) {
    throw new Error('Aucune version disponible pour le test de grille');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/versions/${resources.versionId}/seances?page=1&limit=100`,
    { headers }
  );
  const duration = Date.now() - start;

  gridDuration.add(duration);

  const success = check(res, {
    'grille status 200': (r) => r.status === 200,
  });

  gridFailRate.add(!success);

  sleep(1);
}
