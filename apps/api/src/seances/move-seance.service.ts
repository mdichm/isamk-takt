// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de déplacement d'une séance (L3-20)
// PATCH /seances/{id}/placement — MoveSeanceUseCase.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionStatut, RoleCode, SeanceStatut, VerrouType } from '@takt/db';
import {
  validatePlacement,
  computeSoftScore,
  computeSoftDelta,
  type SeanceInput,
  type PlacementCandidat,
  type ConflictContext,
  type SoftConstraints,
} from '@takt/conflict-engine';
import type { SeanceResponseDto } from './dto/seance-response.dto.js';
import { toSeanceDto } from './dto/seance-response.dto.js';
import { MoveSeanceDto } from './dto/move-seance.dto.js';
import { ContrainteCategorie } from '@takt/db';

const VERROUX_BLOQUANTS: VerrouType[] = ['CRENEAU', 'SALLE', 'ACTIVITE'];

interface SeanceAvecDonnees {
  id: string;
  versionId: string | null;
  semestreId: string;
  enseignantId: string | null;
  salleId: string | null;
  jour: string | null;
  creneauDebutId: string | null;
  nbCreneaux: number;
  statut: string;
  tag: string | null;
  revision: number;
  seanceGroupes: { groupeId: string }[];
}

function toSeanceInput(
  s: SeanceAvecDonnees,
  placeInitialeSalleId: string | null,
): SeanceInput {
  return {
    id: s.id,
    enseignantId: s.enseignantId ?? '',
    salleId: s.salleId ?? '',
    groupes: s.seanceGroupes.map((g) => g.groupeId),
    nbCreneaux: s.nbCreneaux,
    tag: s.tag ?? '',
    moduleId: '',
    typeEnseignementId: '',
    statut: s.statut as 'PLACEE' | 'NON_PLACEE',
    versionId: s.versionId!,
    volumePlace: 0,
    placeInitiale: placeInitialeSalleId ? { salleId: placeInitialeSalleId } : undefined,
  };
}

@Injectable()
export class MoveSeanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
    private readonly audit: AuditService,
  ) {}

  async move(
    seanceId: string,
    dto: MoveSeanceDto,
    ifMatch: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    const where: Record<string, unknown> = { id: seanceId };
    if (isScopedRole) {
      (where as Record<string, unknown>).seanceGroupes = {
        some: {
          groupe: {
            niveau: {
              formation: {
                departementId: { in: userDepartments },
              },
            },
          },
        },
      };
    }

    const seance = await this.prisma.seance.findFirst({
      where,
      select: {
        id: true,
        versionId: true,
        semestreId: true,
        enseignantId: true,
        salleId: true,
        jour: true,
        creneauDebutId: true,
        nbCreneaux: true,
        statut: true,
        tag: true,
        revision: true,
        seanceGroupes: { select: { groupeId: true } },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Séance "${seanceId}" introuvable`);
    }

    if (!seance.versionId) {
      throw new NotFoundException(
        `Séance "${seanceId}" n'est rattachée à aucune version`,
      );
    }
    const versionId: string = seance.versionId;

    if (isDirection) {
      const version = await this.prisma.versionEdt.findUnique({
        where: { id: versionId },
        select: { statut: true },
      });
      if (!version || !['PUBLIE', 'ARCHIVE'].includes(version.statut)) {
        throw new NotFoundException(`Séance "${seanceId}" introuvable`);
      }
    }

    if (!ifMatch || String(seance.revision) !== ifMatch) {
      throw new HttpException(
        {
          message: 'En-tête If-Match requis ou révision périmée',
          error: 'Precondition Failed',
          errorCode: 'PRECONDITION_FAILED',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }
    if (
      version.statut === VersionStatut.PUBLIE ||
      version.statut === VersionStatut.ARCHIVE
    ) {
      throw new ConflictException(
        `IMMUTABILITY : cette séance appartient à une version ${version.statut} et ne peut pas être déplacée`,
      );
    }

    const now = new Date();
    const editLock = await this.prisma.editLock.findUnique({
      where: { versionId },
    });
    if (!editLock || editLock.expiresAt < now) {
      throw new ForbiddenException(
        'Aucun bail d\'édition actif sur cette version. Acquérez un bail avant de déplacer une séance.',
      );
    }
    const isOwner = editLock.userId === currentUser.id;
    const isAdmin = currentUser.role === RoleCode.ADMINISTRATEUR;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Le bail d\'édition est détenu par un autre utilisateur',
      );
    }

    const verrousActifs = await this.prisma.verrouSeance.findMany({
      where: {
        seanceId,
        type: { in: VERROUX_BLOQUANTS },
        leveLe: null,
      },
      select: { id: true, type: true, auteurId: true, creeLe: true },
    });
    if (verrousActifs.length > 0) {
      const types = verrousActifs.map((v) => v.type).join(', ');
      throw new ConflictException(
        `Séance verrouillée (${types}), état non éditable`,
      );
    }
const ctx: ConflictContext = await this.conflitService.getConflictContext(
      versionId,
    );

    const seanceInput = toSeanceInput(
      seance as unknown as SeanceAvecDonnees,
      seance.salleId,
    );
    const candidat: PlacementCandidat = {
      jour: dto.jour,
      creneauDebut: dto.creneauDebutId,
      salle: dto.salleId,
    };

    const conflits = validatePlacement(seanceInput, candidat, ctx);
    const conflitsBloquants = conflits.filter((c) => c.severite === 'BLOQUANT');

    if (conflitsBloquants.length > 0) {
      throw new ConflictException({
        code: 'SEANCE_CONFLICT_BLOCKING',
        message: 'SEANCE_CONFLICT_BLOCKING : Un ou plusieurs conflits bloquants empêchent ce déplacement',
        details: conflitsBloquants.map((c) => ({
          regleCode: c.regleCode,
          type: c.type,
          message: c.message,
          signature: c.signature,
          seanceIds: c.seanceIds,
        })),
      } as any);
    }

    const slotKeys = ctx.grille.consecutifs(dto.jour, dto.creneauDebutId, seance.nbCreneaux);
    if (!slotKeys) {
      throw new ConflictException(
        `Aucun créneau consécutif trouvé pour le jour ${dto.jour} à partir de ${dto.creneauDebutId}`,
      );
    }
    if (slotKeys.length === 0) {
      throw new ConflictException(
        `Aucun créneau consécutif trouvé pour le jour ${dto.jour} à partir de ${dto.creneauDebutId}`,
      );
    }
    const creneauIds = slotKeys.map((sk) => sk.split('|')[1]);

    const seanceData: SeanceAvecDonnees = seance;

    const ancienneValeur = {
      jour: seanceData.jour,
      creneauDebutId: seanceData.creneauDebutId,
      salleId: seanceData.salleId,
      statut: seanceData.statut,
      revision: seanceData.revision,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const txService = tx as unknown as PrismaService;

      const updatedSeance = await txService.seance.update({
        where: { id: seanceId },
        data: {
          jour: dto.jour,
          creneauDebutId: dto.creneauDebutId,
          salleId: dto.salleId,
          statut: SeanceStatut.PLACEE,
          revision: { increment: 1 },
        },
        select: {
          id: true,
          versionId: true,
          semestreId: true,
          affectationKey: true,
          rang: true,
          tag: true,
          statut: true,
          origine: true,
          revision: true,
          jour: true,
          creneauDebutId: true,
          nbCreneaux: true,
          enseignantId: true,
          salleId: true,
          seanceGroupes: { select: { groupeId: true } },
        },
      });

      await txService.occupation.deleteMany({
        where: { seanceId },
      });

      const ressources: { ressourceType: string; ressourceId: string }[] = [];
      if (seanceData.enseignantId) {
        ressources.push({ ressourceType: 'ENSEIGNANT', ressourceId: seanceData.enseignantId });
      }
      if (dto.salleId) {
        ressources.push({ ressourceType: 'SALLE', ressourceId: dto.salleId });
      }
      for (const sg of seanceData.seanceGroupes) {
        ressources.push({ ressourceType: 'GROUPE', ressourceId: sg.groupeId });
      }

      for (const creneauId of creneauIds) {
        for (const ressource of ressources) {
          await txService.occupation.create({
            data: {
              versionId,
              seanceId,
              jour: dto.jour,
              creneauId,
              ressourceType: ressource.ressourceType as any,
              ressourceId: ressource.ressourceId,
            },
          });
        }
      }

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'SEANCE_DEPLACE',
        objetType: 'Seance',
        objetId: seanceId,
        ancienneValeur,
        nouvelleValeur: {
          jour: updatedSeance.jour,
          creneauDebutId: updatedSeance.creneauDebutId,
          salleId: updatedSeance.salleId,
          statut: updatedSeance.statut,
          revision: updatedSeance.revision,
        },
        versionId,
        motif: `Déplacement de la séance ${seanceId} vers le jour ${dto.jour}, créneau ${dto.creneauDebutId}, salle ${dto.salleId}`,
        ip: undefined,
        requestId: undefined,
      };
      await this.audit.writeAudit(txService, auditData);

      return updatedSeance;
    });

    await this.conflitService.recomputeConflits(versionId);

    // --- Évaluation des contraintes souples (L3-27) ---
    let softScore: number | null = null;
    let softDelta: number | null = null;

    const contraintesSouples = await this.prisma.contrainteInstance.findMany({
      where: {
        semestreId: seanceData.semestreId,
        actif: true,
        definition: { categorie: ContrainteCategorie.SOUPLE },
      },
      include: { definition: true },
    });

    if (contraintesSouples.length > 0) {
      const softConstraints: SoftConstraints = {};
      for (const ci of contraintesSouples) {
        const code = ci.definition.code;
        const poids = ci.poids ?? 1;
        const params = (ci.params ?? {}) as Record<string, unknown>;

        if (code === 'PLAGES_A_EVITER') {
          softConstraints.plagesAEviter = (params.plages ?? []) as string[];
          softConstraints.poidsPlagesAEviter = poids;
        } else if (code === 'HEURES_CONSECUTIVES') {
          softConstraints.heuresConsecutivesMin = params.heuresConsecutivesMin as
            | number
            | undefined;
          softConstraints.heuresConsecutivesMax = params.heuresConsecutivesMax as
            | number
            | undefined;
          softConstraints.poidsHeuresConsecutives = poids;
        }
        // Les contraintes sans évaluateur spécifique restent non évaluées (statut NON_EVALUE dans le moteur)
      }

      const oldPlacement: PlacementCandidat = {
        jour: seanceData.jour ?? '',
        creneauDebut: seanceData.creneauDebutId ?? '',
        salle: seanceData.salleId ?? '',
      };

      const scoreResult = computeSoftScore(ctx, seanceInput, candidat, softConstraints);
      const deltaResult = computeSoftDelta(
        ctx,
        seanceInput,
        oldPlacement,
        candidat,
        softConstraints,
      );

      softScore = Number.isNaN(scoreResult.score) ? null : scoreResult.score;
      softDelta = Number.isNaN(deltaResult.delta) ? null : deltaResult.delta;
    }

    const seanceAvecOccupations = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      select: {
        id: true,
        versionId: true,
        semestreId: true,
        affectationKey: true,
        rang: true,
        tag: true,
        statut: true,
        origine: true,
        revision: true,
        jour: true,
        creneauDebutId: true,
        nbCreneaux: true,
        enseignantId: true,
        salleId: true,
        seanceGroupes: { select: { groupeId: true } },
        occupations: {
          select: {
            id: true,
            versionId: true,
            seanceId: true,
            jour: true,
            creneauId: true,
            ressourceType: true,
            ressourceId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return toSeanceDto(seanceAvecOccupations!, true, softScore, softDelta);
  }
}
