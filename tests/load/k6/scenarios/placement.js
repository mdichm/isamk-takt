import http from 'k6/http';
import { check, sleep } from 'k6';
import { placementDuration, placementFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : 10 éditeurs simultanés sur 4 000 séances
// PATCH /seances/{id}/placement — objectif p95 < 200 ms (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/placement.js
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'placement_duration': ['p95(placement_duration) < 200'],
    'placement_fail_rate': ['rate<0.05'],
  },
};

// Ressources découvertes (partagées entre itérations)
let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario placement');
  }
  resources = discoverResources(token, BASE_URL);
  if (resources.seanceIds.length === 0) {
    throw new Error('Aucune séance disponible pour le test de placement');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  // Choisir une séance au hasard parmi celles découvertes
  const seance = resources.seanceIds[Math.floor(Math.random() * resources.seanceIds.length)];
  const seanceId = typeof seance === 'string' ? seance : seance.id;

  // Construire un MoveSeanceDto avec un créneau et salle
  const jour = 'MARDI';
  const creneauDebutId = resources.creneauIds.length > 0
    ? resources.creneauIds[Math.floor(Math.random() * resources.creneauIds.length)]
    : '00000000-0000-0000-0000-000000000000';
  const salleId = resources.salleIds.length > 0
    ? resources.salleIds[Math.floor(Math.random() * resources.salleIds.length)]
    : '00000000-0000-0000-0000-000000000000';

  const start = Date.now();
  const res = http.patch(
    `${BASE_URL}/seances/${seanceId}/placement`,
    JSON.stringify({ jour, creneauDebutId, salleId }),
    { headers }
  );
  const duration = Date.now() - start;

  placementDuration.add(duration);

  const success = check(res, {
    'placement status est 200, 409, 412 ou 422': (r) =>
      [200, 409, 412, 422].includes(r.status),
  });

  placementFailRate.add(!success);

  sleep(1);
}
