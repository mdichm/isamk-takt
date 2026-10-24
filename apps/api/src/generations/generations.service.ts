// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de comparaison de générations (L4-18)
// GET /generations/compare

import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  Generation,
  GenerationSeance,
  VersionSnapshot,
  VerrouSeance,
  Conflit,
} from '@takt/db';
import type {
  CompareResponseDto,
  GenerationSummaryDto,
  ChangementSeanceDto,
  SeanceValeurDto,
  ConflitDiffDto,
  VerrouDiffDto,
} from './dto/compare-response.dto.js';

// Clé d'appariement d'une séance générée : "affectationKey#rang"
type SeanceKey = string;

interface SeancePlacement {
  jour: string | null;
  creneauDebutId: string | null;
  salleId: string | null;
  enseignantId: string | null;
}

@Injectable()
export class GenerationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compare 2 à 4 générations entre elles.
   *
   * Règles :
   * - 400 si le nombre d'ids est hors [2, 4] ou qu'un id n'est pas un UUID (DTO).
   * - 404 si une génération est introuvable.
   * - 422 si les versions ne partagent pas les mêmes snapshots.
   * - Appariement des séances par affectationKey#rang.
   */
  async compare(ids: string[]): Promise<CompareResponseDto> {
    if (ids.length < 2 || ids.length > 4) {
      throw new UnprocessableEntityException(
        'Entre 2 et 4 identifiants de génération sont requis',
      );
    }

    // 1. Récupération des générations avec version, snapshots et séances
    const generations = await this.prisma.generation.findMany({
      where: { id: { in: ids } },
      include: {
        version: {
          include: {
            snapshots: true,
          },
        },
        seances: true,
      },
    });

    if (generations.length !== ids.length) {
      const foundIds = new Set(generations.map((g) => g.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Génération(s) introuvable(s): ${missing.join(', ')}`,
      );
    }

    // 2. Contrôle : toutes les versions doivent partager les mêmes snapshots
    this.verifySameSnapshots(generations);

    // 3. Résumé de chaque génération
    const generationSummaries = generations.map((g) =>
      this.buildGenerationSummary(g),
    );

    // 4. Appariement des séances par affectationKey#rang
    const seancesByGeneration = generations.map((g) =>
      new Map(
        g.seances.map((s) => [`${s.affectationKey}#${s.rang}`, s] as [SeanceKey, GenerationSeance]),
      ),
    );

    // 5. Toutes les clés présentes dans au moins une génération
    const allKeys = new Set<SeanceKey>();
    for (const map of seancesByGeneration) {
      for (const key of map.keys()) {
        allKeys.add(key);
      }
    }

    // 6. Classement identique / différent
    const seancesIdentiques: string[] = [];
    const seancesDifferentes: string[] = [];
    const changements: ChangementSeanceDto[] = [];

    for (const key of allKeys) {
      const placements: SeancePlacement[] = generations.map((_, i) => {
        const s = seancesByGeneration[i].get(key);
        if (!s) {
          return { jour: null, creneauDebutId: null, salleId: null, enseignantId: null };
        }
        return {
          jour: s.jour ?? null,
          creneauDebutId: s.creneauDebutId ?? null,
          salleId: s.salleId ?? null,
          enseignantId: s.enseignantId ?? null,
        };
      });

      const allPresent = placements.every(
        (p) =>
          p.jour !== null &&
          p.creneauDebutId !== null &&
          p.salleId !== null &&
          p.enseignantId !== null,
      );

      const allIdentical = placements.every(
        (p) =>
          p.jour === placements[0].jour &&
          p.creneauDebutId === placements[0].creneauDebutId &&
          p.salleId === placements[0].salleId &&
          p.enseignantId === placements[0].enseignantId,
      );

      if (allPresent && allIdentical) {
        seancesIdentiques.push(key);
      } else {
        seancesDifferentes.push(key);
        changements.push(this.buildChangement(key, generations, seancesByGeneration));
      }
    }

    // 7. Conflits : comparaison des signatures par version
    const conflits = await this.computeConflitDiff(generations);

    // 8. Verrous : respect des verrous de version par génération
    const verrous = await this.computeVerrouDiff(generations, seancesByGeneration);

    return {
      generations: generationSummaries,
      diff: {
        seancesIdentiques,
        seancesDifferentes,
        changements,
        conflits,
        verrous,
      },
    };
  }

  /* ========================================================================
   * Helpers privés
   * ======================================================================== */

  private verifySameSnapshots(
    generations: (Generation & {
      version: { snapshots: VersionSnapshot[] };
    })[],
  ): void {
    const firstSnapshots = new Set(
      generations[0].version.snapshots.map((s) => s.snapshotId),
    );
    for (let i = 1; i < generations.length; i++) {
      const snapshots = new Set(
        generations[i].version.snapshots.map((s) => s.snapshotId),
      );
      if (snapshots.size !== firstSnapshots.size) {
        throw new UnprocessableEntityException(
          'Les versions n ont pas les mêmes snapshots (422 SNAPSHOT_MISMATCH)',
        );
      }
      for (const snapshotId of firstSnapshots) {
        if (!snapshots.has(snapshotId)) {
          throw new UnprocessableEntityException(
            'Les versions n ont pas les mêmes snapshots (422 SNAPSHOT_MISMATCH)',
          );
        }
      }
    }
  }

  private buildGenerationSummary(
    g: Generation & { seances: GenerationSeance[] },
  ): GenerationSummaryDto {
    const statut = g.statut as string;
    const score = g.score ? Number(g.score) : undefined;
    const classee =
      (statut === 'SUCCEEDED' || statut === 'SUCCEEDED_WITH_WARNINGS') &&
      score !== undefined;

    let motifNonClassee: string | undefined;
    if (!classee) {
      if (statut === 'FAILED') {
        motifNonClassee = 'Génération échouée';
      } else if (statut === 'CANCELLED') {
        motifNonClassee = 'Génération annulée';
      } else if (statut === 'TIMED_OUT') {
        motifNonClassee = 'Génération expirée (timeout)';
      } else if (!score) {
        motifNonClassee = 'Aucun score disponible';
      } else {
        motifNonClassee = `Statut non final : ${statut}`;
      }
    }

    return {
      id: g.id,
      score,
      classee,
      metrics: (g.metrics as Record<string, unknown> | undefined) ?? undefined,
      motifNonClassee,
    };
  }

  private buildChangement(
    cle: SeanceKey,
    generations: (Generation & { seances: GenerationSeance[] })[],
    seancesByGeneration: Map<SeanceKey, GenerationSeance>[],
  ): ChangementSeanceDto {
    const generationValues: SeanceValeurDto[] = generations.map((g, i) => {
      const s = seancesByGeneration[i].get(cle);
      return {
        generationId: g.id,
        jour: s?.jour ?? undefined,
        creneauDebutId: s?.creneauDebutId ?? undefined,
        salleId: s?.salleId ?? undefined,
        enseignantId: s?.enseignantId ?? undefined,
      };
    });
    return { cle, generations: generationValues };
  }

  private async computeConflitDiff(
    generations: (Generation & { version: { id: string } })[],
  ): Promise<ConflitDiffDto> {
    const versionIds = generations.map((g) => g.version.id);
    const conflits = await this.prisma.conflit.findMany({
      where: { versionId: { in: versionIds } },
      select: { versionId: true, signature: true },
    });

    const signaturesByVersion = new Map<string, Set<string>>();
    for (const c of conflits) {
      if (!signaturesByVersion.has(c.versionId)) {
        signaturesByVersion.set(c.versionId, new Set());
      }
      signaturesByVersion.get(c.versionId)!.add(c.signature);
    }

    const refVersionId = generations[0].version.id;
    const refSignatures = signaturesByVersion.get(refVersionId) ?? new Set();

    const conflitsApparus: string[] = [];
    const conflitsDisparus: string[] = [];

    for (let i = 1; i < generations.length; i++) {
      const sigs = signaturesByVersion.get(generations[i].version.id) ?? new Set();
      for (const s of sigs) {
        if (!refSignatures.has(s)) {
          conflitsApparus.push(s);
        }
      }
      for (const s of refSignatures) {
        if (!sigs.has(s)) {
          conflitsDisparus.push(s);
        }
      }
    }

    return {
      conflitsApparus: [...new Set(conflitsApparus)],
      conflitsDisparus: [...new Set(conflitsDisparus)],
    };
  }

  private async computeVerrouDiff(
    generations: (Generation & {
      version: { id: string };
      seances: GenerationSeance[];
    })[],
    seancesByGeneration: Map<SeanceKey, GenerationSeance>[],
  ): Promise<VerrouDiffDto> {
    const versionIds = generations.map((g) => g.version.id);
    const verrous = await this.prisma.verrouSeance.findMany({
      where: { versionId: { in: versionIds } },
      select: {
        versionId: true,
        salleId: true,
        creneauDebutId: true,
        enseignantId: true,
      },
    });

    const verrousByVersion = new Map<string, typeof verrous>();
    for (const v of verrous) {
      if (!verrousByVersion.has(v.versionId)) {
        verrousByVersion.set(v.versionId, []);
      }
      verrousByVersion.get(v.versionId)!.push(v);
    }

    const verrousRespectes: boolean[] = generations.map((g, i) => {
      const versionVerrous = verrousByVersion.get(g.version.id) ?? [];
      if (versionVerrous.length === 0) {
        return true;
      }
      const seanceMap = seancesByGeneration[i];
      return versionVerrous.every((v) =>
        [...seanceMap.values()].some(
          (s) =>
            s.salleId === v.salleId &&
            s.creneauDebutId === v.creneauDebutId &&
            (v.enseignantId ? s.enseignantId === v.enseignantId : true),
        ),
      );
    });

    return { verrousRespectes };
  }
}