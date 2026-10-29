import http from 'k6/http';
import { check, sleep } from 'k6';
import { suggestionsDuration, suggestionsFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Suggestions de résolution pour une séance
// GET /seances/{id}/suggestions — objectif p95 < 1 s (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/suggestions.js
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'suggestions_duration': ['p95<1000'],
    'suggestions_fail_rate': ['rate<0.05'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario suggestions');
  }
  resources = discoverResources(token, BASE_URL);
  if (resources.seanceIds.length === 0) {
    throw new Error('Aucune séance disponible pour le test de suggestions');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  // Choisir une séance au hasard
  const seance = resources.seanceIds[Math.floor(Math.random() * resources.seanceIds.length)];
  const seanceId = typeof seance === 'string' ? seance : seance.id;

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/seances/${seanceId}/suggestions?limit=20`,
    { headers }
  );
  const duration = Date.now() - start;

  suggestionsDuration.add(duration);

  const success = check(res, {
    'suggestions status 200 ou 404': (r) => r.status === 200 || r.status === 404,
  });

  suggestionsFailRate.add(!success);

  sleep(1);
}
