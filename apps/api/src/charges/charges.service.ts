// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service métier API des charges et agrégations (L2-10)
// Implémente GET /charges conformément à ST §4.2 et EX-CHG-03.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  ChargeQueryDto,
  ChargeEnseignantDto,
  PaginatedChargesDto,
  ChargeAggregationItem,
  ChargeEnseignantDetail,
  ChargeDimension,
} from './dto/charge.dto.js';
import {
  AnnualChargesDto,
  AnnualChargeEnseignantDto,
  ChargeSource,
} from './dto/annual-charge.dto.js';
import { calculerCharge, ConfigurationError } from '@takt/charge-engine';
import { RepartitionStatut } from '@takt/db';

const USER_ID = 'system';

async function getActiveAnnee(prisma: PrismaService) {
  const annee = await prisma.annee.findFirst({
    where: { statut: 'ACTIVE' },
    include: { semestres: true },
  });
  if (!annee) {
    throw new NotFoundException('Aucune année scolaire active trouvée');
  }
  return annee;
}

async function getPublishedRuleSet(prisma: PrismaService, anneeId: string) {
  const ruleset = await prisma.chargeRuleSet.findFirst({
    where: {
      anneeId,
      publieLe: { not: null },
    },
    include: {
      referenceGrades: true,
      coefficients: true,
    },
    orderBy: { numero: 'desc' },
  });
  if (!ruleset) {
    throw new NotFoundException(
      `Aucun jeu de règles de charge publié pour l'année ${anneeId}`,
    );
  }
  return ruleset;
}

async function hasValideeRepartition(
  prisma: PrismaService,
  semestreId: string,
  departementId: string,
): Promise<boolean> {
  const count = await prisma.repartition.count({
    where: {
      semestreId,
      departementId,
      statut: RepartitionStatut.VALIDEE,
    },
  });
  return count > 0;
}

@Injectable()
export class ChargesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAllCharges(
    query: ChargeQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedChargesDto> {
    const {
      page = 1,
      limit = 10,
      enseignantId,
      departementId,
      formationId,
      moduleId,
      groupeId,
      typeEnseignementId,
      dimension = 'departement',
    } = query;
    const skip = (page - 1) * limit;
    const annee = await getActiveAnnee(this.prisma);
    const effectiveDepartementId =
      currentUser.role === 'RESPONSABLE_DEPARTEMENT'
        ? currentUser.departments?.[0] ?? departementId
        : departementId;
    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      effectiveDepartementId &&
      !currentUser.departments?.includes(effectiveDepartementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : ce département n’est pas dans votre périmètre',
      );
    }
    const semestres = annee.semestres;
    if (semestres.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const repartitions = await this.prisma.repartition.findMany({
      where: {
        semestreId: { in: semestres.map((s) => s.id) },
        ...(effectiveDepartementId && { departementId: effectiveDepartementId }),
      },
      include: {
        affectations: {
          include: {
            enseignant: {
              include: {
                grade: true,
                departement: true,
                decharges: {
                  where: {
                    semestreId: { in: semestres.map((s) => s.id) },
                  },
                },
              },
            },
            module: true,
            typeEnseignement: true,
            groupe: true,
          },
        },
      },
    });

    if (repartitions.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const ruleSet = await getPublishedRuleSet(this.prisma, annee.id);

    const enseignantMap = new Map<string, {
      enseignant: any;
      affectationsBySemestre: Map<string, any[]>;
      dechargesBySemestre: Map<string, number[]>;
    }>();

    for (const repartition of repartitions) {
      const semestreId = repartition.semestreId;
      for (const aff of repartition.affectations) {
        if (enseignantId && aff.enseignantId !== enseignantId) continue;
        if (moduleId && aff.moduleId !== moduleId) continue;
        if (typeEnseignementId && aff.typeEnseignementId !== typeEnseignementId) continue;
        if (groupeId && aff.groupeId !== groupeId) continue;

        const ens = aff.enseignant;
        if (!enseignantMap.has(ens.id)) {
          enseignantMap.set(ens.id, {
            enseignant: ens,
            affectationsBySemestre: new Map(),
            dechargesBySemestre: new Map(),
          });
        }

        const entry = enseignantMap.get(ens.id)!;
        let affs = entry.affectationsBySemestre.get(semestreId);
        if (!affs) {
          affs = [];
          entry.affectationsBySemestre.set(semestreId, affs);
        }
        affs.push(aff);

        if (!entry.dechargesBySemestre.has(semestreId)) {
          const dheures = ens.decharges
            .filter((d: any) => d.semestreId === semestreId)
            .map((d: any) => Number(d.heures));
          entry.dechargesBySemestre.set(semestreId, dheures);
        }
      }
    }

    const enseignantResults: Array<{
      enseignantId: string;
      matricule: string;
      nom: string;
      prenom: string;
      departementId: string;
      departementLibelle: string;
      volumeBrut: number;
      chargePonderee: number;
      chargeReference: number;
      decharges: number;
      serviceDu: number;
      ecart: number;
      heuresSup: number;
      depassePlafond: boolean;
      calculPartiel: boolean;
      detail: ChargeEnseignantDetail[];
    }> = [];

    for (const [, entry] of enseignantMap) {
      const ens = entry.enseignant;
      const gradeId = ens.grade?.id;
      if (!gradeId) continue;

      let totalVolumeBrut = 0;
      let totalChargePonderee = 0;
      let totalChargeReference = 0;
      let totalDecharges = 0;
      let totalServiceDu = 0;
      let totalEcart = 0;
      let totalHeuresSup = 0;
      let anyDepassePlafond = false;
      let calculPartiel = false;
      const detailMap = new Map<string, ChargeEnseignantDetail>();

      for (const semestre of semestres) {
        const affs = entry.affectationsBySemestre.get(semestre.id) ?? [];
        const decharges = entry.dechargesBySemestre.get(semestre.id) ?? [];

        const estValidee = await hasValideeRepartition(
          this.prisma,
          semestre.id,
          effectiveDepartementId || ens.departementId,
        );
        if (!estValidee) calculPartiel = true;

        const semestreData = {
          nbSemaines: semestre.nbSemaines,
          affectations: affs.map((a: any) => ({
            id: a.id,
            groupeCommunKey: a.estCmCommun ? `cm-${a.moduleId}-${a.typeEnseignementId}` : undefined,
            module: a.moduleId,
            type: a.typeEnseignementId,
            volumeHebdoMinutes: a.volumeHebdoMinutes,
          })),
        };

        try {
          const result = calculerCharge(
            { id: ens.id, grade: gradeId, decharges },
            {
              numero: ruleSet.numero,
              periode: ruleSet.periode as any,
              seuilHeuresSup: ruleSet.seuil ?? undefined,
              plafondHeuresSup: ruleSet.plafond ?? null,
              arrondiDecimales: ruleSet.arrondi ?? 2,
              coefficients: ruleSet.coefficients.map((c: any) => ({
                type: c.typeId,
                grade: undefined,
                value: Number(c.coefficient),
              })),
              chargeReference: ruleSet.referenceGrades.map((g: any) => ({
                grade: g.gradeId!,
                value: Number(g.coefficient),
              })),
            },
            semestreData,
          );

          totalVolumeBrut += result.volumeBrut;
          totalChargePonderee += result.chargeCalculee;
          totalChargeReference += result.chargeReference;
          totalDecharges += result.decharges;
          totalServiceDu += result.serviceDu;
          totalEcart += result.ecart;
          totalHeuresSup += result.heuresSup;
          if (result.depassePlafond) anyDepassePlafond = true;

          for (const d of result.detail) {
            const key = d.type;
            const existing = detailMap.get(key);
            if (existing) {
              existing.volume += d.volume;
              existing.contribution += d.contribution;
            } else {
              detailMap.set(key, {
                type: d.type,
                volume: d.volume,
                coefficient: d.coefficient,
                contribution: d.contribution,
              });
            }
          }
        } catch (err) {
          const error = err as Error;
          if (error instanceof ConfigurationError) {
            continue;
          }
          throw error;
        }
      }

      const arrondi = ruleSet.arrondi ?? 2;
      const round = (v: number) => Math.round(v * 10 ** arrondi) / 10 ** arrondi;

      enseignantResults.push({
        enseignantId: ens.id,
        matricule: ens.matricule,
        nom: ens.nom,
        prenom: ens.prenom,
        departementId: ens.departementId,
        departementLibelle: ens.departement.libelle,
        volumeBrut: round(totalVolumeBrut),
        chargePonderee: round(totalChargePonderee),
        chargeReference: round(totalChargeReference),
        decharges: round(totalDecharges),
        serviceDu: round(totalServiceDu),
        ecart: round(totalEcart),
        heuresSup: round(totalHeuresSup),
        depassePlafond: anyDepassePlafond,
        calculPartiel,
        detail: Array.from(detailMap.values()),
      });
    }

    const aggregated = this.aggregateByDimension(
      enseignantResults,
      dimension,
      effectiveDepartementId,
    );

    const total = aggregated.length;
    const data = aggregated.slice(skip, skip + limit);

    return {
      data: data.map((item) => ({
        dimension,
        id: item.id,
        libelle: item.libelle,
        volumeBrut: item.volumeBrut,
        chargePonderee: item.chargePonderee,
        calculPartiel: item.calculPartiel,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findChargeByEnseignant(
    enseignantId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ChargeEnseignantDto> {
    const enseignant = await this.prisma.enseignant.findUnique({
      where: { id: enseignantId },
      include: {
        grade: true,
        departement: true,
        decharges: true,
      },
    });
    if (!enseignant) {
      throw new NotFoundException(`Enseignant ${enseignantId} introuvable`);
    }

    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      currentUser.departments &&
      !currentUser.departments.includes(enseignant.departementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : cet enseignant n’est pas dans votre département',
      );
    }

    const annee = await getActiveAnnee(this.prisma);
    const semestres = annee.semestres;
    const ruleSet = await getPublishedRuleSet(this.prisma, annee.id);

    const repartitions = await this.prisma.repartition.findMany({
      where: {
        semestreId: { in: semestres.map((s) => s.id) },
        departementId: enseignant.departementId,
      },
      include: {
        affectations: {
          where: { enseignantId },
          include: {
            module: true,
            typeEnseignement: true,
            groupe: true,
          },
        },
      },
    });

    let totalVolumeBrut = 0;
    let totalChargePonderee = 0;
    let totalDecharges = 0;
    let calculPartiel = false;
    const detailMap = new Map<string, ChargeEnseignantDetail>();

    for (const semestre of semestres) {
      const repartition = repartitions.find((r) => r.semestreId === semestre.id);
      const affs = repartition?.affectations ?? [];

      const estValidee = await hasValideeRepartition(
        this.prisma,
        semestre.id,
        enseignant.departementId,
      );
      if (!estValidee) calculPartiel = true;

      const semestreData = {
        nbSemaines: semestre.nbSemaines,
        affectations: affs.map((a: any) => ({
          id: a.id,
          groupeCommunKey: a.estCmCommun ? `cm-${a.moduleId}-${a.typeEnseignementId}` : undefined,
          module: a.moduleId,
          type: a.typeEnseignementId,
          volumeHebdoMinutes: a.volumeHebdoMinutes,
        })),
      };

      const decharges = enseignant.decharges
        .filter((d: any) => d.semestreId === semestre.id)
        .map((d: any) => Number(d.heures));

      try {
        const result = calculerCharge(
          { id: enseignant.id, grade: enseignant.gradeId!, decharges },
          {
            numero: ruleSet.numero,
            periode: ruleSet.periode as any,
            seuilHeuresSup: ruleSet.seuil ?? undefined,
            plafondHeuresSup: ruleSet.plafond ?? null,
            arrondiDecimales: ruleSet.arrondi ?? 2,
            coefficients: ruleSet.coefficients.map((c: any) => ({
              type: c.typeId,
              grade: undefined,
              value: Number(c.coefficient),
            })),
            chargeReference: ruleSet.referenceGrades.map((g: any) => ({
              grade: g.gradeId!,
              value: Number(g.coefficient),
            })),
          },
          semestreData,
        );

        totalVolumeBrut += result.volumeBrut;
        totalChargePonderee += result.chargeCalculee;
        totalDecharges += result.decharges;

        for (const d of result.detail) {
          const key = d.type;
          const existing = detailMap.get(key);
          if (existing) {
            existing.volume += d.volume;
            existing.contribution += d.contribution;
          } else {
            detailMap.set(key, {
              type: d.type,
              volume: d.volume,
              coefficient: d.coefficient,
              contribution: d.contribution,
            });
          }
        }
      } catch (err) {
        const error = err as Error;
        if (error instanceof ConfigurationError) {
          throw new BadRequestException(
            `Configuration de charge incomplète : ${error.message}`,
          );
        }
        throw error;
      }
    }

    const arrondi = ruleSet.arrondi ?? 2;
    const round = (v: number) => Math.round(v * 10 ** arrondi) / 10 ** arrondi;

    const chargeReference = ruleSet.referenceGrades.find(
      (g: any) => g.gradeId === enseignant.gradeId,
    );
    const referenceValue = chargeReference ? Number(chargeReference.coefficient) : 0;
    const serviceDu = Math.max(0, referenceValue - totalDecharges);
    const ecart = totalChargePonderee - serviceDu;
    const seuil = ruleSet.seuil ?? 0;
    const heuresSup = Math.max(0, ecart - seuil);
    const depassePlafond =
      ruleSet.plafond != null && heuresSup > ruleSet.plafond;

    return {
      enseignantId: enseignant.id,
      matricule: enseignant.matricule,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      volumeBrut: round(totalVolumeBrut),
      chargePonderee: round(totalChargePonderee),
      chargeReference: round(referenceValue),
      decharges: round(totalDecharges),
      serviceDu: round(serviceDu),
      ecart: round(ecart),
      heuresSup: round(heuresSup),
      depassePlafond,
      calculPartiel,
      detail: Array.from(detailMap.values()),
    };
  }

  async getAnnualCharges(
    departementId: string | undefined,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AnnualChargesDto> {
    const annee = await getActiveAnnee(this.prisma);
    const semestres = annee.semestres;
    if (semestres.length === 0 || semestres.length < 2) {
      return { data: [], total: 0 };
    }

    const [semestre1, semestre2] = semestres;

    const effectiveDepartementId =
      currentUser.role === 'RESPONSABLE_DEPARTEMENT'
        ? currentUser.departments?.[0] ?? departementId
        : departementId;

    if (
      currentUser.role === 'RESPONSABLE_DEPARTEMENT' &&
      effectiveDepartementId &&
      !currentUser.departments?.includes(effectiveDepartementId)
    ) {
      throw new BadRequestException(
        'OUT_OF_SCOPE : ce département n’est pas dans votre périmètre',
      );
    }

    const repartitions = await this.prisma.repartition.findMany({
      where: {
        semestreId: { in: [semestre1.id, semestre2.id] },
        ...(effectiveDepartementId && { departementId: effectiveDepartementId }),
      },
      include: {
        affectations: {
          include: {
            enseignant: {
              include: {
                grade: true,
                departement: true,
                decharges: true,
              },
            },
            module: true,
            typeEnseignement: true,
            groupe: true,
          },
        },
      },
    });

    if (repartitions.length === 0) {
      return { data: [], total: 0 };
    }

    const ruleSet = await getPublishedRuleSet(this.prisma, annee.id);

    const semestreInfo = new Map<
      string,
      { source: ChargeSource; diverge: boolean }
    >();
    for (const semestre of [semestre1, semestre2]) {
      const reps = repartitions.filter((r) => r.semestreId === semestre.id);
      const validee = reps.some(
        (r) => r.statut === RepartitionStatut.VALIDEE,
      );
      const rouverte = reps.some(
        (r) => r.statut === RepartitionStatut.ROUVERTE,
      );
      const brouillon = reps.some(
        (r) => r.statut === RepartitionStatut.BROUILLON,
      );

      let source: ChargeSource;
      if (validee) source = 'SNAPSHOT_VALIDE';
      else if (brouillon || rouverte) source = 'COPIE_TRAVAIL';
      else source = 'ABSENT';

      semestreInfo.set(semestre.id, { source, diverge: rouverte });
    }

    const enseignantMap = new Map<string, {
      enseignant: any;
      affectationsBySemestre: Map<string, any[]>;
      dechargesBySemestre: Map<string, number[]>;
    }>();

    for (const repartition of repartitions) {
      const semestreId = repartition.semestreId;
      for (const aff of repartition.affectations) {
        const ens = aff.enseignant;
        if (!enseignantMap.has(ens.id)) {
          enseignantMap.set(ens.id, {
            enseignant: ens,
            affectationsBySemestre: new Map(),
            dechargesBySemestre: new Map(),
          });
        }
        const entry = enseignantMap.get(ens.id)!;
        if (!entry.affectationsBySemestre.has(semestreId)) {
          entry.affectationsBySemestre.set(semestreId, []);
        }
        entry.affectationsBySemestre.get(semestreId)!.push(aff);

        if (!entry.dechargesBySemestre.has(semestreId)) {
          const dheures = ens.decharges
            .filter((d: any) => d.semestreId === semestreId)
            .map((d: any) => Number(d.heures));
          entry.dechargesBySemestre.set(semestreId, dheures);
        }
      }
    }

    const arrondi = ruleSet.arrondi ?? 2;
    const round = (v: number) => Math.round(v * 10 ** arrondi) / 10 ** arrondi;

    const enseignantResults: AnnualChargeEnseignantDto[] = [];

    for (const [, entry] of enseignantMap) {
      const ens = entry.enseignant;
      const gradeId = ens.grade?.id;
      if (!gradeId) continue;

      const s1 = entry.affectationsBySemestre.get(semestre1.id) ?? [];
      const s1Decharges = entry.dechargesBySemestre.get(semestre1.id) ?? [];
      const s2 = entry.affectationsBySemestre.get(semestre2.id) ?? [];
      const s2Decharges = entry.dechargesBySemestre.get(semestre2.id) ?? [];

      const s1Result = this.calculerChargePourSemestre(
        ens,
        gradeId,
        semestre1,
        s1,
        s1Decharges,
        ruleSet,
      );
      const s2Result = this.calculerChargePourSemestre(
        ens,
        gradeId,
        semestre2,
        s2,
        s2Decharges,
        ruleSet,
      );
      const totalVolumeBrut = s1Result.volumeBrut + s2Result.volumeBrut;
      const totalChargeCalculee =
        s1Result.chargeCalculee + s2Result.chargeCalculee;
      const totalDecharges = s1Result.decharges + s2Result.decharges;

      const chargeReference = ruleSet.referenceGrades.find(
        (g: any) => g.gradeId === gradeId,
      );
      const referenceValue = chargeReference
        ? Number(chargeReference.coefficient)
        : 0;

      const serviceDu = Math.max(0, referenceValue - totalDecharges);
      const ecart = totalChargeCalculee - serviceDu;
      const seuil = ruleSet.seuil ?? 0;
      const heuresSup = Math.max(0, ecart - seuil);
      const depassePlafond =
        ruleSet.plafond != null && heuresSup > ruleSet.plafond;

      const detailMap = new Map<string, ChargeEnseignantDetail>();
      for (const d of [...s1Result.detail, ...s2Result.detail]) {
        const existing = detailMap.get(d.type);
        if (existing) {
          existing.volume += d.volume;
          existing.contribution += d.contribution;
        } else {
          detailMap.set(d.type, { ...d });
        }
      }

      const s1Info = semestreInfo.get(semestre1.id)!;
      const s2Info = semestreInfo.get(semestre2.id)!;

      enseignantResults.push({
        enseignantId: ens.id,
        matricule: ens.matricule,
        nom: ens.nom,
        prenom: ens.prenom,
        departementId: ens.departementId,
        departementLibelle: ens.departement.libelle,
        s1: {
          chargeCalculee: round(s1Result.chargeCalculee),
          source: s1Info.source,
          calculPartiel: s1Info.source !== 'SNAPSHOT_VALIDE',
        },
        s2: {
          chargeCalculee: round(s2Result.chargeCalculee),
          source: s2Info.source,
          calculPartiel: s2Info.source !== 'SNAPSHOT_VALIDE',
        },
        total: {
          volumeBrut: round(totalVolumeBrut),
          chargeCalculee: round(totalChargeCalculee),
          chargeReference: round(referenceValue),
          decharges: round(totalDecharges),
          serviceDu: round(serviceDu),
          ecart: round(ecart),
          heuresSup: round(heuresSup),
          depassePlafond,
        },
        divergence: s1Info.diverge || s2Info.diverge,
        detail: Array.from(detailMap.values()),
      });
    }

    return {
      data: enseignantResults,
      total: enseignantResults.length,
    };
  }

  private calculerChargePourSemestre(
    enseignant: any,
    gradeId: string,
    semestre: any,
    affectations: any[],
    decharges: number[],
    ruleSet: any,
  ): {
    volumeBrut: number;
    chargeCalculee: number;
    decharges: number;
    detail: ChargeEnseignantDetail[];
  } {
    const semestreData = {
      nbSemaines: semestre.nbSemaines,
      affectations: affectations.map((a: any) => ({
        id: a.id,
        groupeCommunKey: a.estCmCommun
          ? 'cm-' + a.moduleId + '-' + a.typeEnseignementId
          : undefined,
        module: a.moduleId,
        type: a.typeEnseignementId,
        volumeHebdoMinutes: a.volumeHebdoMinutes,
      })),
    };

    try {
      const result = calculerCharge(
        { id: enseignant.id, grade: gradeId, decharges },
        {
          numero: ruleSet.numero,
          periode: ruleSet.periode as any,
          seuilHeuresSup: ruleSet.seuil ?? undefined,
          plafondHeuresSup: ruleSet.plafond ?? null,
          arrondiDecimales: ruleSet.arrondi ?? 2,
          coefficients: ruleSet.coefficients.map((c: any) => ({
            type: c.typeId,
            grade: undefined,
            value: Number(c.coefficient),
          })),
          chargeReference: ruleSet.referenceGrades.map((g: any) => ({
            grade: g.gradeId!,
            value: Number(g.coefficient),
          })),
        },
        semestreData,
      );

      return {
        volumeBrut: result.volumeBrut,
        chargeCalculee: result.chargeCalculee,
        decharges: result.decharges,
        detail: result.detail,
      };
    } catch (err) {
      const error = err as Error;
      if (error instanceof ConfigurationError) {
        return {
          volumeBrut: 0,
          chargeCalculee: 0,
          decharges: 0,
          detail: [],
        };
      }
      throw error;
    }
  }

  private aggregateByDimension(
    results: any[],
    dimension: ChargeDimension,
    departementId?: string,
  ): Array<{
    id: string;
    libelle: string;
    volumeBrut: number;
    chargePonderee: number;
    calculPartiel: boolean;
  }> {
    const map = new Map<string, {
      id: string;
      libelle: string;
      volumeBrut: number;
      chargePonderee: number;
      calculPartiel: boolean;
    }>();

    for (const r of results) {
      let key: string;
      let libelle: string;

      switch (dimension) {
        case 'departement':
          key = r.departementId;
          libelle = r.departementLibelle;
          break;
        case 'formation':
        case 'module':
        case 'groupe':
        case 'type':
          key = r.departementId;
          libelle = r.departementLibelle;
          break;
      }

      if (!map.has(key)) {
        map.set(key, { id: key, libelle, volumeBrut: 0, chargePonderee: 0, calculPartiel: false });
      }

      const entry = map.get(key)!;
      entry.volumeBrut += r.volumeBrut;
      entry.chargePonderee += r.chargePonderee;
      if (r.calculPartiel) entry.calculPartiel = true;
    }

    return Array.from(map.values());
  }
}