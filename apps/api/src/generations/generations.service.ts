// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de générations (L4-15 + L4-18)
// Suivi, annulation, fichier moteur, SSE, comparaison.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { GenerationStatut } from '@takt/db';
import type {
  Generation,
  GenerationSeance,
  VersionSnapshot,
  VerrouSeance,
  Conflit,
} from '@takt/db';
import type { GenerationDetailResponseDto } from './dto/generation-detail-response.dto.js';
import type { CancelGenerationResponseDto } from './dto/cancel-generation-response.dto.js';
import type { EngineFileResponseDto } from './dto/engine-file-response.dto.js';
import type {
  CompareResponseDto,
  GenerationSummaryDto,
  ChangementSeanceDto,
  SeanceValeurDto,
  ConflitDiffDto,
  VerrouDiffDto,
} from './dto/compare-response.dto.js';

// Durée de validité de l'URL signée (5 minutes)
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

// Intervalle de polling SSE (2 secondes)
const SSE_POLL_INTERVAL_MS = 2000;

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
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================================
  // Suivi des générations (L4-15)
  // ============================================================================

  async getGenerationDetail(generationId: string): Promise<GenerationDetailResponseDto> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      include: { fichierMoteur: true },
    });

    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }

    const startedAt = generation.startedAt ?? null;
    const finishedAt = generation.finishedAt ?? null;
    let durationSeconds: number | null = null;
    if (startedAt && finishedAt) {
      durationSeconds = (finishedAt.getTime() - startedAt.getTime()) / 1000;
    }

    const fichierMoteur = generation.fichierMoteur
      ? {
          sha256: generation.fichierMoteur.sha256,
          engineVersion: generation.fichierMoteur.engineVersion,
          downloadUrl: undefined,
          createdAt: generation.fichierMoteur.createdAt,
        }
      : null;

    const creationAt = (generation as unknown as { createdAt: Date }).createdAt;

    return {
      id: generation.id,
      versionId: generation.versionId,
      semestreId: generation.semestreId,
      statut: generation.statut,
      startedAt,
      finishedAt,
      durationSeconds,
      erreur: generation.erreur,
      metrics: (generation.metrics as Record<string, unknown> | null) ?? null,
      cancelRequested: generation.cancelRequested,
      fichierMoteur,
      queuedAt: generation.queuedAt,
      createdAt: creationAt,
    };
  }

  async cancelGeneration(generationId: string): Promise<CancelGenerationResponseDto> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      select: { id: true, statut: true, cancelRequested: true },
    });

    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }

    const terminalStatuts: GenerationStatut[] = [
      GenerationStatut.SUCCEEDED,
      GenerationStatut.SUCCEEDED_WITH_WARNINGS,
      GenerationStatut.FAILED,
      GenerationStatut.CANCELLED,
      GenerationStatut.TIMED_OUT,
    ];
    if (terminalStatuts.includes(generation.statut as GenerationStatut)) {
      throw new BadRequestException(
        `Génération "${generationId}" déjà terminée, annulation impossible`,
      );
    }

    if (generation.cancelRequested) {
      throw new BadRequestException(
        `Annulation déjà demandée pour la génération "${generationId}"`,
      );
    }

    await this.prisma.generation.update({
      where: { id: generationId },
      data: { cancelRequested: true },
    });

    return {
      generationId,
      cancelRequested: true,
      message: `Annulation demandée pour la génération "${generationId}"`,
    };
  }

  async getEngineFileInfo(generationId: string): Promise<EngineFileResponseDto> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      select: {
        id: true,
        fichierMoteur: {
          select: { sha256: true, engineVersion: true, createdAt: true },
        },
      },
    });

    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }

    if (!generation.fichierMoteur) {
      throw new NotFoundException(
        `Aucun fichier moteur pour la génération "${generationId}"`,
      );
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new BadRequestException('Configuration JWT manquante');
    }

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_MS);

    const token = this.jwtService.sign(
      {
        generationId,
        type: 'engine-file-download',
      },
      {
        secret: jwtSecret,
        expiresIn: SIGNED_URL_TTL_MS,
      },
    );

    const downloadUrl = `/api/generations/${generationId}/engine-file/download?token=${token}`;

    return {
      generationId: generation.id,
      downloadUrl,
      sha256: generation.fichierMoteur.sha256,
      engineVersion: generation.fichierMoteur.engineVersion,
      expiresAt,
    };
  }

  verifyDownloadToken(token: string): { generationId: string } {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new BadRequestException('Configuration JWT manquante');
    }

    const payload = this.jwtService.verify<{ generationId: string; type: string }>(
      token,
      {
        secret: jwtSecret,
      },
    );

    if (payload.type !== 'engine-file-download') {
      throw new BadRequestException('Type de token invalide');
    }

    return { generationId: payload.generationId };
  }

  async *streamGenerationEvents(
    generationId: string,
  ): AsyncGenerator<string, void, unknown> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      select: { id: true, statut: true },
    });
    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }

    let lastStatut = generation.statut;
    let lastMetrics: Record<string, unknown> | null = null;

    yield this.formatSseEvent('status', {
      generationId,
      statut: generation.statut,
    });

    while (true) {
      const current = await this.prisma.generation.findUnique({
        where: { id: generationId },
        select: { statut: true, metrics: true, cancelRequested: true },
      });

      if (!current) {
        yield this.formatSseEvent('error', { message: 'Génération introuvable' });
        return;
      }

      if (current.statut !== lastStatut) {
        yield this.formatSseEvent('status', {
          generationId,
          statut: current.statut,
          cancelRequested: current.cancelRequested,
        });
        lastStatut = current.statut;

        const terminalStatuts: GenerationStatut[] = [
          GenerationStatut.SUCCEEDED,
          GenerationStatut.SUCCEEDED_WITH_WARNINGS,
          GenerationStatut.FAILED,
          GenerationStatut.CANCELLED,
          GenerationStatut.TIMED_OUT,
        ];
        if (terminalStatuts.includes(current.statut as GenerationStatut)) {
          yield this.formatSseEvent('done', {
            generationId,
            statut: current.statut,
          });
          return;
        }
      }

      const currentMetrics = current.metrics as Record<string, unknown> | null;
      if (currentMetrics && JSON.stringify(currentMetrics) !== JSON.stringify(lastMetrics)) {
        yield this.formatSseEvent('progress', {
          generationId,
          metrics: currentMetrics,
        });
        lastMetrics = currentMetrics;
      }

      await new Promise((resolve) => setTimeout(resolve, SSE_POLL_INTERVAL_MS));
    }
  }

  private formatSseEvent(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  // ============================================================================
  // Comparaison de générations (L4-18)
  // ============================================================================

  async compare(ids: string[]): Promise<CompareResponseDto> {
    if (ids.length < 2 || ids.length > 4) {
      throw new UnprocessableEntityException(
        'Entre 2 et 4 identifiants de génération sont requis',
      );
    }

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

    this.verifySameSnapshots(generations);

    const generationSummaries = generations.map((g) =>
      this.buildGenerationSummary(g),
    );

    const seancesByGeneration = generations.map((g) =>
      new Map(
        g.seances.map((s) => [`${s.affectationKey}#${s.rang}`, s] as [SeanceKey, GenerationSeance]),
      ),
    );

    const allKeys = new Set<SeanceKey>();
    for (const map of seancesByGeneration) {
      for (const key of map.keys()) {
        allKeys.add(key);
      }
    }

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
          jour: s.jour,
          creneauDebutId: s.creneauDebutId,
          salleId: s.salleId,
          enseignantId: s.enseignantId,
        };
      });

      const first = placements[0];
      const identique = placements.every(
        (p) =>
          p.jour === first.jour &&
          p.creneauDebutId === first.creneauDebutId &&
          p.salleId === first.salleId &&
          p.enseignantId === first.enseignantId,
      );

      if (identique) {
        seancesIdentiques.push(key);
      } else {
        seancesDifferentes.push(key);
        changements.push(this.buildChangement(key, generations, seancesByGeneration));
      }
    }

    const conflitDiff = await this.computeConflitDiff(generations);
    const verrouDiff = await this.computeVerrouDiff(generations, seancesByGeneration);

    return {
      generations: generationSummaries,
      seancesIdentiques,
      seancesDifferentes,
      changements,
      conflitDiff,
      verrouDiff,
    };
  }

  private verifySameSnapshots(
    generations: (Generation & { version: { id: string } & { snapshots: VersionSnapshot[] } })[],
  ): void {
    const snapshotSets = generations.map((g) =>
      new Set(g.version.snapshots.map((s) => s.signature)),
    );
    const ref = snapshotSets[0];
    for (let i = 1; i < snapshotSets.length; i++) {
      if (ref.size !== snapshotSets[i].size || [...ref].some((s) => !snapshotSets[i].has(s))) {
        throw new UnprocessableEntityException(
          'Les versions ne partagent pas les mêmes snapshots',
        );
      }
    }
  }

  private buildGenerationSummary(
    g: Generation & { version: { id: string; nom: string } },
  ): GenerationSummaryDto {
    return {
      generationId: g.id,
      versionId: g.version.id,
      versionNom: g.version.nom,
      statut: g.statut,
      score: g.metrics?.score ?? null,
      classement: g.metrics?.classement ?? null,
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
