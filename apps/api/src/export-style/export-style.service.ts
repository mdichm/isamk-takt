// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service ExportStyle (L6-02)
// Gestion des modèles visuels d'export versionnés et immuables une fois utilisés.
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FilestoreService } from '../filestore/filestore.service.js';
import { RoleCode, Prisma } from '@takt/db';
import { existsSync, readFileSync } from 'fs';
import {
  CreateExportStyleDto,
  UpdateExportStyleDto,
  ExportStyleResponseDto,
  PaginatedExportStylesDto,
} from './dto/index.js';
import { ExportStyleQueryDto } from './dto/export-style-query.dto.js';

const DEFAULT_STYLE_CODE = 'DEFAULT';
const DEFAULT_STYLE_LIBELLE = 'Style par défaut';
const DEFAULT_LOGO_NAME = 'TAKT_logo_monochrome_deep.svg';

@Injectable()
export class ExportStyleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filestore: FilestoreService,
  ) {}

  async ensureDefaultStyle(): Promise<ExportStyleResponseDto> {
    const existing = await this.prisma.exportStyle.findFirst({
      where: { code: DEFAULT_STYLE_CODE },
    });
    if (existing) {
      return this.toDto(existing);
    }

    const logoBuffer = this.loadDefaultLogo();
    const { storageKey, sha256 } = this.filestore.storeFile(
      logoBuffer,
      DEFAULT_LOGO_NAME,
    );

    const style = await this.prisma.exportStyle.create({
      data: {
        code: DEFAULT_STYLE_CODE,
        styleVersion: 1,
        libelle: DEFAULT_STYLE_LIBELLE,
        actif: true,
        config: {
          logo: {
            storageKey,
            sha256,
            originalName: DEFAULT_LOGO_NAME,
          },
          entete: {
            texte: 'TAKT — Export officiel',
            aligne: 'centre',
          },
          piedDePage: {
            texte: 'Généré par TAKT le {{date}}',
            aligne: 'centre',
          },
          orientation: 'portrait',
          format: 'A4',
          elementsAffiches: ['logo', 'entete', 'piedDePage', 'grille', 'seances'],
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toDto(style);
  }

  async findAll(
    query: ExportStyleQueryDto,
  ): Promise<PaginatedExportStylesDto> {
    const { page = 1, limit = 10, code, libelle, actif } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (code) where.code = { contains: code, mode: 'insensitive' };
    if (libelle) where.libelle = { contains: libelle, mode: 'insensitive' };
    if (actif !== undefined) where.actif = actif;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exportStyle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exportStyle.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ExportStyleResponseDto> {
    const style = await this.prisma.exportStyle.findUnique({ where: { id } });
    if (!style) {
      throw new NotFoundException(`ExportStyle introuvable : ${id}`);
    }
    return this.toDto(style);
  }

  async create(
    dto: CreateExportStyleDto,
    auteurId: string,
    auteurRole: string,
  ): Promise<ExportStyleResponseDto> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR) {
      throw new ForbiddenException(
        'Création d\'ExportStyle réservée à l\'Administrateur',
      );
    }

    const version = dto.styleVersion ?? 1;
    const existing = await this.prisma.exportStyle.findFirst({
      where: { code: dto.code, styleVersion: version },
    });
    if (existing) {
      throw new BadRequestException(
        `Un style avec le code "${dto.code}" et la version ${version} existe déjà.`,
      );
    }

    const style = await this.prisma.exportStyle.create({
      data: {
        code: dto.code,
        styleVersion: version,
        libelle: dto.libelle,
        actif: dto.actif ?? true,
        config: dto.config as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toDto(style);
  }

  async update(
    id: string,
    dto: UpdateExportStyleDto,
    auteurId: string,
    auteurRole: string,
  ): Promise<ExportStyleResponseDto> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR) {
      throw new ForbiddenException(
        'Modification d\'ExportStyle réservée à l\'Administrateur',
      );
    }

    const existing = await this.prisma.exportStyle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`ExportStyle introuvable : ${id}`);
    }

    if (existing.utiliseLe !== null) {
      const newStyle = await this.prisma.exportStyle.create({
        data: {
          code: existing.code,
          styleVersion: existing.styleVersion + 1,
          libelle: dto.libelle ?? existing.libelle,
          actif: dto.actif ?? existing.actif,
          config: (dto.config ?? existing.config) as unknown as Prisma.InputJsonValue,
        },
      });
      return this.toDto(newStyle);
    }

    const updated = await this.prisma.exportStyle.update({
      where: { id },
      data: {
        ...(dto.libelle !== undefined && { libelle: dto.libelle }),
        ...(dto.config !== undefined && {
          config: dto.config as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.actif !== undefined && { actif: dto.actif }),
      },
    });
    return this.toDto(updated);
  }

  async remove(id: string, auteurRole: string): Promise<void> {
    if (auteurRole !== RoleCode.ADMINISTRATEUR) {
      throw new ForbiddenException(
        'Suppression d\'ExportStyle réservée à l\'Administrateur',
      );
    }

    const existing = await this.prisma.exportStyle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`ExportStyle introuvable : ${id}`);
    }

    if (existing.utiliseLe !== null) {
      throw new BadRequestException(
        'Un style déjà utilisé ne peut pas être supprimé (CONFIG_IN_USE).',
      );
    }

    await this.prisma.exportStyle.delete({ where: { id } });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.exportStyle.update({
      where: { id },
      data: { utiliseLe: new Date() },
    });
  }

  private toDto(style: Prisma.ExportStyleGetPayload<{}>): ExportStyleResponseDto {
    return {
      id: style.id,
      code: style.code,
      styleVersion: style.styleVersion,
      libelle: style.libelle,
      config: style.config as Record<string, unknown>,
      actif: style.actif,
      utiliseLe: style.utiliseLe ?? undefined,
      createdAt: style.createdAt,
      updatedAt: style.updatedAt,
    };
  }

  private loadDefaultLogo(): Buffer {
    const possiblePaths = [
      '/app/apps/web/public/logo/TAKT_logo_monochrome_deep.svg',
      '/home/mehdi/dev/isamk-takt/apps/web/public/logo/TAKT_logo_monochrome_deep.svg',
      './apps/web/public/logo/TAKT_logo_monochrome_deep.svg',
    ];
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return readFileSync(path);
      }
    }
    return Buffer.from('');
  }
}