// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de suivi des générations (L4-15)
// Détail, annulation, fichier moteur (URL signée), SSE.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { GenerationStatut } from '@takt/db';
import type { GenerationDetailResponseDto } from './dto/generation-detail-response.dto.js';
import type { CancelGenerationResponseDto } from './dto/cancel-generation-response.dto.js';
import type { EngineFileResponseDto } from './dto/engine-file-response.dto.js';

// Durée de validité de l'URL signée (5 minutes)
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

// Intervalle de polling SSE (2 secondes)
const SSE_POLL_INTERVAL_MS = 2000;

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

    // createdAt est accessible via l'objet génération au runtime
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
        `Impossible d'annuler une génération déjà terminée (statut: ${generation.statut})`,
      );
    }

    if (generation.cancelRequested) {
      return {
        generationId: generation.id,
        statut: generation.statut,
        message: 'Annulation déjà demandée',
      };
    }

    await this.prisma.generation.update({
      where: { id: generationId },
      data: { cancelRequested: true },
    });

    return {
      generationId: generation.id,
      statut: generation.statut,
      message: 'Annulation demandée',
    };
  }

  async getEngineFileInfo(generationId: string): Promise<EngineFileResponseDto> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      include: { fichierMoteur: true },
    });

    if (!generation) {
      throw new NotFoundException(`Génération "${generationId}" introuvable`);
    }

    if (!generation.fichierMoteur) {
      throw new NotFoundException(
        `Aucun fichier moteur n'est associé à la génération "${generationId}"`,
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

    const payload = this.jwtService.verify<{ generationId: string; type: string }>(token, {
      secret: jwtSecret,
    });

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
}
