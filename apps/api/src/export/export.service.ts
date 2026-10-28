// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des jobs d'export asynchrones (L6-04)
// Création, lecture et téléchargement des ExportJob, enfilement pg-boss.
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, JobStatut, ExportFormat, ExportMode, GrilleAffichage } from '@takt/db';
import { FilestoreService } from '../filestore/filestore.service.js';
import { SecurityEventService } from '../common/services/security-event.service.js';
import {
  CreateExportDto,
  ExportJobResponseDto,
  PaginatedExportJobsDto,
} from './dto/index.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
import { Inject } from '@nestjs/common';
import type { PgBoss as PgBossType } from 'pg-boss';

const EXPORT_JOB_QUEUE = 'export';
const MAX_EXPORT_OBJECTS = 5000;

interface CurrentUserDto {
  id: string;
  role: string;
  departments?: string[];
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filestore: FilestoreService,
    private readonly securityEvent: SecurityEventService,
    @Inject('BOSS') private readonly boss: PgBossType,
  ) {}

  async create(
    dto: CreateExportDto,
    currentUser: CurrentUserDto,
  ): Promise<ExportJobResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: dto.versionId },
      include: { avertissementsAcceptes: true },
    });
    if (!version) {
      throw new NotFoundException(`Version introuvable : ${dto.versionId}`);
    }

    const versionStatut = version.statut as string;
    if (dto.mode === ExportMode.OFFICIEL) {
      if (versionStatut !== 'PUBLIEE' && versionStatut !== 'ARCHIVEE') {
        throw new BadRequestException(
          'L export officiel nécessite une version PUBLIEE ou ARCHIVEE (422).',
        );
      }
    } else if (dto.mode === ExportMode.BROUILLON) {
      if (versionStatut === 'PUBLIEE' || versionStatut === 'ARCHIVEE') {
        throw new BadRequestException(
          'L export brouillon est refusé sur une version PUBLIEE ou ARCHIVEE (422).',
        );
      }
    }

    // --- L6-05 : résolution de la grille effective + validation des avertissements ---
    const grilleEffective: GrilleAffichage =
      dto.grille ??
      (dto.mode === ExportMode.OFFICIEL && version.grilleFigée
        ? version.grilleFigée
        : GrilleAffichage.NORMALE);

    let avertissementIds: string[] = [];
    if (dto.avertissementsAcceptes && dto.avertissementsAcceptes.length > 0) {
      const accepteIds = new Set(
        version.avertissementsAcceptes.map((a) => a.id),
      );
      for (const id of dto.avertissementsAcceptes) {
        if (!accepteIds.has(id)) {
          throw new BadRequestException(
            `Avertissement ${id} introuvable, ne appartient pas à cette version ou est caduc (422).`,
          );
        }
        const accepte = version.avertissementsAcceptes.find((a) => a.id === id);
        if (accepte!.caduqueLe !== null) {
          throw new BadRequestException(
            `Avertissement ${id} est caduc (422).`,
          );
        }
      }
      avertissementIds = dto.avertissementsAcceptes;
    }

    const objetCount = this.countExportObjects(dto.parametres);
    if (objetCount > MAX_EXPORT_OBJECTS) {
      throw new BadRequestException(
        `Périmètre trop grand : ${objetCount} objets (max ${MAX_EXPORT_OBJECTS}).`,
      );
    }

    // --- L6-08 : RBAC Responsable sur export des charges (CSV) ---
    // Le Responsable ne peut exporter que son propre département.
    if (
      dto.format === ExportFormat.CSV &&
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments
    ) {
      const departementIds = (dto.parametres.departementIds as string[]) ?? [];
      const allowed = new Set(currentUser.departments);
      const horsPerimetre = departementIds.filter((d) => !allowed.has(d));
      if (horsPerimetre.length > 0) {
        throw new BadRequestException(
          `Departement(s) hors perimetre : ${horsPerimetre.join(', ')}. Le Responsable ne peut exporter que son propre departement.`,
        );
      }
      // Si aucun departement n'est specifie, restreindre a celui du Responsable.
      if (departementIds.length === 0) {
        (dto.parametres as Record<string, unknown>).departementIds = [
          ...currentUser.departments,
        ];
      }
    }

    let styleId = dto.styleId;
    let styleVersion: number | undefined;
    if (!styleId) {
      const defaultStyle = await this.prisma.exportStyle.findFirst({
        where: { actif: true },
        orderBy: { styleVersion: 'desc' },
      });
      if (!defaultStyle) {
        throw new NotFoundException('Aucun style d export actif trouvé.');
      }
      styleId = defaultStyle.id;
      styleVersion = defaultStyle.styleVersion;
    } else {
      const style = await this.prisma.exportStyle.findUnique({
        where: { id: styleId },
      });
      if (!style) {
        throw new NotFoundException(`Style d export introuvable : ${styleId}`);
      }
      styleVersion = style.styleVersion;
    }

    let viewId = dto.viewId;
    let viewVersion: number | undefined;
    if (!viewId) {
      const defaultView = await this.prisma.exportView.findFirst({
        where: { actif: true },
        orderBy: { viewVersion: 'desc' },
      });
      if (!defaultView) {
        throw new NotFoundException('Aucune vue d export active trouvée.');
      }
      viewId = defaultView.id;
      viewVersion = defaultView.viewVersion;
    } else {
      const view = await this.prisma.exportView.findUnique({
        where: { id: viewId },
      });
      if (!view) {
        throw new NotFoundException(`Vue d export introuvable : ${viewId}`);
      }
      viewVersion = view.viewVersion;
    }

    const exportJob = await this.prisma.exportJob.create({
      data: {
        versionId: dto.versionId,
        styleId,
        viewId,
        auteurId: currentUser.id,
        format: dto.format,
        mode: dto.mode,
        grille: grilleEffective,
        avertissementIds,
        parametres: dto.parametres as Prisma.InputJsonValue,
        statut: JobStatut.QUEUED,
      },
      include: { style: true, view: true },
    });

    await this.boss.send(EXPORT_JOB_QUEUE, {
      exportJobId: exportJob.id,
      mode: dto.mode,
      grille: grilleEffective,
      avertissementIds,
      numeroVersion: version.numero,
      publieLe: version.publieLe ?? null,
    }, {
      retryDelay: 30_000,
      retryBackoff: true,
      expireInSeconds: 600,
    });

    this.logger.log(
      `ExportJob créé : id=${exportJob.id} versionId=${dto.versionId} format=${dto.format} mode=${dto.mode}`,
    );

    return this.toDto(exportJob, styleVersion, viewVersion);
  }

  async findAll(
    query: ExportQueryDto,
    currentUser: CurrentUserDto,
  ): Promise<PaginatedExportJobsDto> {
    const { page = 1, limit = 10, statut, format, mode, versionId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExportJobWhereInput = {};
    if (statut) where.statut = statut;
    if (format) where.format = format;
    if (mode) where.mode = mode;
    if (versionId) where.versionId = versionId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exportJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { style: true, view: true },
      }),
      this.prisma.exportJob.count({ where }),
    ]);

    return {
      data: items.map((job) =>
        this.toDto(job, job.style?.styleVersion, job.view?.viewVersion),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    id: string,
    currentUser: CurrentUserDto,
  ): Promise<ExportJobResponseDto> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id },
      include: { style: true, view: true, version: true },
    });
    if (!job) {
      throw new NotFoundException(`ExportJob introuvable : ${id}`);
    }

    return this.toDto(job, job.style?.styleVersion, job.view?.viewVersion);
  }

  async download(
    id: string,
    currentUser: CurrentUserDto,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id },
      include: { version: true },
    });
    if (!job) {
      throw new NotFoundException(`ExportJob introuvable : ${id}`);
    }

    if (job.statut !== JobStatut.SUCCEEDED || !job.storageKey) {
      throw new ConflictException(
        `L export n est pas encore terminé (statut actuel : ${job.statut}).`,
      );
    }

    await this.securityEvent.log({
      type: 'EXPORT_ACCESS',
      userId: currentUser.id,
      details: {
        exportJobId: id,
        versionId: job.versionId,
        format: job.format,
        mode: job.mode,
        storageKey: job.storageKey,
      },
    });

    const downloadUrl = `/filestore/${job.storageKey}`;
    return {
      downloadUrl,
      expiresIn: 3600,
    };
  }

  async fail(exportJobId: string, erreur: string): Promise<void> {
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        statut: JobStatut.FAILED,
        erreur,
        finishedAt: new Date(),
      },
    });
    this.logger.error(`ExportJob échoué : id=${exportJobId} erreur=${erreur}`);
  }

  async complete(
    exportJobId: string,
    storageKey: string,
    sha256: string,
  ): Promise<void> {
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        statut: JobStatut.SUCCEEDED,
        storageKey,
        sha256,
        finishedAt: new Date(),
      },
    });
    this.logger.log(
      `ExportJob terminé : id=${exportJobId} storageKey=${storageKey}`,
    );
  }

  private countExportObjects(parametres: Record<string, unknown>): number {
    let count = 0;
    for (const value of Object.values(parametres)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value && typeof value === 'object') {
        count += this.countExportObjects(value as Record<string, unknown>);
      } else if (value !== null && value !== undefined) {
        count += 1;
      }
    }
    return count;
  }

  private toDto(
    job: Prisma.ExportJobGetPayload<{
      include: { style: true; view: true };
    }>,
    styleVersion?: number,
    viewVersion?: number,
  ): ExportJobResponseDto {
    return {
      id: job.id,
      versionId: job.versionId,
      styleId: job.styleId,
      viewId: job.viewId,
      auteurId: job.auteurId,
      format: job.format as ExportFormat,
      mode: job.mode as ExportMode,
      grille: job.grille as GrilleAffichage,
      grilleEffective: job.grille as GrilleAffichage,
      parametres: job.parametres as Record<string, unknown>,
      statut: job.statut as JobStatut,
      storageKey: job.storageKey ?? undefined,
      sha256: job.sha256 ?? undefined,
      erreur: job.erreur ?? undefined,
      avertissementsAcceptes: job.avertissementIds ?? [],
      styleVersion,
      viewVersion,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt ?? undefined,
    };
  }
}
