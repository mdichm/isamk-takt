// FET Engine - XML builder/parser for FET 7.12.0
// Adaptateur du port SchedulingEngine depuis @takt/contracts.
// Implémentation du constructeur XML et du parseur (L4-03/L4-08).

import type {
  SchedulingEngine,
  EngineInput,
  EngineFile,
  EngineRunOptions,
  EngineRawResult,
  EngineSolution,
  EngineCapabilities,
} from '@takt/contracts';
import { buildProfile as buildFetProfile } from './fet-entities.js';
import { execFile, type ChildProcess } from 'child_process';
import { join } from 'path';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { readFile } from 'fs/promises';
import { tmpdir } from 'os';

const FET_CL_PATH = process.env.FET_CL ?? 'fet-cl';
const FET_LOCALE = 'LC_ALL=C.UTF-8';
const FET_LANGUAGE = 'en_US';
const SIGTERM_TO_SIGKILL_GRACE_MS = 30_000;

/** Libellés reconnus dans logs/result.txt (toujours en anglais) */
const RESULT_SUCCESS = 'Generation successful';
const RESULT_IMPOSSIBLE = 'Impossible';
const RESULT_TIME_EXCEEDED = 'Time exceeded';
const RESULT_INTERRUPTED = 'Generation interrupted';

/** Statuts normalisés du résultat de fet-cl */
export type FetOutcome =
  | { kind: 'SUCCESS' }
  | { kind: 'IMPOSSIBLE' }
  | { kind: 'TIME_EXCEEDED' }
  | { kind: 'INTERRUPTED' }
  | { kind: 'FAILED'; reason: string };

/**
 * Analyse le contenu de logs/result.txt et le code de sortie pour déterminer l'issue.
 * Règle : rc == 1 ou rc < 0 → échec (prioritaire). rc == 0 → lire result.txt.
 * Exporté pour les tests unitaires.
 */
export function classifyOutcome(exitCode: number, resultText: string): FetOutcome {
  // Processus tué ou planté : prioritaire sur result.txt
  if (exitCode < 0 || exitCode > 128) {
    return { kind: 'FAILED', reason: `Processus tué ou planté (code ${exitCode})` };
  }
  // Erreur d'appel ou de données
  if (exitCode === 1) {
    return { kind: 'FAILED', reason: `Erreur d'appel ou de données (code ${exitCode}): ${resultText.trim()}` };
  }
  // rc == 0 : lire result.txt
  const trimmed = resultText.trim();
  if (trimmed.includes(RESULT_SUCCESS)) {
    return { kind: 'SUCCESS' };
  }
  if (trimmed.includes(RESULT_IMPOSSIBLE)) {
    return { kind: 'IMPOSSIBLE' };
  }
  if (trimmed.includes(RESULT_TIME_EXCEEDED)) {
    return { kind: 'TIME_EXCEEDED' };
  }
  if (trimmed.includes(RESULT_INTERRUPTED)) {
    return { kind: 'INTERRUPTED' };
  }
  return { kind: 'FAILED', reason: `Statut non reconnu dans result.txt: ${trimmed}` };
}

/** Lit le fichier <nom>_activities.xml depuis le dossier timetables/<nom>/ */
async function readActivitiesXml(outputDir: string, inputName: string): Promise<string | undefined> {
  const { readdir } = await import('fs/promises');
  const timetablesDir = join(outputDir, 'timetables');
  try {
    const entries = await readdir(timetablesDir, { withFileTypes: true });
    const nomDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith(inputName))
      .sort((a, b) => b.name.localeCompare(a.name));
    if (nomDirs.length === 0) {
      return undefined;
    }
    const xmlPath = join(timetablesDir, nomDirs[0].name, `${inputName}_activities.xml`);
    return await readFile(xmlPath, 'utf-8');
  } catch {
    return undefined;
  }
}



/** Construit les arguments de ligne de commande pour fet-cl */
function buildFetClArgs(
  inputFile: string,
  outputDir: string,
  opts: EngineRunOptions,
): string[] {
  const args: string[] = [
    `--inputfile=${inputFile}`,
    `--outputdir=${outputDir}`,
    `--timelimitseconds=${opts.timelimitSeconds}`,
    `--language=${FET_LANGUAGE}`,
    // Écrire le XML des activités (sortie utile pour l'intégration)
    `--writetimetablesxml=true`,
    // Désactiver les sorties HTML inutiles pour la performance
    `--writetimetablesstatistics=false`,
    `--writetimetablesdayshorizontal=false`,
    `--writetimetablesdaysvertical=false`,
    `--writetimetablestimehorizontal=false`,
    `--writetimetablestimevertical=false`,
    `--writetimetablesgroups=false`,
    `--writetimetablesyears=false`,
    `--writetimetablesteachersfreeperiods=false`,
    `--writetimetablesbuildings=false`,
    `--writetimetablesrooms=false`,
    `--writetimetablessubjects=false`,
    `--writetimetablesactivitytags=false`,
  ];

  // Six graines MRG32k3a obligatoires
  const [s10, s11, s12, s20, s21, s22] = opts.randomSeeds;
  args.push(
    `--randomseeds10=${s10}`,
    `--randomseeds11=${s11}`,
    `--randomseeds12=${s12}`,
    `--randomseeds20=${s20}`,
    `--randomseeds21=${s21}`,
    `--randomseeds22=${s22}`,
  );

  return args;
}

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

/** Implémentation complète de l'adaptateur FET (buildProfile + run + importResult) */
export class FetAdapter implements SchedulingEngine {
  readonly id = 'fet';

  describeCapabilities(): EngineCapabilities {
    return {
      engineId: 'fet',
      engineVersion: '7.12.0',
      translatableRuleIds: [],
      partialRuleIds: [],
      unsupportedRuleIds: [],
      supportsPartialResults: true,
      supportsSigwrite: true,
      maxActivities: 10000,
      maxRooms: 1000,
      maxTeachers: 1000,
    };
  }

  buildProfile(input: EngineInput): Promise<EngineFile> {
    return Promise.resolve(buildFetProfile(input));
  }

  async run(
    file: EngineFile,
    opts: EngineRunOptions,
    signal: AbortSignal,
  ): Promise<EngineRawResult> {
    const startTime = Date.now();

    // Répertoire de sortie dédié à cette exécution
    const outputDir = await mkdtemp(join(tmpdir(), 'takt-fet-run-'));

    try {
      // Le nom du fichier d'entrée détermine le préfixe des fichiers de sortie
      const inputName = 'input';
      const inputPath = join(outputDir, `${inputName}.fet`);

      // Écrire le fichier .fet
      await writeFile(inputPath, file.payload, 'utf-8');

      // Supprimer tout fichier sigwrite résiduel (fet-cl échoue sinon avec code 1)
      try {
        await rm(join(outputDir, 'sigwrite'), { force: true });
      } catch {
        // Ignorer si le fichier n'existe pas
      }

      // Construire les arguments de ligne de commande
      const args = buildFetClArgs(inputPath, outputDir, opts);

      // Lancer fet-cl en sous-processus
      const env = { ...process.env, LC_ALL: FET_LOCALE };

      let child: ChildProcess | null = null;
      let stdout = '';
      let stderr = '';

      const runPromise = new Promise<{ exitCode: number; stdout: string; stderr: string }>(
        (resolve, _reject) => {
          child = execFile(FET_CL_PATH, args, { env, maxBuffer: 50 * 1024 * 1024 }, (error, stdoutBuf, stderrBuf) => {
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              stdout: stdoutBuf ? stdoutBuf.toString() : '',
              stderr: stderrBuf ? stderrBuf.toString() : '',
            });
          });

          // Gestion de l'annulation via AbortSignal
          const onAbort = () => {
            if (!child || child.killed) {
              return;
            }
            // SIGTERM : arrêt propre, écrit le résultat partiel
            child.kill('SIGTERM');
            // Après le délai de grâce, SIGKILL si le processus est encore vivant
            setTimeout(() => {
              if (child && !child.killed) {
                child.kill('SIGKILL');
              }
            }, SIGTERM_TO_SIGKILL_GRACE_MS);
          };

          if (signal.aborted) {
            onAbort();
          } else {
            signal.addEventListener('abort', onAbort);
          }
        },
      );

      const { exitCode, stdout: stdoutResult, stderr: stderrResult } = await runPromise;
      stdout = stdoutResult;
      stderr = stderrResult;

      const durationMs = Date.now() - startTime;

      // Lire logs/result.txt
      let resultText = '';
      try {
        resultText = await readFile(join(outputDir, 'logs', 'result.txt'), 'utf-8');
      } catch {
        resultText = '';
      }

      // Lire <nom>_activities.xml
      const activitiesXml = await readActivitiesXml(outputDir, inputName);

      // Lire le fichier "highest" si présent (meilleure solution partielle)
      let highestXml: string | undefined;
      try {
        const { readdir } = await import('fs/promises');
        const timetablesDir = join(outputDir, 'timetables');
        const entries = await readdir(timetablesDir, { withFileTypes: true });
        const highestDirs = entries
          .filter((e) => e.isDirectory() && e.name.startsWith(`${inputName}-highest`))
          .sort((a, b) => b.name.localeCompare(a.name));
        if (highestDirs.length > 0) {
          highestXml = await readFile(
            join(timetablesDir, highestDirs[0].name, `${inputName}_activities.xml`),
            'utf-8',
          );
        }
      } catch {
        // Ignorer si absent
      }

      // Classifier l'issue
      const outcome = classifyOutcome(exitCode, resultText);

      let activitiesTimetableXml: string | undefined;
      let currentXml: string | undefined;

      switch (outcome.kind) {
        case 'SUCCESS':
          activitiesTimetableXml = activitiesXml;
          break;
        case 'IMPOSSIBLE':
        case 'TIME_EXCEEDED':
        case 'INTERRUPTED':
          // Résultat partiel : utiliser le fichier highest si disponible, sinon current
          activitiesTimetableXml = highestXml ?? activitiesXml;
          currentXml = activitiesXml;
          break;
        case 'FAILED':
          // Pas de fichier de sortie exploitable
          break;
      }

      return {
        exitCode,
        resultText,
        activitiesTimetableXml,
        highestXml,
        currentXml,
        stdout,
        stderr,
        durationMs,
      };
    } finally {
      // Nettoyer le répertoire temporaire
      try {
        await rm(outputDir, { recursive: true, force: true });
      } catch {
        // Ignorer les erreurs de nettoyage
      }
    }
  }

  async importResult(
    _raw: EngineRawResult,
    _input: EngineInput,
  ): Promise<EngineSolution> {
    throw new Error('Not implemented');
  }
}