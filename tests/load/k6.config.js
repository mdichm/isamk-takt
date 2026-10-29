import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import {
  placementDuration, placementFailRate,
  gridDuration, gridFailRate,
  tdbDuration, tdbFailRate,
  suggestionsDuration, suggestionsFailRate,
  chargesDuration, chargesFailRate,
  gen409Count, gen409Expected,
  exportDuration, exportFailRate,
} from './k6/metrics.js';

// ============================================================================
// TAKT - Tests de charge k6 (L7-08)
// 10 éditeurs simultanés sur 4 000 séances, génération parallèle refusée (409)
// Objectifs p95 conformes à ST §5.4
// ============================================================================

export const options = {
  vus: 10,
  stages: [
    { duration: '30s', target: 10 },   // Montée à 10 VUs (éditeurs simultanés)
    { duration: '2m', target: 10 },    // Palier à 10 VUs
    { duration: '30s', target: 0 },    // Redescente
  ],
  thresholds: {
    // Objectifs p95 ST §5.4
    'placement_duration': ['p95<200'],   // PATCH /seances/{id}/placement < 200 ms
    'grid_duration': ['p95<500'],        // Chargement grille < 500 ms
    'tdb_duration': ['p95<500'],         // GET /tableau-de-bord < 500 ms
    'suggestions_duration': ['p95<1000'], // GET /seances/{id}/suggestions < 1 s
    'charges_duration': ['p95<500'],     // Calcul charges département < 500 ms
    'export_duration': ['p95<60000'],    // Export PDF 100 pages < 60 s
    // Taux d'erreur
    'placement_fail_rate': ['rate<0.05'],
    'grid_fail_rate': ['rate<0.05'],
    'tdb_fail_rate': ['rate<0.05'],
    'suggestions_fail_rate': ['rate<0.05'],
    'charges_fail_rate': ['rate<0.05'],
    'export_fail_rate': ['rate<0.05'],
    // 409 attendu pour la génération parallèle
    'gen_409_expected_rate': ['rate==1.0'],
  },
  tags: {
    test_type: 'load',
    ticket: 'L7-08',
  },
};

export function handleSummary(data) {
  return {
    'tests/load/k6/results/summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

export function setup() {
  // Vide : chaque scénario gère sa propre authentification et découverte
  return {};
}

export function teardown() {
  // Rien à nettoyer
}
