// ============================================================
// @takt/contracts — Port SchedulingEngine (moteur de planification)
// Modèle neutre : aucun type FET, aucun type Prisma.
// Un futur moteur n'implémente que ce port.
// ============================================================

/** Identifiant unique du moteur (ex: "fet") */
export type EngineId = string;

/** Statut de traduction d'une règle métier vers FET */
export type RuleTranslationStatus = 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';

/** Rapport de traduction d'une règle */
export interface MappingReportItem {
  readonly ruleId: string;
  readonly status: RuleTranslationStatus;
  readonly reason?: string;
}

/** Capacités du moteur : règles traduisibles (EX-MOT-03) */
export interface EngineCapabilities {
  readonly engineId: EngineId;
  readonly engineVersion: string;
  readonly translatableRuleIds: readonly string[];
  readonly partialRuleIds: readonly string[];
  readonly unsupportedRuleIds: readonly string[];
  readonly supportsPartialResults: boolean;
  readonly supportsSigwrite: boolean;
  readonly maxActivities: number;
  readonly maxRooms: number;
  readonly maxTeachers: number;
}

/** Entrée neutre du moteur de planification (jamais un type Prisma) */
export interface EngineInput {
  readonly semesterId: string;
  readonly periods: readonly EnginePeriod[];
  readonly activities: readonly EngineActivity[];
  readonly teachers: readonly EngineTeacher[];
  readonly groups: readonly EngineGroup[];
  readonly rooms: readonly EngineRoom[];
  readonly activityTags: readonly EngineActivityTag[];
  readonly constraints: readonly EngineConstraint[];
  readonly locks: readonly EngineLock[];
}

/** Créneau de 30 minutes du semestre */
export interface EnginePeriod {
  readonly id: string;
  readonly dayIndex: number;
  readonly slotIndex: number;
  readonly startTime: string;
  readonly endTime: string;
}

/** Activité métier (cours, TD, TP, CI, etc.) */
export interface EngineActivity {
  readonly id: string;
  readonly code: string;
  readonly subject: string;
  readonly activityTagIds: readonly string[];
  readonly teacherIds: readonly string[];
  readonly groupIds: readonly string[];
  readonly roomTagIds: readonly string[];
  readonly durationInSlots: number;
  readonly minRooms: number;
  readonly maxRooms: number;
}

/** Enseignant (identifiant technique uniquement) */
export interface EngineTeacher {
  readonly id: string;
  readonly code: string;
}

/** Groupe d'étudiants (identifiant technique uniquement) */
export interface EngineGroup {
  readonly id: string;
  readonly code: string;
  readonly size: number;
}

/** Salle (identifiant technique uniquement) */
export interface EngineRoom {
  readonly id: string;
  readonly code: string;
  readonly capacity: number;
  readonly tagIds: readonly string[];
}

/** Tag d'activité pour compatibilité salle */
export interface EngineActivityTag {
  readonly id: string;
  readonly code: string;
}

/** Contrainte métier à traduire en FET */
export interface EngineConstraint {
  readonly id: string;
  readonly type: string;
  readonly weight: number;
  readonly entityIds: readonly string[];
  readonly parameters: Record<string, unknown>;
}

/** Verrou : placement imposé d'une activité sur un créneau et/ou salle */
export interface EngineLock {
  readonly id: string;
  readonly activityId: string;
  readonly periodId?: string;
  readonly roomId?: string;
  readonly weight: number;
}

/** Options d'exécution du moteur */
export interface EngineRunOptions {
  readonly timelimitSeconds: number;
  readonly randomSeeds: readonly [number, number, number, number, number, number];
  readonly verbose: boolean;
  readonly writeTimetables: boolean;
  readonly writeConflicts: boolean;
}

/** Résultat brut de FET (lu depuis les fichiers de sortie) */
export interface EngineRawResult {
  readonly exitCode: number;
  readonly resultText: string;
  readonly activitiesTimetableXml?: string;
  readonly timetableConflictsXml?: string;
  readonly highestXml?: string;
  readonly currentXml?: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
}

/** Solution reconstruite côté domaine à partir du résultat brut */
export interface EngineSolution {
  readonly input: EngineInput;
  readonly rawResult: EngineRawResult;
  readonly placedActivities: readonly EnginePlacedActivity[];
  readonly unplacedActivities: readonly EngineUnplacedActivity[];
  readonly totalSoftConflicts: number;
  readonly hardConflicts: readonly EngineHardConflict[];
}

/** Activité placée par le moteur */
export interface EnginePlacedActivity {
  readonly activityId: string;
  readonly periodId: string;
  readonly roomId: string | null;
}

/** Activité non placée par le moteur */
export interface EngineUnplacedActivity {
  readonly activityId: string;
  readonly reason: string;
}

/** Conflit dur détecté */
export interface EngineHardConflict {
  readonly type: string;
  readonly entityIds: readonly string[];
  readonly message: string;
}

/** Fichier de sortie généré par le constructeur FET */
export interface EngineFile {
  readonly engineVersion: string;
  readonly builderVersion: string;
  readonly payload: Buffer;
  readonly sha256: string;
  readonly mappingReport: readonly MappingReportItem[];
}

/** Port du moteur de planification (EX-MOT-01, EX-PRI-01) */
export interface SchedulingEngine {
  readonly id: EngineId;
  describeCapabilities(): EngineCapabilities;
  buildProfile(input: EngineInput): Promise<EngineFile>;
  run(file: EngineFile, opts: EngineRunOptions, signal: AbortSignal): Promise<EngineRawResult>;
  importResult(raw: EngineRawResult, input: EngineInput): Promise<EngineSolution>;
}