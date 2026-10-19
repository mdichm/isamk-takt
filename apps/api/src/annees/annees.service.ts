import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreneauService } from '../creneaux/creneau.service.js';
import {
  CreateAnneeDto,
  UpdateAnneeDto,
  AnneeResponseDto,
  PaginatedAnneesDto,
  AnneeQueryDto,
  CreateSemestreDto,
  UpdateSemestreDto,
  SemestreResponseDto,
  PaginatedSemestresDto,
  SemestreQueryDto,
  AnneeStatut,
  TransitionAnneeDto,
} from './dto/annee.dto.js';
import {
  GenerateCreneauxDto,
  GenerateCreneauxResponseDto,
} from './dto/generate-creneaux.dto.js';
// eslint-disable-next-line no-restricted-imports
import { JourSemaine } from '@takt/db';
// eslint-disable-next-line no-restricted-imports
import { Prisma } from '@takt/db';

const SLOT_MINUTES = 30;

@Injectable()
export class AnneesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private creneauService: CreneauService,
  ) {}

  // ============================================
  // Années
  // ============================================

  async createAnnee(dto: CreateAnneeDto, userId: string): Promise<AnneeResponseDto> {
    const existingByCode = await this.prisma.annee.findUnique({ where: { code: dto.code } });
    if (existingByCode) {
      throw new ConflictException(`Le code d'année "${dto.code}" existe déjà`);
    }

    const existingByNumero = await this.prisma.annee.findUnique({ where: { numero: dto.numero } });
    if (existingByNumero) {
      throw new ConflictException(`Le numéro d'année ${dto.numero} existe déjà`);
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.create({
          data: {
            numero: dto.numero,
            code: dto.code,
            nbSemaines: dto.nbSemaines ?? 14,
            statut: 'PREPARATION',
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Annee',
        motif: `Création année ${dto.code}`,
      },
    );

    return this.toAnneeDto(annee);
  }

  async findAllAnnees(query: AnneeQueryDto): Promise<PaginatedAnneesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { numero: query.search },
      ];
    }

    if (query.statut !== undefined) {
      where.statut = query.statut;
    }

    const [annees, total] = await Promise.all([
      this.prisma.annee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { numero: 'desc' },
      }),
      this.prisma.annee.count({ where }),
    ]);

    return {
      data: annees.map(this.toAnneeDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAnneeById(id: string): Promise<AnneeResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id } });
    if (!annee) {
      throw new NotFoundException('Année non trouvée');
    }
    return this.toAnneeDto(annee);
  }

  async updateAnnee(id: string, dto: UpdateAnneeDto, userId: string): Promise<AnneeResponseDto> {
    const existing = await this.prisma.annee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.annee.findUnique({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException(`Le code d'année "${dto.code}" existe déjà`);
      }
    }

    if (dto.numero !== undefined && dto.numero !== existing.numero) {
      const conflict = await this.prisma.annee.findUnique({ where: { numero: dto.numero } });
      if (conflict) {
        throw new ConflictException(`Le numéro d'année ${dto.numero} existe déjà`);
      }
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.update({
          where: { id },
          data: {
            ...(dto.code !== undefined && { code: dto.code }),
            ...(dto.numero !== undefined && { numero: dto.numero }),
            ...(dto.nbSemaines !== undefined && { nbSemaines: dto.nbSemaines }),
            ...(dto.statut !== undefined && { statut: dto.statut as AnneeStatut }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Annee',
        objetId: id,
        motif: `Mise à jour année ${id}`,
      },
    );

    return this.toAnneeDto(annee);
  }

  async removeAnnee(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.annee.findUnique({
      where: { id },
      include: { semestres: true },
    });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (existing.semestres.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer une année comportant des semestres. Supprimez d\'abord les semestres.',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.annee.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Annee',
        objetId: id,
        motif: `Suppression année ${existing.code}`,
      },
    );
  }

  private toAnneeDto(annee: { id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }): AnneeResponseDto {
    return {
      id: annee.id,
      numero: annee.numero,
      code: annee.code,
      nbSemaines: annee.nbSemaines,
      statut: annee.statut,
      createdAt: annee.createdAt,
      updatedAt: annee.updatedAt,
    };
  }

  // ============================================
  // Transitions (activation / clôture) — L1-02
  // ============================================

  async activerAnnee(
    id: string,
    dto: TransitionAnneeDto,
    userId: string,
  ): Promise<AnneeResponseDto> {
    const existing = await this.prisma.annee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Année non trouvée');
    }

    if (dto.action === 'ACTIVER') {
      if (existing.statut === 'ACTIVE') {
        throw new ConflictException(`L'année "${existing.code}" est déjà active`);
      }
      // Double sécurité : une seule année ACTIVE à la fois (index unique partiel en DB également)
      const activeAnnee = await this.prisma.annee.findFirst({ where: { statut: 'ACTIVE' } });
      if (activeAnnee) {
        throw new ConflictException(
          `L'année "${activeAnnee.code}" est déjà active. Une seule année peut être active à la fois.`,
        );
      }

      const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
        async (tx) => {
          return tx.annee.update({
            where: { id },
            data: { statut: 'ACTIVE' },
          });
        },
        {
          userId,
          action: 'STATUS_CHANGED',
          objetType: 'Annee',
          objetId: id,
          motif: `Activation année ${existing.code}`,
        },
      );
      return this.toAnneeDto(annee);
    }

    // CLOTURER
    if (!dto.confirmation) {
      throw new BadRequestException('La clôture d\'une année nécessite une confirmation explicite.');
    }
    if (existing.statut === 'CLOTUREE') {
      throw new ConflictException(`L'année "${existing.code}" est déjà clôturée`);
    }
    if (existing.statut === 'PREPARATION') {
      throw new ConflictException(`Impossible de clôturer une année en préparation. Activez-la d'abord.`);
    }

    const annee = await this.audit.auditTransaction<{ id: string; numero: number; code: string; nbSemaines: number; statut: AnneeStatut; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.annee.update({
          where: { id },
          data: { statut: 'CLOTUREE' },
        });
      },
      {
        userId,
        action: 'STATUS_CHANGED',
        objetType: 'Annee',
        objetId: id,
        motif: `Clôture année ${existing.code}`,
      },
    );
    return this.toAnneeDto(annee);
  }

  // ============================================
  // Semestres
  // ============================================

  async createSemestre(dto: CreateSemestreDto, userId: string): Promise<SemestreResponseDto> {
    const annee = await this.prisma.annee.findUnique({ where: { id: dto.anneeId } });
    if (!annee) {
      throw new NotFoundException('Année parente non trouvée');
    }

    const existing = await this.prisma.semestre.findUnique({
      where: { anneeId_numero: { anneeId: dto.anneeId, numero: dto.numero } },
    });
    if (existing) {
      throw new ConflictException(`Le semestre ${dto.numero} existe déjà pour cette année`);
    }

    const semestre = await this.audit.auditTransaction<{ id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.semestre.create({
          data: {
            anneeId: dto.anneeId,
            numero: dto.numero,
            nbSemaines: dto.nbSemaines ?? 14,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Semestre',
        motif: `Création semestre ${dto.numero} pour l'année ${dto.anneeId}`,
      },
    );

    return this.toSemestreDto(semestre);
  }

  async findAllSemestres(anneeId: string, query: SemestreQueryDto): Promise<PaginatedSemestresDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;

    const [semestres, total] = await Promise.all([
      this.prisma.semestre.findMany({
        where: { anneeId },
        skip,
        take: limit,
        orderBy: { numero: 'asc' },
      }),
      this.prisma.semestre.count({ where: { anneeId } }),
    ]);

    return {
      data: semestres.map(this.toSemestreDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSemestreById(id: string): Promise<SemestreResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id } });
    if (!semestre) {
      throw new NotFoundException('Semestre non trouvé');
    }
    return this.toSemestreDto(semestre);
  }

  async updateSemestre(id: string, dto: UpdateSemestreDto, userId: string): Promise<SemestreResponseDto> {
    const existing = await this.prisma.semestre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Semestre non trouvé');
    }

    if (dto.numero !== undefined && dto.numero !== existing.numero) {
      const conflict = await this.prisma.semestre.findUnique({
        where: { anneeId_numero: { anneeId: existing.anneeId, numero: dto.numero } },
      });
      if (conflict) {
        throw new ConflictException(`Le semestre ${dto.numero} existe déjà pour cette année`);
      }
    }

    const semestre = await this.audit.auditTransaction<{ id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }>(
      async (tx) => {
        return tx.semestre.update({
          where: { id },
          data: {
            ...(dto.numero !== undefined && { numero: dto.numero }),
            ...(dto.nbSemaines !== undefined && { nbSemaines: dto.nbSemaines }),
          },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'Semestre',
        objetId: id,
        motif: `Mise à jour semestre ${id}`,
      },
    );

    return this.toSemestreDto(semestre);
  }

  async removeSemestre(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.semestre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Semestre non trouvé');
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.semestre.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Semestre',
        objetId: id,
        motif: `Suppression semestre ${existing.numero}`,
      },
    );
  }

  // ============================================
  // Génération de grille horaire (L1-18)
  // ============================================

  async generateCreneaux(
    semestreId: string,
    dto: GenerateCreneauxDto,
    userId: string,
  ): Promise<GenerateCreneauxResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const joursOrdres: { jour: JourSemaine; ordre: number; heureDebut: string; heureFin: string; estPause: boolean }[] = [];
    const parJour: { jour: JourSemaine; count: number }[] = [];

    for (const j of dto.jours) {
      const debut = new Date(`1970-01-01T${j.heureDebut}Z`);
      const fin = new Date(`1970-01-01T${j.heureFin}Z`);
      const diffMinutes = (fin.getTime() - debut.getTime()) / (1000 * 60);
      if (diffMinutes <= 0 || diffMinutes % SLOT_MINUTES !== 0) {
        throw new BadRequestException(
          `La plage horaire du jour ${j.jour} doit être un multiple positif de ${SLOT_MINUTES} minutes`,
        );
      }

      let pauseCursor = debut.getTime();
      if (j.pauses) {
        for (const p of j.pauses) {
          const pDebut = new Date(`1970-01-01T${p.debut}Z`);
          const pFin = new Date(`1970-01-01T${p.fin}Z`);
          const pDiff = (pFin.getTime() - pDebut.getTime()) / (1000 * 60);
          if (pDiff <= 0 || pDiff % SLOT_MINUTES !== 0) {
            throw new BadRequestException(
              `La pause du jour ${j.jour} de ${p.debut} à ${p.fin} doit être un multiple positif de ${SLOT_MINUTES} minutes`,
            );
          }
          if (pDebut.getTime() <= debut.getTime() || pFin.getTime() >= fin.getTime()) {
            throw new BadRequestException(
              `La pause du jour ${j.jour} doit être comprise strictement entre ${j.heureDebut} et ${j.heureFin}`,
            );
          }
          if (pDebut.getTime() < pauseCursor) {
            throw new BadRequestException(
              `Les pauses du jour ${j.jour} se chevauchent ou ne sont pas ordonnées`,
            );
          }
          pauseCursor = pFin.getTime();
        }
      }

      let cursor = debut.getTime();
      let ordre = 1;
      let jourCount = 0;
      while (cursor < fin.getTime()) {
        const slotFin = cursor + SLOT_MINUTES * 60 * 1000;
        let estPause = false;
        if (j.pauses) {
          for (const p of j.pauses) {
            const pDebut = new Date(`1970-01-01T${p.debut}Z`);
            const pFin = new Date(`1970-01-01T${p.fin}Z`);
            if (cursor >= pDebut.getTime() && cursor < pFin.getTime()) {
              estPause = true;
              break;
            }
          }
        }
        joursOrdres.push({
          jour: j.jour,
          ordre,
          heureDebut: new Date(cursor).toISOString().slice(11, 19),
          heureFin: new Date(slotFin).toISOString().slice(11, 19),
          estPause,
        });
        jourCount++;
        ordre++;
        cursor = slotFin;
      }
      parJour.push({ jour: j.jour, count: jourCount });
    }

    if (dto.dryRun === true) {
      return {
        semestreId,
        creneaux: joursOrdres.map((j) => ({
          jour: j.jour,
          ordre: j.ordre,
          heureDebut: j.heureDebut,
          heureFin: j.heureFin,
          estPause: j.estPause,
        })),
        total: joursOrdres.length,
        parJour,
      };
    }

    const grilleParams = {
      jours: dto.jours.map((j) => ({
        jour: j.jour,
        debut: j.heureDebut,
        fin: j.heureFin,
        pauses: j.pauses?.map((p) => ({ debut: p.debut, fin: p.fin })) ?? [],
      })),
    };

    // Contrôle 409 SLOT_IN_USE (inactif jusqu'à L3-10 : modèle Seance absent)
    // TODO L3-10 : une fois le modèle Seance implémenté, vérifier qu'aucune séance
    // ne référence un créneau du semestre qui serait supprimé/modifié.

    const result = await this.audit.auditTransaction(
      async (tx) => {
        await tx.creneau.deleteMany({ where: { semestreId } });

        const created: Array<{
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
        }> = [];

        for (const j of joursOrdres) {
          const c = await tx.creneau.create({
            data: {
              semestreId,
              jour: j.jour,
              ordre: j.ordre,
              heureDebut: new Date(`1970-01-01T${j.heureDebut}Z`),
              heureFin: new Date(`1970-01-01T${j.heureFin}Z`),
              estPause: j.estPause,
              estActive: true,
            },
          });
          created.push({
            id: c.id,
            semestreId: c.semestreId,
            jour: c.jour,
            ordre: c.ordre,
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            estPause: c.estPause,
            estActive: c.estActive,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        }

        await tx.semestre.update({
          where: { id: semestreId },
          data: { grilleParams: grilleParams as unknown as Prisma.InputJsonValue },
        });

        return created;
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Semestre',
        objetId: semestreId,
        motif: `Génération de la grille horaire du semestre ${semestreId} (${joursOrdres.length} créneaux)`,
      },
    );

    return {
      semestreId,
      creneaux: result.map((c) => ({
        jour: c.jour as JourSemaine,
        ordre: c.ordre,
        heureDebut: c.heureDebut.toISOString().slice(11, 19),
        heureFin: c.heureFin.toISOString().slice(11, 19),
        estPause: c.estPause,
      })),
      total: result.length,
      parJour,
    };
  }

  private toSemestreDto(semestre: { id: string; anneeId: string; numero: number; nbSemaines: number; createdAt: Date; updatedAt: Date }): SemestreResponseDto {
    return {
      id: semestre.id,
      anneeId: semestre.anneeId,
      numero: semestre.numero,
      nbSemaines: semestre.nbSemaines,
      createdAt: semestre.createdAt,
      updatedAt: semestre.updatedAt,
    };
  }
}