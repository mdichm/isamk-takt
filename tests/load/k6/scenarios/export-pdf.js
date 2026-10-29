import http from 'k6/http';
import { check, sleep } from 'k6';
import { exportDuration, exportFailRate } from '../metrics.js';
import { discoverResources } from '../utils/discovery.js';
import { authHeaders, BASE_URL } from '../utils/auth.js';

// ============================================================================
// Scénario : Export PDF (100 pages)
// POST /exports puis GET /exports/:id/download — objectif total < 60 s (ST §5.4)
// Lancer : k6 run tests/load/k6/scenarios/export-pdf.js
// ============================================================================

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'export_duration': ['p95<60000'],
    'export_fail_rate': ['rate<0.05'],
  },
};

let resources;

export function setup() {
  const token = __ENV.TOKEN || '';
  if (!token) {
    throw new Error('TOKEN requis pour le scénario export-pdf');
  }
  resources = discoverResources(token, BASE_URL);
  if (!resources.versionId) {
    throw new Error('Aucune version disponible pour le test d\'export');
  }
  return { token, resources };
}

export default function (data) {
  const { token, resources } = data;
  const headers = authHeaders(token);

  const start = Date.now();

  // 1. Créer un job d'export PDF (mode brouillon pour ne pas exiger PUBLIE)
  const createRes = http.post(
    `${BASE_URL}/exports`,
    JSON.stringify({
      versionId: resources.versionId,
      format: 'PDF',
      mode: 'BROUILLON',
      grille: 'NORMALE',
      parametres: { departementIds: [], groupeIds: [] },
    }),
    { headers }
  );

  const created = check(createRes, {
    'export job créé (201)': (r) => r.status === 201,
  });

  if (!created) {
    exportDuration.add(Date.now() - start);
    exportFailRate.add(true);
    return;
  }

  const job = JSON.parse(createRes.body);
  const jobId = job.id;

  // 2. Poller le statut jusqu'à DONE ou FAILED (max 60 s)
  let status = '';
  const maxPolls = 60; // 60 × 1s = 60 s max
  for (let i = 0; i < maxPolls; i++) {
    sleep(1);
    const statusRes = http.get(`${BASE_URL}/exports/${jobId}`, { headers });
    if (statusRes.status === 200) {
      const jobDetail = JSON.parse(statusRes.body);
      status = jobDetail.statut;
      if (status === 'DONE' || status === 'FAILED') {
        break;
      }
    }
  }

  const done = status === 'DONE';

  // 3. Télécharger l'export terminé
  if (done) {
    const downloadRes = http.get(`${BASE_URL}/exports/${jobId}/download`, { headers });
    check(downloadRes, {
      'téléchargement export OK': (r) => r.status === 200,
    });
  }

  const totalDuration = Date.now() - start;
  exportDuration.add(totalDuration);

  const success = check({}, {
    'export terminé et téléchargé < 60 s': () => done && totalDuration < 60000,
  });

  exportFailRate.add(!success);
}
