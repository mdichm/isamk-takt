import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateCreneauAffichageDto,
  UpdateCreneauAffichageDto,
  CreneauAffichageResponseDto,
  CreneauxAffichageQueryDto,
  PaginatedCreneauxAffichagesDto,
  DuplicateCreneauxAffichageDto,
  DuplicateCreneauxAffichageResponseDto,
} from './dto/creneaux-affichage.dto.js';
// eslint-disable-next-line no-restricted-imports
import { GrilleAffichage } from '@takt/db';

@Injectable()
export class CreneauxAffichageService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ============================================
  // Correspondance d'affichage Ramadan (L1-22)
  // ============================================

  async create(
    dto: CreateCreneauAffichageDto,
    userId: string,
  ): Promise<CreneauAffichageResponseDto> {
    const creneau = await this.prisma.creneau.findUnique({
      where: { id: dto.creneauId },
      include: { semestre: true },
    });
    if (!creneau) {
      throw new NotFoundException(`Crenau "${dto.creneauId}" introuvable`);
    }

    if (creneau.estPause) {
      throw new ConflictException(
        `Le créneau ${creneau.jour} ordre ${creneau.ordre} est une pause et ne peut pas avoir d'affichage Ramadan`,
      );
    }

    const existing = await this.prisma.creneauAffichage.findFirst({
      where: {
        creneauId: dto.creneauId,
        grille: GrilleAffichage.RAMADAN,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un affichage Ramadan existe déjà pour le créneau ${creneau.jour} ordre ${creneau.ordre}`,
      );
    }

    await this.verifierControlesJour(creneau.semestreId, creneau.jour, dto.heureDebut, dto.heureFin);

    const affichage = await this.audit.auditTransaction(
      async (tx) => {
        return tx.creneauAffichage.create({
          data: {
            creneauId: dto.creneauId,
            grille: GrilleAffichage.RAMADAN,
            heureDebut: new Date(`1970-01-01T${dto.heureDebut}Z`),
            heureFin: new Date(`1970-01-01T${dto.heureFin}Z`),
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'CreneauAffichage',
        motif: `Affichage Ramadan créneau ${creneau.jour} ordre ${creneau.ordre}`,
      },
    );

    return this.toCreneauAffichageDto(affichage);
  }

  async findAll(
    query: CreneauxAffichageQueryDto,
  ): Promise<PaginatedCreneauxAffichagesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.grille) {
      where.grille = query.grille;
    }

    if (query.semestreId) {
      where.creneau = { semestreId: query.semestreId };
    }

    const [data, total] = await Promise.all([
      this.prisma.creneauAffichage.findMany({
        where,
        include: { creneau: { select: { id: true, semestreId: true, jour: true, ordre: true } } },
        orderBy: [{ creneau: { jour: 'asc' } }, { creneau: { ordre: 'asc' } }],
        skip,
        take: limit,
      }),
      this.prisma.creneauAffichage.count({ where }),
    ]);

    return {
      data: data.map((a) => this.toCreneauAffichageDto(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CreneauAffichageResponseDto> {
    const affichage = await this.prisma.creneauAffichage.findUnique({
      where: { id },
      include: { creneau: true },
    });
    if (!affichage) {
      throw new NotFoundException(`Affichage "${id}" introuvable`);
    }
    return this.toCreneauAffichageDto(affichage);
  }

  async update(
    id: string,
    dto: UpdateCreneauAffichageDto,
    userId: string,
  ): Promise<CreneauAffichageResponseDto> {
    const existing = await this.prisma.creneauAffichage.findUnique({
      where: { id },
      include: { creneau: { include: { semestre: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Affichage "${id}" introuvable`);
    }

    const heureDebut = dto.heureDebut ?? existing.heureDebut.toTimeString().slice(0, 8);
    const heureFin = dto.heureFin ?? existing.heureFin.toTimeString().slice(0, 8);

    await this.verifierControlesJour(
      existing.creneau.semestreId,
      existing.creneau.jour,
      heureDebut,
      heureFin,
      id,
    );

    const affichage = await this.audit.auditTransaction(
      async (tx) => {
        return tx.creneauAffichage.update({
          where: { id },
          data: {
            heureDebut: new Date(`1970-01-01T${heureDebut}Z`),
            heureFin: new Date(`1970-01-01T${heureFin}Z`),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'CreneauAffichage',
        motif: `Modification affichage Ramadan ${existing.creneau.jour} ordre ${existing.creneau.ordre}`,
      },
    );

    return this.toCreneauAffichageDto(affichage);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.creneauAffichage.findUnique({
      where: { id },
      include: { creneau: true },
    });
    if (!existing) {
      throw new NotFoundException(`Affichage "${id}" introuvable`);
    }

    await this.audit.auditTransaction(
      async (tx) => {
        return tx.creneauAffichage.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'CreneauAffichage',
        motif: `Suppression affichage Ramadan ${existing.creneau.jour} ordre ${existing.creneau.ordre}`,
      },
    );
  }

  async duplicate(
    dto: DuplicateCreneauxAffichageDto,
    userId: string,
  ): Promise<DuplicateCreneauxAffichageResponseDto> {
    if (dto.sourceSemestreId === dto.cibleSemestreId) {
      throw new BadRequestException('Le semestre source et le semestre cible doivent être différents');
    }

    const [source, cible] = await Promise.all([
      this.prisma.semestre.findUnique({ where: { id: dto.sourceSemestreId } }),
      this.prisma.semestre.findUnique({ where: { id: dto.cibleSemestreId } }),
    ]);
    if (!source) {
      throw new NotFoundException(`Semestre source "${dto.sourceSemestreId}" introuvable`);
    }
    if (!cible) {
      throw new NotFoundException(`Semestre cible "${dto.cibleSemestreId}" introuvable`);
    }

    const cibleCount = await this.prisma.creneauAffichage.count({
      where: { creneau: { semestreId: dto.cibleSemestreId } },
    });
    if (cibleCount > 0 && !dto.remplacer) {
      throw new ConflictException(
        'Le semestre cible contient déjà des affichages Ramadan. Utilisez l\'option « remplacer » pour les écraser.',
      );
    }

    const sourceAffichages = await this.prisma.creneauAffichage.findMany({
      where: { creneau: { semestreId: dto.sourceSemestreId } },
      include: { creneau: true },
      orderBy: [{ creneau: { jour: 'asc' } }, { creneau: { ordre: 'asc' } }],
    });

    if (sourceAffichages.length === 0) {
      return { created: 0, creneauAffichageIds: [] };
    }

    const created: string[] = [];
    await this.audit.auditTransaction(
      async (tx) => {
        if (dto.remplacer) {
          await tx.creneauAffichage.deleteMany({
            where: { creneau: { semestreId: dto.cibleSemestreId } },
          });
        }
        for (const a of sourceAffichages) {
          const createdAffichage = await tx.creneauAffichage.create({
            data: {
              creneauId: a.creneauId,
              grille: a.grille,
              heureDebut: a.heureDebut,
              heureFin: a.heureFin,
            },
          });
          created.push(createdAffichage.id);
        }
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'CreneauAffichage',
        motif: `Duplication affichages Ramadan de ${dto.sourceSemestreId} vers ${dto.cibleSemestreId}`,
      },
    );

    return { created: created.length, creneauAffichageIds: created };
  }

  // ============================================
  // Contrôles métier (EX-CAL-04)
  // ============================================

  private async verifierControlesJour(
    semestreId: string,
    jour: string,
    heureDebut: string,
    heureFin: string,
    excludeId?: string,
  ): Promise<void> {
    const affichages = await this.prisma.creneauAffichage.findMany({
      where: {
        creneau: { semestreId, jour: jour as import('@takt/db').JourSemaine },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { creneau: { select: { ordre: true, estPause: true } } },
      orderBy: { creneau: { ordre: 'asc' } },
    });

    const debut = new Date(`1970-01-01T${heureDebut}Z`).getTime();
    const fin = new Date(`1970-01-01T${heureFin}Z`).getTime();

    if (fin <= debut) {
      throw new BadRequestException("L'heure de fin doit être postérieure à l'heure de début");
    }

    let dernierFin = -1;
    for (const a of affichages) {
      const aDebut = a.heureDebut.getTime();
      const aFin = a.heureFin.getTime();

      if (debut < aFin && fin > aDebut) {
        throw new ConflictException(
          `L'affichage chevauche un affichage existant du même jour (créneau ordre ${a.creneau.ordre})`,
        );
      }

      if (dernierFin >= 0 && debut < dernierFin) {
        throw new ConflictException(
          "Les affichages d'une même journée doivent être dans l'ordre croissant",
        );
      }

      dernierFin = Math.max(dernierFin, aFin);
    }
  }

  private toCreneauAffichageDto(
    affichage: {
      id: string;
      creneauId: string;
      grille: string;
      heureDebut: Date;
      heureFin: Date;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): CreneauAffichageResponseDto {
    return {
      id: affichage.id,
      creneauId: affichage.creneauId,
      grille: affichage.grille as GrilleAffichage,
      heureDebut: affichage.heureDebut.toTimeString().slice(0, 8),
      heureFin: affichage.heureFin.toTimeString().slice(0, 8),
      createdAt: affichage.createdAt ?? new Date(),
      updatedAt: affichage.updatedAt ?? new Date(),
    };
  }
}
