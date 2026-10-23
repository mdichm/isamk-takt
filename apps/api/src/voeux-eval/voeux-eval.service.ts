// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'evaluation de satisfaction des voeux (L3-35).
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { MetricsService } from '../common/metrics/metrics.service.js';
import {
  computeSoftScore,
  type SeanceInput,
  type PlacementCandidat,
  type SoftConstraints,
  type EvalResult,
  type EvalDetail,
} from '@takt/conflict-engine';
import {
  VoeuEvalScoreDto,
  VoeuEvalDeltaDto,
  VoeuEvalDetailDto,
  VoeuEvalQueryDto,
} from './dto/voeux-eval.dto.js';
import type { VOEU_CODE } from '../voeux/dto/voeux.dto.js';

interface SeanceAvecDonnees {
  id: string;
  versionId: string;
  semestreId: string;
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

function toSoftConstraints(
  voeux: { code: VOEU_CODE; poids: number; params: Record<string, unknown> }[],
  q: VoeuEvalQueryDto,
): SoftConstraints {
  const c: SoftConstraints = {};
  if (q.heuresConsecutivesMin !== undefined) {
    c.heuresConsecutivesMin = q.heuresConsecutivesMin;
  }
  if (q.heuresConsecutivesMax !== undefined) {
    c.heuresConsecutivesMax = q.heuresConsecutivesMax;
  }
  if (q.plagesAEviter?.length) {
    c.plagesAEviter = q.plagesAEviter;
  }
  return c;
}

@Injectable()
export class VoeuxEvalService {
  private readonly logger = new Logger(VoeuxEvalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
    private readonly metrics: MetricsService,
  ) {}

  async score(
    versionId: string,
    enseignantId: string,
    q: VoeuEvalQueryDto,
  ): Promise<VoeuEvalScoreDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, semestreId: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException(`Enseignant "${enseignantId}" introuvable`);
    }

    const ctx = await this.conflitService.getConflictContext(versionId);

    const placement: PlacementCandidat = {
      jour: q.jour ?? '',
      creneauDebut: q.creneauDebut ?? '',
      salle: q.salle ?? '',
    };

    const activeVoeux = await this.prisma.contrainteInstance.findMany({
      where: {
        semestreId: version.semestreId,
        enseignantId,
        nature: 'VOEU',
        actif: true,
      },
      include: { definition: true },
    });

    const voeuxList = activeVoeux.map((v) => ({
      code: v.definition.code as VOEU_CODE,
      poids: (v.poids ?? 50) as number,
      params: v.params as Record<string, unknown>,
    }));

    const c = toSoftConstraints(voeuxList, q);

    const seanceInput: SeanceInput = {
      id: '',
      enseignantId,
      salleId: q.salle ?? '',
      groupes: [],
      nbCreneaux: 1,
      tag: '',
      moduleId: '',
      typeEnseignementId: '',
      statut: 'PLACEE',
      versionId,
    };

    const r: EvalResult = computeSoftScore(ctx, seanceInput, placement, c);
    const details: VoeuEvalDetailDto[] = this.mapEvalDetails(r.details, voeuxList);
    const score = Number.isNaN(r.score) ? 0 : r.score;

    this.metrics.observeVoeuxSatisfaction(enseignantId, version.semestreId, score);

    return { score, details, enseignantId, semestreId: version.semestreId };
  }

  private mapEvalDetails(
    engineDetails: EvalDetail[],
    voeux: { code: VOEU_CODE; poids: number; params: Record<string, unknown> }[],
  ): VoeuEvalDetailDto[] {
    const detailsByCode = new Map<string, VoeuEvalDetailDto>();

    for (const v of voeux) {
      detailsByCode.set(v.code, {
        code: v.code,
        sousScore: null,
        statut: 'NON_EVALUE',
        message: 'Vœu non évalué',
        poids: v.poids,
      });
    }

    for (const d of engineDetails) {
      let matchedCode: VOEU_CODE | undefined;
      if (d.critere === 'plagesAEviter') {
        matchedCode =
          voeux.find(
            (v) => v.code === 'TEACHER_AVOID_SLOT' || v.code === 'TEACHER_DAY_OFF_WISH',
          )?.code;
      } else if (d.critere === 'heuresConsecutives') {
        matchedCode = voeux.find((v) => v.code === 'TEACHER_HOURS_PER_DAY')?.code;
      } else if (d.critere === 'creux') {
        matchedCode = voeux.find((v) => v.code === 'TEACHER_GAPS')?.code;
      } else if (d.critere === 'equilibre') {
        matchedCode = voeux.find((v) => v.code === 'TEACHER_DAYS_PER_WEEK')?.code;
      }

      if (matchedCode && detailsByCode.has(matchedCode)) {
        const existing = detailsByCode.get(matchedCode)!;
        detailsByCode.set(matchedCode, {
          ...existing,
          sousScore: d.sousScore,
          statut: d.statut,
          message: d.message,
          poids: existing.poids,
        });
      }
    }

    return Array.from(detailsByCode.values());
  }

  async delta(
    versionId: string,
    enseignantId: string,
    q: VoeuEvalQueryDto,
  ): Promise<VoeuEvalDeltaDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, semestreId: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: enseignantId },
    });
    if (!enseignant) {
      throw new NotFoundException(`Enseignant "${enseignantId}" introuvable`);
    }

    const ctx = await this.conflitService.getConflictContext(versionId);

    const placement: PlacementCandidat = {
      jour: q.jour ?? '',
      creneauDebut: q.creneauDebut ?? '',
      salle: q.salle ?? '',
    };

    const activeVoeux = await this.prisma.contrainteInstance.findMany({
      where: {
        semestreId: version.semestreId,
        enseignantId,
        nature: 'VOEU',
        actif: true,
      },
      include: { definition: true },
    });

    const voeuxList = activeVoeux.map((v) => ({
      code: v.definition.code as VOEU_CODE,
      poids: (v.poids ?? 50) as number,
      params: v.params as Record<string, unknown>,
    }));

    const c = toSoftConstraints(voeuxList, q);

    const seanceInput: SeanceInput = {
      id: '',
      enseignantId,
      salleId: q.salle ?? '',
      groupes: [],
      nbCreneaux: 1,
      tag: '',
      moduleId: '',
      typeEnseignementId: '',
      statut: 'PLACEE',
      versionId,
    };

    const oldPlacement: PlacementCandidat = {
      jour: '',
      creneauDebut: '',
      salle: '',
    };

    const avant = computeSoftScore(ctx, seanceInput, oldPlacement, c);
    const apres = computeSoftScore(ctx, seanceInput, placement, c);

    let delta: number;
    if (Number.isNaN(avant.score) && Number.isNaN(apres.score)) {
      delta = 0;
    } else if (Number.isNaN(avant.score)) {
      delta = apres.score;
    } else if (Number.isNaN(apres.score)) {
      delta = -avant.score;
    } else {
      delta = apres.score - avant.score;
    }

    const details: VoeuEvalDetailDto[] = this.mapEvalDetails(apres.details, voeuxList);

    return {
      delta: Number.isNaN(delta) ? 0 : delta,
      avant: {
        score: Number.isNaN(avant.score) ? 0 : avant.score,
        details: this.mapEvalDetails(avant.details, voeuxList),
        enseignantId,
        semestreId: version.semestreId,
      },
      apres: {
        score: Number.isNaN(apres.score) ? 0 : apres.score,
        details,
        enseignantId,
        semestreId: version.semestreId,
      },
      details,
    };
  }
}

