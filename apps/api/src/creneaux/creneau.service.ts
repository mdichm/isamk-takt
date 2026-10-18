import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateCreneauDto,
  UpdateCreneauDto,
  CreneauResponseDto,
  PaginatedCreneauxDto,
  CreneauQueryDto,
} from './dto/creneau.dto.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, no-restricted-imports
import { JourSemaine } from '@takt/db';

const SLOT_MINUTES = 30;

@Injectable()
export class CreneauService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Créneaux et pauses
  // ============================================

  async createCreneau(dto: CreateCreneauDto, userId: string): Promise<CreneauResponseDto> {
    // Vérification que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({ where: { id: dto.semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    // Vérification de l'unicité (semestre, jour, ordre)
    const existing = await this.prisma.creneau.findFirst({
      where: {
        semestreId: dto.semestreId,
        jour: dto.jour,
        ordre: dto.ordre,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un créneau existe déjà pour le jour ${dto.jour} à l'ordre ${dto.ordre} dans ce semestre`,
      );
    }

    // Vérification de la durée de 30 minutes côté application (défense en plus du CHECK SQL)
    const debut = new Date(`1970-01-01T${dto.heureDebut}Z`);
    const fin = new Date(`1970-01-01T${dto.heureFin}Z`);
    const diffMinutes = (fin.getTime() - debut.getTime()) / (1000 * 60);
    if (diffMinutes !== SLOT_MINUTES) {
      throw new BadRequestException(
        `La durée du créneau doit être de exactement ${SLOT_MINUTES} minutes`,
      );
    }

    // Vérification qu'un créneau ne chevauche pas un autre sur le même jour/semestre
    const jourCreneaux = await this.prisma.creneau.findMany({
      where: {
        semestreId: dto.semestreId,
        jour: dto.jour,
        estActive: true,
      },
    });
    for (const c of jourCreneaux) {
      const cDebut = c.heureDebut;
      const cFin = c.heureFin;
      if (
        new Date(`1970-01-01T${dto.heureDebut}Z`) < cFin &&
        new Date(`1970-01-01T${dto.heureFin}Z`) > cDebut
      ) {
        throw new ConflictException(
          `Le créneau chevauche un créneau existant (ordre ${c.ordre}, ${c.heureDebut} - ${c.heureFin})`,
        );
      }
    }

    const creneau = await this.audit.auditTransaction(
      async (tx) => {
        return tx.creneau.create({
          data: {
            semestreId: dto.semestreId,
            jour: dto.jour,
            ordre: dto.ordre,
            heureDebut: new Date(`1970-01-01T${dto.heureDebut}Z`),
            heureFin: new Date(`1970-01-01T${dto.heureFin}Z`),
            estPause: dto.estPause ?? false,
            estActive: true,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Creneau',
        motif: `Création créneau ${dto.jour} ordre ${dto.ordre}`,
      },
    );

    return this.toCreneauDto(creneau);
  }

  async findAllCreneaux(query: CreneauQueryDto): Promise<PaginatedCreneauxDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.semestreId) where.semestreId = query.semestreId;
    if (query.jour !== undefined) where.jour = query.jour;
    if (query.estPause !== undefined) where.estPause = query.estPause;
    if (query.estActive !== undefined) where.estActive = query.estActive;

    const [creneaux, total] = await Promise.all([
      this.prisma.creneau.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ jour: 'asc' }, { ordre: 'asc' }],
      }),
      this.prisma.creneau.count({ where }),
    ]);

    return {
      data: creneaux.map(this.toCreneauDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCreneauById(id: string): Promise<CreneauResponseDto> {
    const creneau = await this.prisma.creneau.findUnique({ where: { id } });
    if (!creneau) {
      throw new NotFoundException('Créneau introuvable');
    }
    return this.toCreneauDto(creneau);
  }

  async updateCreneau(
    id: string,
    dto: UpdateCreneauDto,
    userId: string,
  ): Promise<CreneauResponseDto> {
    const existing = await this.prisma.creneau.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Créneau introuvable');
    }

    // Si on change l'ordre, vérifier l'unicité (semestre, jour, ordre)
    if (dto.ordre !== undefined && dto.ordre !== existing.ordre) {
      const conflit = await this.prisma.creneau.findFirst({
        where: {
          semestreId: existing.semestreId,
          jour: existing.jour,
          ordre: dto.ordre,
          id: { not: id },
        },
      });
      if (conflit) {
        throw new ConflictException(
          `Un créneau existe déjà pour le jour ${existing.jour} à l'ordre ${dto.ordre} dans ce semestre`,
        );
      }
    }

    // Vérification de la durée si heureDebut ou heureFin est modifié
    if (dto.heureDebut !== undefined || dto.heureFin !== undefined) {
      const debut = dto.heureDebut ?? existing.heureDebut.toTimeString().slice(0, 8);
      const fin = dto.heureFin ?? existing.heureFin.toTimeString().slice(0, 8);
      const d = new Date(`1970-01-01T${debut}Z`);
      const f = new Date(`1970-01-01T${fin}Z`);
      const diffMinutes = (f.getTime() - d.getTime()) / (1000 * 60);
      if (diffMinutes !== SLOT_MINUTES) {
        throw new BadRequestException(
          `La durée du créneau doit être de exactement ${SLOT_MINUTES} minutes`,
        );
      }
    }

    const creneau = await this.audit.auditTransaction(
      async (tx) => {
        return tx.creneau.update({
          where: { id },
          data: {
            ...(dto.ordre !== undefined && { ordre: dto.ordre }),
            ...(dto.heureDebut !== undefined && {
              heureDebut: new Date(`1970-01-01T${dto.heureDebut}Z`),
            }),
            ...(dto.heureFin !== undefined && {
              heureFin: new Date(`1970-01-01T${dto.heureFin}Z`),
            }),
            ...(dto.estPause !== undefined && { estPause: dto.estPause }),
            ...(dto.estActive !== undefined && { estActive: dto.estActive }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Creneau',
        objetId: id,
        motif: `Mise à jour créneau ${id}`,
      },
    );

    return this.toCreneauDto(creneau);
  }

  async removeCreneau(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.creneau.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Créneau introuvable');
    }

    // Soft delete : désactivation plutôt que suppression physique
    await this.audit.auditTransaction(
      async (tx) => {
        await tx.creneau.update({ where: { id }, data: { estActive: false } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Creneau',
        objetId: id,
        motif: `Désactivation créneau ${existing.jour} ordre ${existing.ordre}`,
      },
    );
  }

  private toCreneauDto(
    creneau: {
      id: string;
      semestreId: string;
      jour: string;
      ordre: number;
      heureDebut: Date;
      heureFin: Date;
      estPause: boolean;
      estActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): CreneauResponseDto {
    return {
      id: creneau.id,
      semestreId: creneau.semestreId,
      jour: creneau.jour as JourSemaine,
      ordre: creneau.ordre,
      heureDebut: creneau.heureDebut.toTimeString().slice(0, 8),
      heureFin: creneau.heureFin.toTimeString().slice(0, 8),
      estPause: creneau.estPause,
      estActive: creneau.estActive,
      createdAt: creneau.createdAt,
      updatedAt: creneau.updatedAt,
    };
  }
}