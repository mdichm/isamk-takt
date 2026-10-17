// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'audit métier append-only (EX-AUD-01, ST §2.4, §0.5)
// Écriture de l'audit dans la même transaction que l'action métier (atomicité).

import { Injectable } from '@nestjs/common';
import { Prisma, RoleCode } from '@takt/db';
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
        objetId: data.objetId ?? '',
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

  /**
   * Récupère les entrées d'audit avec filtres et pagination par curseur.
   * Le filtrage par périmètre s'applique selon le rôle de l'utilisateur :
   * - ADMINISTRATEUR : tout l'audit
   * - GESTIONNAIRE / RESPONSABLE_DEPARTEMENT : uniquement ses propres actions (userId)
   * - DIRECTION : lecture seule, tout l'audit (pas de restriction de périmètre métier)
   *
   * @param query Filtres et pagination
   * @param currentUser Utilisateur connecté (id, role, departments)
   * @returns Entrées d'audit paginées
   */
  async findAll(
    query: { objetType?: string; objetId?: string; userId?: string; from?: string; to?: string; limit?: number; cursor?: string },
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<{ data: AuditEntryDto[]; nextCursor: string | null }> {
    const limit = Math.min(query.limit ?? 50, 100);
    const take = limit + 1; // on récupère un élément de plus pour détecter la page suivante

    const where: Prisma.AuditLogWhereInput = {};

    // Filtres métier
    if (query.objetType) where.objetType = query.objetType;
    if (query.objetId) where.objetId = query.objetId;
    if (query.userId) where.userId = query.userId;
    if (query.from || query.to) {
      where.at = {};
      if (query.from) where.at.gte = new Date(query.from);
      if (query.to) where.at.lte = new Date(query.to);
    }

    // Filtrage par périmètre selon le rôle (ST §5.3)
    const isAdmin = currentUser.role === RoleCode.ADMINISTRATEUR;
    const isDirection = currentUser.role === RoleCode.DIRECTION;

    if (!isAdmin && !isDirection) {
      // GESTIONNAIRE et RESPONSABLE_DEPARTEMENT ne voient que leurs propres actions
      where.userId = currentUser.id;
    }

    // Pagination par curseur
    const cursor = query.cursor ? { id: BigInt(query.cursor) } : undefined;
    const skip = cursor ? 1 : 0;

    const [audits, totalCount] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take,
        skip,
        cursor,
        orderBy: { at: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const hasNextPage = audits.length > limit;
    const data = hasNextPage ? audits.slice(0, -1) : audits;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id.toString() ?? null : null;

    return {
      data: data.map((a) => this.toDto(a)),
      nextCursor,
    };
  }
}
