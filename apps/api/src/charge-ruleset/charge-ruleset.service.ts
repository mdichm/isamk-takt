// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service métier Jeux de règles de charge (L2-03)
// Gère la publication immuable et la création de nouvelle version (numero +1).

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@takt/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  CreateChargeRuleSetDto,
  UpdateChargeRuleSetDto,
  ChargeRuleSetResponseDto,
} from './dto/charge-ruleset.response.dto.js';
import {
  CreateChargeReferenceGradeDto,
  ChargeReferenceGradeResponseDto,
} from './dto/charge-reference-grade.dto.js';
import {
  CreateChargeCoefficientDto,
  ChargeCoefficientResponseDto,
} from './dto/charge-coefficient.dto.js';

const USER_ID = 'system';

@Injectable()
export class ChargeRuleSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ============================================
  // Jeux de règles de charge
  // ============================================

  async createChargeRuleSet(
    dto: CreateChargeRuleSetDto,
    userId: string = USER_ID,
  ): Promise<ChargeRuleSetResponseDto> {
    const existing = await this.prisma.chargeRuleSet.findUnique({
      where: { numero: dto.numero },
    });
    if (existing) {
      throw new ConflictException(
        `Un jeu de règles de charge avec le numéro ${dto.numero} existe déjà`,
      );
    }

    const ruleset = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeRuleSet.create({
          data: {
            numero: dto.numero,
            periode: dto.periode,
            ...(dto.seuil !== undefined && { seuil: dto.seuil }),
            ...(dto.plafond !== undefined && { plafond: dto.plafond }),
            ...(dto.arrondi !== undefined && { arrondi: dto.arrondi }),
            ...(dto.anneeId !== undefined && {
              annee: { connect: { id: dto.anneeId } },
            }),
          },
          include: { referenceGrades: true, coefficients: true },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ChargeRuleSet',
        motif: `Création jeu de règles de charge n°${dto.numero}`,
      },
    );

    return this.toChargeRuleSetDto(ruleset);
  }

  async findAllChargeRuleSets(): Promise<ChargeRuleSetResponseDto[]> {
    const rulesets = await this.prisma.chargeRuleSet.findMany({
      include: { referenceGrades: true, coefficients: true },
      orderBy: [{ numero: 'asc' }],
    });
    return rulesets.map((r) => this.toChargeRuleSetDto(r));
  }

  async findChargeRuleSetById(id: string): Promise<ChargeRuleSetResponseDto> {
    const ruleset = await this.prisma.chargeRuleSet.findUnique({
      where: { id },
      include: { referenceGrades: true, coefficients: true },
    });
    if (!ruleset) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }
    return this.toChargeRuleSetDto(ruleset);
  }
  async updateChargeRuleSet(
    id: string,
    dto: UpdateChargeRuleSetDto,
    userId: string = USER_ID,
  ): Promise<ChargeRuleSetResponseDto> {
    const existing = await this.prisma.chargeRuleSet.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }
    if (existing.publieLe) {
      throw new ConflictException(
        'Impossible de modifier un jeu de règles de charge publié : créez une nouvelle version',
      );
    }

    const ruleset = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeRuleSet.update({
          where: { id },
          data: {
            ...(dto.numero !== undefined && { numero: dto.numero }),
            ...(dto.periode !== undefined && { periode: dto.periode }),
            ...(dto.seuil !== undefined && { seuil: dto.seuil }),
            ...(dto.plafond !== undefined && { plafond: dto.plafond }),
            ...(dto.arrondi !== undefined && { arrondi: dto.arrondi }),
            ...(dto.anneeId !== undefined
              ? { annee: { connect: { id: dto.anneeId } } }
              : {}),
          },
          include: { referenceGrades: true, coefficients: true },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ChargeRuleSet',
        objetId: id,
        motif: `Mise à jour jeu de règles de charge n°${existing.numero}`,
      },
    );

    return this.toChargeRuleSetDto(ruleset);
  }

  async removeChargeRuleSet(
    id: string,
    userId: string = USER_ID,
  ): Promise<void> {
    const existing = await this.prisma.chargeRuleSet.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }
    if (existing.publieLe) {
      throw new ConflictException(
        'Impossible de supprimer un jeu de règles de charge publié',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.chargeRuleSet.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'ChargeRuleSet',
        objetId: id,
        motif: `Suppression jeu de règles de charge n°${existing.numero}`,
      },
    );
  }

  async publishChargeRuleSet(
    id: string,
    userId: string = USER_ID,
  ): Promise<ChargeRuleSetResponseDto> {
    const existing = await this.prisma.chargeRuleSet.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }
    if (existing.publieLe) {
      throw new ConflictException(
        'Ce jeu de règles de charge est déjà publié',
      );
    }

    const ruleset = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeRuleSet.update({
          where: { id },
          data: { publieLe: new Date() },
          include: { referenceGrades: true, coefficients: true },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ChargeRuleSet',
        objetId: id,
        motif: `Publication jeu de règles de charge n°${existing.numero}`,
      },
    );

    return this.toChargeRuleSetDto(ruleset);
  }

  async newChargeRuleSetVersion(
    id: string,
    userId: string = USER_ID,
  ): Promise<ChargeRuleSetResponseDto> {
    const published = await this.prisma.chargeRuleSet.findUnique({
      where: { id },
      include: { referenceGrades: true, coefficients: true },
    });
    if (!published) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }
    if (!published.publieLe) {
      throw new BadRequestException(
        'Seul un jeu publié peut servir de base à une nouvelle version',
      );
    }

    const nextNumero = (published.numero ?? 0) + 1;

    const ruleset = await this.audit.auditTransaction(
      async (tx) => {
        const created = await tx.chargeRuleSet.create({
          data: {
            numero: nextNumero,
            periode: published.periode,
            seuil: published.seuil,
            plafond: published.plafond,
            arrondi: published.arrondi,
            anneeId: published.anneeId,
          },
          include: { referenceGrades: true, coefficients: true },
        });

        for (const ref of published.referenceGrades ?? []) {
          await tx.chargeReferenceGrade.create({
            data: {
              rulesetId: created.id,
              gradeId: ref.gradeId,
              coefficient: ref.coefficient,
            },
          });
        }
        for (const coef of published.coefficients ?? []) {
          await tx.chargeCoefficient.create({
            data: {
              rulesetId: created.id,
              typeId: coef.typeId,
              coefficient: coef.coefficient,
            },
          });
        }

        return created;
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ChargeRuleSet',
        motif: `Nouvelle version n°${nextNumero} du jeu publié n°${published.numero}`,
      },
    );

    return this.toChargeRuleSetDto(ruleset);
  }

  // ============================================
  // Coefficients par grade (ChargeReferenceGrade)
  // ============================================

  async createChargeReferenceGrade(
    rulesetId: string,
    dto: CreateChargeReferenceGradeDto,
    userId: string = USER_ID,
  ): Promise<ChargeReferenceGradeResponseDto> {
    const ruleset = await this.prisma.chargeRuleSet.findUnique({
      where: { id: rulesetId },
    });
    if (!ruleset) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }

    const ref = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeReferenceGrade.create({
          data: {
            ruleset: { connect: { id: rulesetId } },
            ...(dto.gradeId !== undefined && {
              grade: { connect: { id: dto.gradeId } },
            }),
            coefficient: dto.coefficient,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ChargeReferenceGrade',
        objetId: rulesetId,
        motif: `Ajout coefficient par grade au jeu de règles n°${ruleset.numero}`,
      },
    );

    return new ChargeReferenceGradeResponseDto({
      id: ref.id,
      rulesetId: ref.rulesetId,
      gradeId: ref.gradeId,
      coefficient: Number(String(ref.coefficient)),
      createdAt: ref.createdAt,
    });
  }

  async updateChargeReferenceGrade(
    rulesetId: string,
    gradeId: string | null,
    coefficient: number,
    userId: string = USER_ID,
  ): Promise<ChargeReferenceGradeResponseDto> {
    const existing = await this.prisma.chargeReferenceGrade.findFirst({
      where: { rulesetId: rulesetId, gradeId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Coefficient par grade non trouvé pour ce jeu de règles',
      );
    }

    const ref = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeReferenceGrade.update({
          where: { id: existing.id },
          data: { coefficient },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ChargeReferenceGrade',
        objetId: existing.id,
        motif: `Mise à jour coefficient par grade du jeu de règles ${rulesetId}`,
      },
    );

    return new ChargeReferenceGradeResponseDto({
      id: ref.id,
      rulesetId: ref.rulesetId,
      gradeId: ref.gradeId,
      coefficient: Number(String(ref.coefficient)),
      createdAt: ref.createdAt,
    });
  }

  async removeChargeReferenceGrade(
    rulesetId: string,
    gradeId: string | null,
    userId: string = USER_ID,
  ): Promise<void> {
    const existing = await this.prisma.chargeReferenceGrade.findFirst({
      where: { rulesetId: rulesetId, gradeId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Coefficient par grade non trouvé pour ce jeu de règles',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.chargeReferenceGrade.delete({ where: { id: existing.id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'ChargeReferenceGrade',
        objetId: existing.id,
        motif: `Suppression coefficient par grade du jeu de règles ${rulesetId}`,
      },
    );
  }

  // ============================================
  // Coefficients par type d'enseignement (ChargeCoefficient)
  // ============================================

  async createChargeCoefficient(
    rulesetId: string,
    dto: CreateChargeCoefficientDto,
    userId: string = USER_ID,
  ): Promise<ChargeCoefficientResponseDto> {
    const ruleset = await this.prisma.chargeRuleSet.findUnique({
      where: { id: rulesetId },
    });
    if (!ruleset) {
      throw new NotFoundException('Jeu de règles de charge non trouvé');
    }

    const coef = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeCoefficient.create({
          data: {
            ruleset: { connect: { id: rulesetId } },
            type: { connect: { id: dto.typeId } },
            coefficient: dto.coefficient,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'ChargeCoefficient',
        objetId: rulesetId,
        motif: `Ajout coefficient par type au jeu de règles n°${ruleset.numero}`,
      },
    );

    return new ChargeCoefficientResponseDto({
      id: coef.id,
      rulesetId: coef.rulesetId,
      typeId: coef.typeId,
      coefficient: Number(String(coef.coefficient)),
      createdAt: coef.createdAt,
    });
  }

  async updateChargeCoefficient(
    rulesetId: string,
    typeId: string,
    coefficient: number,
    userId: string = USER_ID,
  ): Promise<ChargeCoefficientResponseDto> {
    const existing = await this.prisma.chargeCoefficient.findUnique({
      where: { rulesetId_typeId: { rulesetId, typeId } },
    });
    if (!existing) {
      throw new NotFoundException(
        'Coefficient par type non trouvé pour ce jeu de règles',
      );
    }

    const coef = await this.audit.auditTransaction(
      async (tx) => {
        return tx.chargeCoefficient.update({
          where: { id: existing.id },
          data: { coefficient },
        });
      },
      {
        userId,
        action: 'UPDATE',
        objetType: 'ChargeCoefficient',
        objetId: existing.id,
        motif: `Mise à jour coefficient par type du jeu de règles ${rulesetId}`,
      },
    );

    return new ChargeCoefficientResponseDto({
      id: coef.id,
      rulesetId: coef.rulesetId,
      typeId: coef.typeId,
      coefficient: Number(String(coef.coefficient)),
      createdAt: coef.createdAt,
    });
  }

  async removeChargeCoefficient(
    rulesetId: string,
    typeId: string,
    userId: string = USER_ID,
  ): Promise<void> {
    const existing = await this.prisma.chargeCoefficient.findUnique({
      where: { rulesetId_typeId: { rulesetId, typeId } },
    });
    if (!existing) {
      throw new NotFoundException(
        'Coefficient par type non trouvé pour ce jeu de règles',
      );
    }

    await this.audit.auditTransaction(
      async (tx) => {
        await tx.chargeCoefficient.delete({ where: { id: existing.id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'ChargeCoefficient',
        objetId: existing.id,
        motif: `Suppression coefficient par type du jeu de règles ${rulesetId}`,
      },
    );
  }

  // ============================================
  // Mappers
  // ============================================

  private toChargeRuleSetDto(
    ruleset: Prisma.ChargeRuleSetGetPayload<{
      include: { referenceGrades: true; coefficients: true };
    }>,
  ): ChargeRuleSetResponseDto {
    return new ChargeRuleSetResponseDto({
      id: ruleset.id,
      numero: ruleset.numero,
      periode: ruleset.periode,
      seuil: ruleset.seuil,
      plafond: ruleset.plafond,
      arrondi: ruleset.arrondi,
      publieLe: ruleset.publieLe,
      anneeId: ruleset.anneeId,
      createdAt: ruleset.createdAt,
      updatedAt: ruleset.updatedAt,
      referenceGrades: ruleset.referenceGrades.map((g) => ({
        id: g.id,
        rulesetId: g.rulesetId,
        gradeId: g.gradeId,
        coefficient: Number(String(g.coefficient)),
        createdAt: g.createdAt,
      })),
      coefficients: ruleset.coefficients.map((c) => ({
        id: c.id,
        rulesetId: c.rulesetId,
        typeId: c.typeId,
        coefficient: Number(String(c.coefficient)),
        createdAt: c.createdAt,
      })),
    });
  }
}

