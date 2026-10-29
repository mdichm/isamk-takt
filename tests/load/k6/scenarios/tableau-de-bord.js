import http from 'k6/http';
import { check, sleep } from 'k6';
import { tdbDuration, tdbFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Tableau de bord agrégé par rôle
// GET /tableau-de-bord — objectif p95 < 500 ms (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/tableau-de-bord.js
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'tdb_duration': ['p95<500'],
    'tdb_fail_rate': ['rate<0.05'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario tableau-de-bord');
  }
  resources = discoverResources(token, BASE_URL);
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  const params = resources.semestreId ? `?semestreId=${resources.semestreId}` : '';

  const start = Date.now();
  const res = http.get(`${BASE_URL}/tableau-de-bord${params}`, { headers });
  const duration = Date.now() - start;

  tdbDuration.add(duration);

  const success = check(res, {
    'tableau de bord status 200': (r) => r.status === 200,
  });

  tdbFailRate.add(!success);

  sleep(1);
}
