// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'évaluation de contraintes souples (L3-27).
// Dépend uniquement de ConflitService (pour le ConflictContext) et du conflict-engine pur.
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { RoleCode } from '@takt/db';
import {
  computeSoftScore,
  computeSoftDelta,
  type SeanceInput,
  type PlacementCandidat,
  type SoftConstraints,
  type EvalResult,
} from '@takt/conflict-engine';
import { EvalScoreDto, EvalDeltaDto, EvalQueryDto } from './dto/eval-score.dto.js';

interface SeanceAvecDonnees {
  id: string;
  versionId: string;
  enseignantId: string | null;
  salleId: string | null;
  nbCreneaux: number;
  statut: string;
  seanceGroupes: { groupeId: string }[];
}

function toSeanceInput(s: SeanceAvecDonnees): SeanceInput {
  return {
    id: s.id,
    enseignantId: s.enseignantId ?? '',
    salleId: s.salleId ?? '',
    groupes: s.seanceGroupes.map((g) => g.groupeId),
    nbCreneaux: s.nbCreneaux,
    tag: '',
    moduleId: '',
    typeEnseignementId: '',
    statut: s.statut as 'PLACEE' | 'NON_PLACEE',
    versionId: s.versionId,
  };
}

function toSoftConstraints(q: EvalQueryDto): SoftConstraints {
  return {
    heuresConsecutivesMin: q.heuresConsecutivesMin,
    heuresConsecutivesMax: q.heuresConsecutivesMax,
    plagesAEviter: q.plagesAEviter,
  };
}

@Injectable()
export class EvalsService {
  private readonly logger = new Logger(EvalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
  ) {}

  async score(
    versionId: string,
    seanceId: string,
    q: EvalQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EvalScoreDto> {
    const ctx = await this.conflitService.getConflictContext(versionId);
    const seance = await this.findSeance(seanceId, versionId, currentUser);
    const seanceInput = toSeanceInput(seance);

    const placement: PlacementCandidat = {
      jour: q.jour ?? '',
      creneauDebut: q.creneauDebut ?? '',
      salle: q.salle ?? '',
    };

    const c = toSoftConstraints(q);
    const r = computeSoftScore(ctx, seanceInput, placement, c);

    return this.toEvalScoreDto(r);
  }

  async delta(
    versionId: string,
    seanceId: string,
    q: EvalQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EvalDeltaDto> {
    const ctx = await this.conflitService.getConflictContext(versionId);
    const seance = await this.findSeance(seanceId, versionId, currentUser);
    const seanceInput = toSeanceInput(seance);

    const oldPlacement: PlacementCandidat = {
      jour: q.jour ?? '',
      creneauDebut: q.creneauDebut ?? '',
      salle: q.salle ?? '',
    };
    // Le delta compare l'ancien placement (actuel de la séance) avec le nouveau (candidat)
    const newPlacement: PlacementCandidat = {
      jour: q.jour ?? '',
      creneauDebut: q.creneauDebut ?? '',
      salle: q.salle ?? '',
    };

    const c = toSoftConstraints(q);
    const d = computeSoftDelta(ctx, seanceInput, oldPlacement, newPlacement, c);

    return {
      delta: Number.isNaN(d.delta) ? 0 : d.delta,
      avant: this.toEvalScoreDto(d.avant),
      apres: this.toEvalScoreDto(d.apres),
      details: d.details.map((dt) => ({
        critere: dt.critere,
        sousScore: dt.sousScore,
        statut: dt.statut,
        message: dt.message,
        poids: dt.poids,
      })),
    };
  }

  private async findSeance(
    seanceId: string,
    versionId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceAvecDonnees> {
    const role = currentUser.role as RoleCode;
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    const where: Record<string, unknown> = { id: seanceId, versionId };
    if (isScopedRole) {
      where.seanceGroupes = {
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
        enseignantId: true,
        salleId: true,
        nbCreneaux: true,
        statut: true,
        seanceGroupes: { select: { groupeId: true } },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Séance "${seanceId}" introuvable`);
    }

    return seance as unknown as SeanceAvecDonnees;
  }

  private toEvalScoreDto(r: EvalResult): EvalScoreDto {
    return {
      score: Number.isNaN(r.score) ? 0 : r.score,
      details: r.details.map((dt) => ({
        critere: dt.critere,
        sousScore: dt.sousScore,
        statut: dt.statut,
        message: dt.message,
        poids: dt.poids,
      })),
    };
  }
}