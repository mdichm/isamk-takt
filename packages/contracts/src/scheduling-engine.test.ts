import { describe, it, expect } from 'vitest';
import {
  SchedulingEngine,
  EngineInput,
  EngineFile,
  EngineCapabilities,
  MappingReportItem,
  RuleTranslationStatus,
} from './scheduling-engine.js';

describe('SchedulingEngine port types', () => {
  it('defines the SchedulingEngine interface shape', () => {
    const engine: SchedulingEngine = {
      id: 'fet',
      describeCapabilities: () => ({
        engineId: 'fet',
        engineVersion: '7.12.0',
        translatableRuleIds: [],
        partialRuleIds: [],
        unsupportedRuleIds: [],
        supportsPartialResults: true,
        supportsSigwrite: true,
        maxActivities: 30_000,
        maxRooms: 6_000,
        maxTeachers: 6_000,
      }),
      buildProfile: async (_input: EngineInput) => {
        const mappingReport: MappingReportItem[] = [];
        return {
          engineVersion: '7.12.0',
          builderVersion: '0.0.1',
          payload: Buffer.from(''),
          sha256: '',
          mappingReport,
        };
      },
      run: async (_file: EngineFile, _opts: any, _signal: AbortSignal) => {
        return {
          exitCode: 0,
          resultText: '',
          stdout: '',
          stderr: '',
          durationMs: 0,
        };
      },
      importResult: async (_raw: any, _input: EngineInput) => {
        return {
          input: _input,
          rawResult: _raw,
          placedActivities: [],
          unplacedActivities: [],
          totalSoftConflicts: 0,
          hardConflicts: [],
        };
      },
    };

    expect(engine.id).toBe('fet');
    expect(typeof engine.describeCapabilities).toBe('function');
    expect(typeof engine.buildProfile).toBe('function');
    expect(typeof engine.run).toBe('function');
    expect(typeof engine.importResult).toBe('function');
  });

  it('EngineInput contains no Prisma or FET types', () => {
    const input: EngineInput = {
      semesterId: 's1-2025-2026',
      periods: [],
      activities: [],
      teachers: [],
      groups: [],
      rooms: [],
      activityTags: [],
      constraints: [],
      locks: [],
    };

    expect(input.semesterId).toBe('s1-2025-2026');
    expect(input.periods).toEqual([]);
    expect(input.activities).toEqual([]);
    expect(input.constraints).toEqual([]);
    expect(input.locks).toEqual([]);
  });

  it('MappingReportItem status values are valid', () => {
    const statuses: RuleTranslationStatus[] = [
      'TRADUITE',
      'PARTIELLE',
      'NON_TRADUITE',
    ];

    expect(statuses).toHaveLength(3);
    expect(statuses).toContain('TRADUITE');
    expect(statuses).toContain('PARTIELLE');
    expect(statuses).toContain('NON_TRADUITE');
  });

  it('EngineFile carries a Buffer payload and sha256', () => {
    const file: EngineFile = {
      engineVersion: '7.12.0',
      builderVersion: '0.0.1',
      payload: Buffer.from('<fet/>'),
      sha256: 'abc123',
      mappingReport: [],
    };

    expect(file.payload).toBeInstanceOf(Buffer);
    expect(file.sha256).toBe('abc123');
    expect(file.mappingReport).toEqual([]);
  });

  it('EngineCapabilities reports FET 7.12.0 limits', () => {
    const caps: EngineCapabilities = {
      engineId: 'fet',
      engineVersion: '7.12.0',
      translatableRuleIds: [],
      partialRuleIds: [],
      unsupportedRuleIds: [],
      supportsPartialResults: true,
      supportsSigwrite: true,
      maxActivities: 30_000,
      maxRooms: 6_000,
      maxTeachers: 6_000,
    };

    expect(caps.engineVersion).toBe('7.12.0');
    expect(caps.maxActivities).toBe(30_000);
    expect(caps.supportsPartialResults).toBe(true);
  });
});