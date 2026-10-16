// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'audit métier append-only (EX-AUD-01, ST §2.4, §0.5)
// Écriture de l'audit dans la même transaction que l'action métier (atomicité).

import { Injectable } from '@nestjs/common';
import { Prisma } from '@takt/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { WriteAuditDto, AuditEntryDto } from './dto/audit.dto.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Écrit une entrée d'audit dans une transaction Prisma donnée.
   * L'écriture métier et l'audit doivent être passés dans le même PrismaService
   * transactionnel pour garantir l'atomicité (ST §0.5).
   *
   * @param tx Client Prisma transactionnel
   * @param data Données d'audit à écrire
   */
  async writeAudit(
    tx: PrismaService,
    data: WriteAuditDto,
  ): Promise<AuditEntryDto> {
    const audit = await tx.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        objetType: data.objetType,
        objetId: data.objetId,
        ancienneValeur: (data.ancienneValeur as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput) ?? Prisma.JsonNull,
        nouvelleValeur: (data.nouvelleValeur as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput) ?? Prisma.JsonNull,
        versionId: data.versionId ?? null,
        motif: data.motif ?? null,
        requestId: data.requestId ?? null,
        ip: data.ip ?? null,
      },
    });

    return this.toDto(audit);
  }

  /**
   * Exécute une opération métier et écrit l'audit associé dans la même
   * transaction Prisma, garantissant l'atomicité. Si l'opération métier
   * échoue, l'audit n'est pas écrit et la transaction est rollbackée.
   *
   * @param operation Fonction métier recevant le client Prisma transactionnel
   * @param auditData Données d'audit à écrire après l'opération métier
   * @returns Résultat de l'opération métier
   */
  async auditTransaction<T>(
    operation: (tx: PrismaService) => Promise<T>,
    auditData: WriteAuditDto,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // Le client de transaction Prisma est structurellement identique à
      // PrismaService pour les opérations de modèle (auditLog, user, etc.).
      const txService = tx as unknown as PrismaService;
      const result = await operation(txService);
      await this.writeAudit(txService, auditData);
      return result;
    });
  }

  private toDto(audit: Prisma.AuditLogGetPayload<{}>): AuditEntryDto {
    return {
      id: audit.id.toString(),
      at: audit.at,
      userId: audit.userId,
      action: audit.action,
      objetType: audit.objetType,
      objetId: audit.objetId,
      ancienneValeur: audit.ancienneValeur as
        | Record<string, unknown>
        | null,
      nouvelleValeur: audit.nouvelleValeur as
        | Record<string, unknown>
        | null,
      versionId: audit.versionId,
      motif: audit.motif,
      requestId: audit.requestId,
      ip: audit.ip,
    };
  }
}
