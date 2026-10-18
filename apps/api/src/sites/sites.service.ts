// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service du référentiel des sites (L1-14)
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  PaginatedSitesDto,
  SitesQueryDto,
  SalleParSiteQueryDto,
} from './dto/site.dto.js';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async createSite(dto: CreateSiteDto): Promise<SiteResponseDto> {
    const existingByCode = await this.prisma.site.findUnique({
      where: { code: dto.code },
    });
    if (existingByCode) {
      throw new ConflictException(`Le code de site "${dto.code}" existe déjà`);
    }

    if (dto.estPrincipal === true) {
      await this.prisma.site.updateMany({
        where: { estPrincipal: true },
        data: { estPrincipal: false },
      });
    }

    const site = await this.prisma.site.create({
      data: {
        code: dto.code,
        libelle: dto.libelle,
        estPrincipal: dto.estPrincipal ?? false,
      },
    });

    return this.toSiteDto(site);
  }

  async findAllSites(query: SitesQueryDto): Promise<PaginatedSitesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { libelle: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    if (query.estPrincipal !== undefined) {
      where.estPrincipal = query.estPrincipal;
    }

    const [sites, total] = await this.prisma.$transaction([
      this.prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: { estPrincipal: 'desc', code: 'asc' },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      data: sites.map(this.toSiteDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSiteById(id: string): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site non trouvé');
    }
    return this.toSiteDto(site);
  }

  async findSiteByCode(code: string): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findUnique({ where: { code } });
    if (!site) {
      throw new NotFoundException('Site non trouvé');
    }
    return this.toSiteDto(site);
  }

  async updateSite(id: string, dto: UpdateSiteDto): Promise<SiteResponseDto> {
    const existing = await this.prisma.site.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Site non trouvé');
    }

    if (dto.estPrincipal === true && existing.estPrincipal !== true) {
      await this.prisma.site.updateMany({
        where: { estPrincipal: true },
        data: { estPrincipal: false },
      });
    }

    const site = await this.prisma.site.update({
      where: { id },
      data: {
        ...(dto.libelle !== undefined && { libelle: dto.libelle }),
        ...(dto.estPrincipal !== undefined && { estPrincipal: dto.estPrincipal }),
      },
    });

    return this.toSiteDto(site);
  }

  async removeSite(id: string): Promise<void> {
    const existing = await this.prisma.site.findUnique({
      where: { id },
      include: { salles: true },
    });
    if (!existing) {
      throw new NotFoundException('Site non trouvé');
    }

    if (existing.salles && existing.salles.length > 0) {
      throw new ConflictException(
        `Impossible de supprimer le site "${existing.code}": des salles y sont rattachées`,
      );
    }

    await this.prisma.site.delete({ where: { id } });
  }

  async getSallesParSite(
    siteId: string,
    query: SalleParSiteQueryDto,
  ): Promise<PaginatedSitesDto & { salleCount: number }> {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException('Site non trouvé');
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const [salles, total] = await this.prisma.$transaction([
      this.prisma.salle.findMany({
        where: { siteId },
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.salle.count({ where: { siteId } }),
    ]);

    return {
      data: salles.map((s) => ({
        id: s.id,
        code: s.code,
        libelle: s.libelle,
        estPrincipal: false,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })) as SiteResponseDto[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      salleCount: total,
    };
  }

  async setSitePrincipal(id: string): Promise<SiteResponseDto> {
    const existing = await this.prisma.site.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Site non trouvé');
    }

    await this.prisma.site.updateMany({
      where: { estPrincipal: true },
      data: { estPrincipal: false },
    });

    const site = await this.prisma.site.update({
      where: { id },
      data: { estPrincipal: true },
    });

    return this.toSiteDto(site);
  }

  private toSiteDto(site: {
    id: string;
    code: string;
    libelle: string;
    estPrincipal: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SiteResponseDto {
    return {
      id: site.id,
      code: site.code,
      libelle: site.libelle,
      estPrincipal: site.estPrincipal,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  }
}