import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, no-restricted-imports
import { JourSemaine } from '@takt/db';
import type {
  CreateIndisponibiliteDto,
  UpdateIndisponibiliteDto,
  IndisponibiliteResponseDto,
  PaginatedIndisponibilitesDto,
  IndisponibiliteQueryDto,
} from './dto/indisponibilite.dto.js';

@Injectable()
export class IndisponibiliteService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createIndisponibilite(
    dto: CreateIndisponibiliteDto,
    userId: string,
  ): Promise<IndisponibiliteResponseDto> {
    const a = !!dto.enseignantId;
    const b = !!dto.salleId;
    if (a === b) {
      throw new BadRequestException(
        'Une indisponibilité doit cibler soit un enseignant, soit une salle (XOR), jamais les deux ni aucun.',
      );
    }

    const semestre = await this.prisma.semestre.findUnique({ where: { id: dto.semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    if (dto.enseignantId) {
      const enseignant = await this.prisma.enseignant.findUnique({
        where: { id: dto.enseignantId },
      });
      if (!enseignant) {
        throw new NotFoundException(`Enseignant "${dto.enseignantId}" introuvable`);
      }
    } else {
      const salle = await this.prisma.salle.findUnique({ where: { id: dto.salleId } });
      if (!salle) {
        throw new NotFoundException(`Salle "${dto.salleId}" introuvable`);
      }
    }

    const existing = await this.prisma.indisponibilite.findFirst({
      where: {
        semestreId: dto.semestreId,
        jour: dto.jour,
        ordre: dto.ordre,
        enseignantId: dto.enseignantId,
        salleId: dto.salleId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Une indisponibilité existe déjà pour le jour ${dto.jour} à l'ordre ${dto.ordre} sur cette cible dans ce semestre`,
      );
    }
    const indisponibilite = await this.audit.auditTransaction(
      async (tx) => {
        return tx.indisponibilite.create({
          data: {
            semestreId: dto.semestreId,
            jour: dto.jour,
            ordre: dto.ordre,
            enseignantId: dto.enseignantId ?? null,
            salleId: dto.salleId ?? null,
            estActive: true,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Indisponibilite',
        motif: `Création indisponibilité ${dto.jour} ordre ${dto.ordre}`,
      },
    );

    return this.toIndisponibiliteDto(indisponibilite);
  }

  async findAllIndisponibilites(
    query: IndisponibiliteQueryDto,
  ): Promise<PaginatedIndisponibilitesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.semestreId) {
      where.semestreId = query.semestreId;
    }
    if (query.jour !== undefined) {
      where.jour = query.jour;
    }
    if (query.enseignantId) {
      where.enseignantId = query.enseignantId;
    }
    if (query.salleId) {
      where.salleId = query.salleId;
    }
    if (query.estActive !== undefined) {
      where.estActive = query.estActive;
    }

    const [indisponibilites, total] = await Promise.all([
      this.prisma.indisponibilite.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ jour: 'asc' }, { ordre: 'asc' }],
      }),
      this.prisma.indisponibilite.count({ where }),
    ]);

    return {
      data: indisponibilites.map(this.toIndisponibiliteDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findIndisponibiliteById(id: string): Promise<IndisponibiliteResponseDto> {
    const indisponibilite = await this.prisma.indisponibilite.findUnique({
      where: { id },
    });
    if (!indisponibilite) {
      throw new NotFoundException('Indisponibilité introuvable');
    }
    return this.toIndisponibiliteDto(indisponibilite);
  }

  async updateIndisponibilite(
    id: string,
    dto: UpdateIndisponibiliteDto,
    userId: string,
  ): Promise<IndisponibiliteResponseDto> {
    const existing = await this.prisma.indisponibilite.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Indisponibilité introuvable');
    }

    if (dto.enseignantId !== undefined && dto.salleId !== undefined) {
      throw new BadRequestException(
        'Une indisponibilité doit cibler soit un enseignant, soit une salle (XOR), jamais les deux.',
      );
    }

    const enseignantId = dto.enseignantId ?? existing.enseignantId;
    const salleId = dto.salleId ?? existing.salleId;
    const jour = dto.jour ?? existing.jour;
    const ordre = dto.ordre ?? existing.ordre;

    if (
      jour !== existing.jour ||
      ordre !== existing.ordre ||
      enseignantId !== existing.enseignantId ||
      salleId !== existing.salleId
    ) {
      const conflit = await this.prisma.indisponibilite.findFirst({
        where: {
          semestreId: existing.semestreId,
          jour,
          ordre,
          enseignantId,
          salleId,
          id: { not: id },
        },
      });
      if (conflit) {
        throw new ConflictException(
          `Une indisponibilité existe déjà pour le jour ${jour} à l'ordre ${ordre} sur cette cible dans ce semestre`,
        );
      }
    }

    if (dto.enseignantId !== undefined) {
      const enseignant = await this.prisma.enseignant.findUnique({
        where: { id: dto.enseignantId },
      });
      if (!enseignant) {
        throw new NotFoundException(`Enseignant "${dto.enseignantId}" introuvable`);
      }
    }
    if (dto.salleId !== undefined) {
      const salle = await this.prisma.salle.findUnique({ where: { id: dto.salleId } });
      if (!salle) {
        throw new NotFoundException(`Salle "${dto.salleId}" introuvable`);
      }
    }

    const indisponibilite = await this.audit.auditTransaction(
      async (tx) => {
        return tx.indisponibilite.update({
          where: { id },
          data: {
            ...(dto.jour !== undefined && { jour: dto.jour }),
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
            ...(dto.enseignantId !== undefined && { enseignantId: dto.enseignantId }),
            ...(dto.salleId !== undefined && { salleId: dto.salleId }),
            ...(dto.estActive !== undefined && { estActive: dto.estActive }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Indisponibilite',
        objetId: id,
        motif: `Mise à jour indisponibilité ${id}`,
      },
    );

    return this.toIndisponibiliteDto(indisponibilite);
  }

  async removeIndisponibilite(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.indisponibilite.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Indisponibilité introuvable');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.indisponibilite.update({ where: { id }, data: { estActive: false } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Indisponibilite',
        objetId: id,
        motif: `Désactivation indisponibilité ${existing.jour} ordre ${existing.ordre}`,
      },
    );
  }

  private toIndisponibiliteDto(
    indisponibilite: {
      id: string;
      semestreId: string;
      jour: string;
      ordre: number;
      enseignantId: string | null;
      salleId: string | null;
      estActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): IndisponibiliteResponseDto {
    return {
      id: indisponibilite.id,
      semestreId: indisponibilite.semestreId,
      jour: indisponibilite.jour as JourSemaine,
      ordre: indisponibilite.ordre,
      enseignantId: indisponibilite.enseignantId ?? undefined,
      salleId: indisponibilite.salleId ?? undefined,
      estActive: indisponibilite.estActive,
      createdAt: indisponibilite.createdAt,
      updatedAt: indisponibilite.updatedAt,
    };
  }
}