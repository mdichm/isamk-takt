// Conflict Engine - Pure TypeScript collision detection (ST §4.3).
// Paquet pur, sans dépendance NestJS ni Prisma, partagé par l'API et le worker.

export { computeSignature, type SlotKey } from './signature.js';
export { OccupancyIndex, type SlotOccupancy, type OccupationInput, type SlotOccupant } from './occupancy-index.js';
export { GroupeClosure, type GroupeNode, type GroupeClosureEntry } from './groupe-closure.js';
export { IndispoSet } from './indispo-set.js';
export { Reqs, type ActivityReqs } from './reqs.js';
export { SnapshotIndex, type SnapshotEntry } from './snapshot-index.js';
export { VerrouIndex } from './verrou-index.js';
export {
  validatePlacement,
  validatePlacementWithGroups,
  type Conflit,
  type ConflitType,
  type ConflitSeverite,
  type SeanceInput,
  type PlacementCandidat,
  type ConflictContext,
  type ValidatePlacementCtx,
  type SalleData,
} from './validate-placement.js';
export {
  computeConflicts,
  impactedSeances,
  type SeancePlacement,
  type Placement,
} from './recompute.js';
