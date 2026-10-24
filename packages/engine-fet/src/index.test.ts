// SPDX-License-Identifier: AGPL-3.0-only
// Tests unitaires pour le parsing de logs/result.txt (classifyOutcome)
// @takt/engine-fet — L4-08

import { describe, it, expect } from 'vitest';
import { classifyOutcome, type FetOutcome } from './index.js';

function isSuccess(o: FetOutcome): o is { kind: 'SUCCESS' } {
  return o.kind === 'SUCCESS';
}
function isImpossible(o: FetOutcome): o is { kind: 'IMPOSSIBLE' } {
  return o.kind === 'IMPOSSIBLE';
}
function isTimeExceeded(o: FetOutcome): o is { kind: 'TIME_EXCEEDED' } {
  return o.kind === 'TIME_EXCEEDED';
}
function isInterrupted(o: FetOutcome): o is { kind: 'INTERRUPTED' } {
  return o.kind === 'INTERRUPTED';
}
function isFailed(o: FetOutcome): o is { kind: 'FAILED'; reason: string } {
  return o.kind === 'FAILED';
}

describe('classifyOutcome — parsing de logs/result.txt', () => {
  it('rc 0 + "Generation successful" → SUCCESS', () => {
    const result = classifyOutcome(0, 'Generation successful\n');
    expect(isSuccess(result)).toBe(true);
  });

  it('rc 0 + "Generation successful" avec texte autour → SUCCESS', () => {
    const result = classifyOutcome(0, 'Some logs... Generation successful ...');
    expect(isSuccess(result)).toBe(true);
  });

  it('rc 0 + "Impossible" → IMPOSSIBLE', () => {
    const result = classifyOutcome(0, 'Impossible\n');
    expect(isImpossible(result)).toBe(true);
  });

  it('rc 0 + "Time exceeded" → TIME_EXCEEDED', () => {
    const result = classifyOutcome(0, 'Time exceeded\n');
    expect(isTimeExceeded(result)).toBe(true);
  });

  it('rc 0 + "Generation interrupted" → INTERRUPTED', () => {
    const result = classifyOutcome(0, 'Generation interrupted\n');
    expect(isInterrupted(result)).toBe(true);
  });

  it('rc 1 → FAILED', () => {
    const result = classifyOutcome(1, 'Error: the specified input file ... is not existing');
    expect(isFailed(result)).toBe(true);
    if (isFailed(result)) {
      expect(result.reason).toContain('code 1');
    }
  });

  it('rc < 0 (SIGKILL) → FAILED, prioritaire sur result.txt', () => {
    // Même si result.txt dit "Generation successful", un processus tué prime
    const result = classifyOutcome(-9, 'Generation successful');
    expect(isFailed(result)).toBe(true);
    if (isFailed(result)) {
      expect(result.reason).toContain('tué ou planté');
    }
  });

  it('rc > 128 (SIGKILL shell) → FAILED', () => {
    const result = classifyOutcome(137, '');
    expect(isFailed(result)).toBe(true);
  });

  it('rc 0 + texte non reconnu → FAILED', () => {
    const result = classifyOutcome(0, 'Statut inconnu');
    expect(isFailed(result)).toBe(true);
  });

  it('rc 0 + chaîne vide → FAILED', () => {
    const result = classifyOutcome(0, '');
    expect(isFailed(result)).toBe(true);
  });
});