// FET Engine - XML builder/parser for FET 7.12.0
// Adaptateur du port SchedulingEngine depuis @takt/contracts.
// Implémentation du constructeur XML et du parseur à venir (L4-03+).

import type { SchedulingEngine, EngineInput, EngineFile, EngineRunOptions, EngineRawResult, EngineSolution } from '@takt/contracts';
import { buildProfile as buildFetProfile } from './fet-entities.js';

export interface FetData {
  institutionName: string;
  // ... other FET data fields
}

export function buildFetXml(_data: FetData): string {
  throw new Error('Not implemented');
}

export function parseFetXml(_xml: string): FetData {
  throw new Error('Not implemented');
}

/** Squelette de l'adaptateur FET implémentant le port SchedulingEngine (à compléter en L4-03+) */
export class FetAdapter implements SchedulingEngine {
  readonly id = 'fet';

  describeCapabilities(): import('@takt/contracts').EngineCapabilities {
    throw new Error('Not implemented');
  }

  buildProfile(input: EngineInput): Promise<EngineFile> {
    return Promise.resolve(buildFetProfile(input));
  }

  run(_file: EngineFile, _opts: EngineRunOptions, _signal: AbortSignal): Promise<EngineRawResult> {
    throw new Error('Not implemented');
  }

  importResult(_raw: EngineRawResult, _input: EngineInput): Promise<EngineSolution> {
    throw new Error('Not implemented');
  }
}
