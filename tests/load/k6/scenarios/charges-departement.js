import http from 'k6/http';
import { check, sleep } from 'k6';
import { chargesDuration, chargesFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Calcul des charges par département
// GET /charges?departementId= — objectif p95 < 500 ms (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/charges-departement.js
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'charges_duration': ['p95(charges_duration) < 500'],
    'charges_fail_rate': ['rate<0.05'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario charges-departement');
  }
  resources = discoverResources(token, BASE_URL);
  if (!resources.departementId) {
    throw new Error('Aucun département disponible pour le test de charges');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/charges?departementId=${resources.departementId}&page=1&limit=50`,
    { headers }
  );
  const duration = Date.now() - start;

  chargesDuration.add(duration);

  const success = check(res, {
    'charges status 200': (r) => r.status === 200,
  });

  chargesFailRate.add(!success);

  sleep(1);
}
