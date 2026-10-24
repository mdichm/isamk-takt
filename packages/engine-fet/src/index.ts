// FET Engine - XML builder/parser for FET 7.12.0
// Adaptateur du port SchedulingEngine depuis @takt/contracts.
// Implémentation du constructeur XML et du parseur à venir (L4-03+).

import type { SchedulingEngine, EngineInput, EngineFile, EngineRunOptions, EngineRawResult, EngineSolution } from '@takt/contracts';

export interface FetData {
  institutionName: string;
  // ... other FET data fields
}

export function buildFetXml(data: FetData): string {
  throw new Error('Not implemented');
}

export function parseFetXml(xml: string): FetData {
  throw new Error('Not implemented');
}

/** Squelette de l'adaptateur FET implémentant le port SchedulingEngine (à compléter en L4-03) */
export class FetAdapter implements SchedulingEngine {
  readonly id = 'fet';

  describeCapabilities(): import('@takt/contracts').EngineCapabilities {
    throw new Error('Not implemented');
  }

  buildProfile(input: EngineInput): Promise<EngineFile> {
    throw new Error('Not implemented');
  }

  run(file: EngineFile, opts: EngineRunOptions, signal: AbortSignal): Promise<EngineRawResult> {
    throw new Error('Not implemented');
  }

  importResult(raw: EngineRawResult, input: EngineInput): Promise<EngineSolution> {
    throw new Error('Not implemented');
  }
}
