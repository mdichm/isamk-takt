// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service ExportView (L6-03)
// Gestion des configurations de vue d'export versionnées et immuables une fois utilisées.
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoleCode, Prisma, ExportFormat } from '@takt/db';
import {
  CreateExportViewDto,
  UpdateExportViewDto,
  ExportViewResponseDto,
  PaginatedExportViewsDto,
} from './dto/index.js';
import { ExportViewQueryDto } from './dto/export-view-query.dto.js';

const DEFAULT_VIEWS = [
  {
    code: 'GROUPE',
    libelle: 'Vue Groupe',
    vue: 'groupe',
    format: 'PDF',
    config: { colonnes: ['nom', 'effectif', 'niveau'], ordre: 'asc', feuilles: ['groupes'], regroupements: [] },
  },
  {
    code: 'ENSEIGNANT',
    libelle: 'Vue Enseignant',
    vue: 'enseignant',
    format: 'PDF',
    config: { colonnes: ['nom', 'prenom', 'departement', 'charge'], ordre: 'asc', feuilles: ['enseignants'], regroupements: [] },
  },
  {
    code: 'SALLE',
    libelle: 'Vue Salle',
    vue: 'salle',
    format: 'PDF',
    config: { colonnes: ['nom', 'capacite', 'batiment'], ordre: 'asc', feuilles: ['salles'], regroupements: [] },
  },
  {
    code: 'FORMATION',
    libelle: 'Vue Formation',
    vue: 'formation',
    format: 'PDF',
    config: { colonnes: ['nom', 'niveau', 'effectif'], ordre: 'asc', feuilles: ['formations'], regroupements: [] },
  },
  {
    code: 'DEPARTEMENT',
    libelle: 'Vue Département',
    vue: 'departement',
    format: 'PDF',
    config: { colonnes: ['nom', 'chefDeDepartement', 'effectif'], ordre: 'asc', feuilles: ['departements'], regroupements: [] },
  },
  {
    code: 'GLOBALE',
    libelle: 'Vue Globale',
    vue: 'globale',
    format: 'PDF',
    config: { colonnes: ['indicateur', 'valeur'], ordre: 'asc', feuilles: ['synthese'], regroupements: [] },
  },
  {
    code: 'CHARGES',
    libelle: 'Vue Charges',
    vue: 'charges',
    format: 'PDF',
    config: { colonnes: ['enseignant', 'chargeTheorique', 'chargeReelle'], ordre: 'asc', feuilles: ['charges'], regroupements: [] },
  },
];

@Injectable()
export class ExportViewService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultViews(): Promise<void> {
    for (const viewDef of DEFAULT_VIEWS) {
      const existing = await this.prisma.exportView.findFirst({
        where: { code: viewDef.code },
      });
      if (!existing) {
        await this.prisma.exportView.create({
          data: {
            code: viewDef.code,
            viewVersion: 1,
            libelle: viewDef.libelle,
            vue: viewDef.vue,
            format: viewDef.format as ExportFormat,
            actif: true,
            config: viewDef.config as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  async findAll(
    query: ExportViewQueryDto,
  ): Promise<PaginatedExportViewsDto> {
    const { page = 1, limit = 10, code, libelle, vue, format, actif } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExportViewWhereInput = {};
    if (code) where.code = { contains: code, mode: 'insensitive' };
    if (libelle) where.libelle = { contains: libelle, mode: 'insensitive' };
    if (vue) where.vue = { contains: vue, mode: 'insensitive' };
    if (format) where.format = format as ExportFormat;
    if (actif !== undefined) where.actif = actif;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exportView.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exportView.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ExportViewResponseDto> {
    const view = await this.prisma.exportView.findUnique({ where: { id } });
    if (!view) {
      throw new NotFoundException(`ExportView introuvable : ${id}`);
    }
    return this.toDto(view);
  }

  async create(
    dto: CreateExportViewDto,
    auteurId: string,
    auteurRole: string,
  ): Promise<ExportViewResponseDto> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR && auteurRole !== RoleCode.GESTIONNAIRE) {
      throw new ForbiddenException(
        'Création d\'ExportView réservée à l\'Administrateur et au Gestionnaire',
      );
    }

    const version = dto.viewVersion ?? 1;
    const existing = await this.prisma.exportView.findFirst({
      where: { code: dto.code, viewVersion: version },
    });
    if (existing) {
      throw new BadRequestException(
        `Une vue avec le code "${dto.code}" et la version ${version} existe déjà.`,
      );
    }

    const view = await this.prisma.exportView.create({
      data: {
        code: dto.code,
        viewVersion: version,
        libelle: dto.libelle,
        vue: dto.vue,
        format: dto.format,
        actif: dto.actif ?? true,
        config: dto.config as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toDto(view);
  }

  async update(
    id: string,
    dto: UpdateExportViewDto,
    auteurId: string,
    auteurRole: string,
  ): Promise<ExportViewResponseDto> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR && auteurRole !== RoleCode.GESTIONNAIRE) {
      throw new ForbiddenException(
        'Modification d\'ExportView réservée à l\'Administrateur et au Gestionnaire',
      );
    }

    const existing = await this.prisma.exportView.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`ExportView introuvable : ${id}`);
    }

    if (existing.utiliseLe !== null) {
      const newView = await this.prisma.exportView.create({
        data: {
          code: existing.code,
          viewVersion: existing.viewVersion + 1,
          libelle: dto.libelle ?? existing.libelle,
          vue: dto.vue ?? existing.vue,
          format: dto.format ?? existing.format,
          actif: dto.actif ?? existing.actif,
          config: (dto.config ?? existing.config) as unknown as Prisma.InputJsonValue,
        },
      });
      return this.toDto(newView);
    }

    const updated = await this.prisma.exportView.update({
      where: { id },
      data: {
        ...(dto.libelle !== undefined && { libelle: dto.libelle }),
        ...(dto.vue !== undefined && { vue: dto.vue }),
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.config !== undefined && {
          config: dto.config as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.actif !== undefined && { actif: dto.actif }),
      },
    });
    return this.toDto(updated);
  }

  async remove(id: string, auteurRole: string): Promise<void> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR && auteurRole !== RoleCode.GESTIONNAIRE) {
      throw new ForbiddenException(
        'Suppression d\'ExportView réservée à l\'Administrateur et au Gestionnaire',
      );
    }

    const existing = await this.prisma.exportView.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`ExportView introuvable : ${id}`);
    }

    if (existing.utiliseLe !== null) {
      throw new BadRequestException(
        'Une vue déjà utilisée ne peut pas être supprimée (CONFIG_IN_USE).',
      );
    }

    await this.prisma.exportView.delete({ where: { id } });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.exportView.update({
      where: { id },
      data: { utiliseLe: new Date() },
    });
  }

  private toDto(view: Prisma.ExportViewGetPayload<{}>): ExportViewResponseDto {
    return {
      id: view.id,
      code: view.code,
      viewVersion: view.viewVersion,
      libelle: view.libelle,
      vue: view.vue,
      format: view.format,
      config: view.config as Record<string, unknown>,
      actif: view.actif,
      utiliseLe: view.utiliseLe ?? undefined,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    };
  }
}