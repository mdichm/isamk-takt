import http from 'k6/http';
import { check } from 'k6';
import { gen409Count, gen409Expected } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Génération parallèle refusée (409)
// POST /versions/{id}/generations — une seconde génération sur le même
// semestre doit être refusée avec 409 GENERATION_ALREADY_RUNNING.
// Lancer : k6 run tests/load/k6/scenarios/generation-parallele.js
// ============================================================================

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'gen_409_expected_rate': ['rate(gen_409_expected_rate) == 1.0'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario generation-parallele');
  }
  resources = discoverResources(token, BASE_URL);
  if (!resources.versionId) {
    throw new Error('Aucune version disponible pour le test de génération');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  // Récupérer le périmètre et son empreinte (requis par CreateGenerationDto)
  const perimetreRes = http.get(
    `${BASE_URL}/versions/${resources.versionId}/perimetre`,
    { headers }
  );
  if (perimetreRes.status !== 200) {
    throw new Error(`Impossible de récupérer le périmètre (${perimetreRes.status})`);
  }
  const perimetre = JSON.parse(perimetreRes.body);
  const perimetreHash = perimetre.empreinte || perimetre.hash || '';

  // Récupérer un profil de génération (nécessaire pour CreateGenerationDto)
  const profilsRes = http.get(`${BASE_URL}/profils`, { headers });
  let profilId = '';
  if (profilsRes.status === 200) {
    const profils = JSON.parse(profilsRes.body);
    const profilsList = profils.data || profils || [];
    if (profilsList.length > 0) {
      profilId = profilsList[0].id;
    }
  }
  if (!profilId) {
    throw new Error('Aucun profil de génération disponible');
  }

  // 1er lancement : doit retourner 202 ACCEPTED
  const launchRes = http.post(
    `${BASE_URL}/versions/${resources.versionId}/generations`,
    JSON.stringify({
      profilId,
      perimetreHash,
      acknowledgeUntranslatedConstraints: false,
    }),
    { headers }
  );

  const firstOk = check(launchRes, {
    'première génération retourne 202': (r) => r.status === 202,
  });

  if (!firstOk) {
    // Si la première génération échoue (ex: pas de préparation), on ne peut pas tester le 409
    gen409Expected.add(false);
    return;
  }

  // 2ème lancement immédiat : doit retourner 409 GENERATION_ALREADY_RUNNING
  const secondRes = http.post(
    `${BASE_URL}/versions/${resources.versionId}/generations`,
    JSON.stringify({
      profilId,
      perimetreHash,
      acknowledgeUntranslatedConstraints: false,
    }),
    { headers }
  );

  const is409 = check(secondRes, {
    'seconde génération retourne 409': (r) => r.status === 409,
  });

  gen409Count.add(1);
  gen409Expected.add(is409);
}
