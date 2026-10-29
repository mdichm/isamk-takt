import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// TAKT - Métriques partagées pour les tests de charge k6 (L7-08)
// Objectifs p95 conformes à ST §5.4
// ============================================================================

export const placementDuration = new Trend('placement_duration');
export const placementFailRate = new Rate('placement_fail_rate');
export const gridDuration = new Trend('grid_duration');
export const gridFailRate = new Rate('grid_fail_rate');
export const tdbDuration = new Trend('tdb_duration');
export const tdbFailRate = new Rate('tdb_fail_rate');
export const suggestionsDuration = new Trend('suggestions_duration');
export const suggestionsFailRate = new Rate('suggestions_fail_rate');
export const chargesDuration = new Trend('charges_duration');
export const chargesFailRate = new Rate('charges_fail_rate');
export const gen409Count = new Counter('gen_409_count');
export const gen409Expected = new Rate('gen_409_expected_rate');
export const exportDuration = new Trend('export_duration');
export const exportFailRate = new Rate('export_fail_rate');
