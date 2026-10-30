// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de configuration de sécurité (L0-42, EX-SEC-04)
// Lecture et mise à jour des ParametreSecurite (ligne unique id = 1).

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleCode } from '@takt/db';
import { PrismaService } from '../prisma/prisma.service.js';

export class SecurityConfigDto {
  id: number;
  longueurMin: number;
  regles: Record<string, unknown>;
  expirationJours: number;
  historique: number;
  maxEchecs: number;
  verrouillageMinutes: number;
  inactiviteMinutes: number;
  mfaRoles: RoleCode[];
  conservationAuditJours: number | null;
  conservationSecuriteJours: number;
  conservationExportJours: number | null;
  updatedAt: Date;
  updatedBy: string | null;
}

export class UpdateSecurityConfigDto {
  longueurMin?: number;
  regles?: Record<string, unknown>;
  expirationJours?: number;
  historique?: number;
  maxEchecs?: number;
  verrouillageMinutes?: number;
  inactiviteMinutes?: number;
  mfaRoles?: RoleCode[];
  conservationAuditJours?: number | null;
  conservationSecuriteJours?: number;
  conservationExportJours?: number | null;
}

@Injectable()
export class SecurityConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retourne la configuration de sécurité (ligne unique id = 1). */
  async getConfig(): Promise<SecurityConfigDto> {
    const config = await this.prisma.parametreSecurite.findUnique({
      where: { id: 1 },
    });
    if (!config) {
      throw new NotFoundException('Paramètres de sécurité introuvables');
    }
    return this.toDto(config);
  }

  /** Met à jour la configuration de sécurité. Réservé à l'Administrateur. */
  async updateConfig(
    data: UpdateSecurityConfigDto,
    updatedBy: string,
  ): Promise<SecurityConfigDto> {
    const config = await this.prisma.parametreSecurite.update({
      where: { id: 1 },
      data: {
        ...(data.longueurMin !== undefined && { longueurMin: data.longueurMin }),
        ...(data.regles !== undefined && {
          regles: data.regles as Prisma.InputJsonValue,
        }),
        ...(data.expirationJours !== undefined && {
          expirationJours: data.expirationJours,
        }),
        ...(data.historique !== undefined && { historique: data.historique }),
        ...(data.maxEchecs !== undefined && { maxEchecs: data.maxEchecs }),
        ...(data.verrouillageMinutes !== undefined && {
          verrouillageMinutes: data.verrouillageMinutes,
        }),
        ...(data.inactiviteMinutes !== undefined && {
          inactiviteMinutes: data.inactiviteMinutes,
        }),
        ...(data.mfaRoles !== undefined && { mfaRoles: data.mfaRoles }),
        ...(data.conservationAuditJours !== undefined && {
          conservationAuditJours: data.conservationAuditJours,
        }),
        ...(data.conservationSecuriteJours !== undefined && {
          conservationSecuriteJours: data.conservationSecuriteJours,
        }),
        ...(data.conservationExportJours !== undefined && {
          conservationExportJours: data.conservationExportJours,
        }),
        updatedBy,
      },
    });
    return this.toDto(config);
  }

  private toDto(config: Prisma.ParametreSecuriteGetPayload<{}>): SecurityConfigDto {
    return {
      id: config.id,
      longueurMin: config.longueurMin,
      regles: config.regles as Record<string, unknown>,
      expirationJours: config.expirationJours,
      historique: config.historique,
      maxEchecs: config.maxEchecs,
      verrouillageMinutes: config.verrouillageMinutes,
      inactiviteMinutes: config.inactiviteMinutes,
      mfaRoles: config.mfaRoles as RoleCode[],
      conservationAuditJours: config.conservationAuditJours,
      conservationSecuriteJours: config.conservationSecuriteJours,
      conservationExportJours: config.conservationExportJours,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy,
    };
  }
}
