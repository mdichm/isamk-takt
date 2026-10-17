// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'enregistrement d'événements de sécurité (EX-SEC-09, L0-37)
// Écriture asynchrone dans la table security_events (append-only, déclencheur DB).
// Lecture réservée aux administrateurs avec filtres et pagination par curseur.

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@takt/db';
import { PrismaService } from '../../prisma/prisma.service.js';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'TOKEN_REUSE'
  | 'ACCOUNT_LOCKED'
  | 'MFA_ENABLE'
  | 'MFA_DISABLE'
  | 'MFA_FAILURE'
  | 'PASSWORD_RESET'
  | 'EXPORT_ACCESS'
  | 'ROLE_CHANGE'
  | 'SECURITY_ALERT'
  | 'SECURITY_READ';

export interface SecurityEventInput {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

/**
 * Entrée d'événement de sécurité retournée après lecture.
 */
export interface SecurityEventEntry {
  id: string;
  at: Date;
  type: string;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
}

/**
 * Service d'enregistrement et de consultation des événements de sécurité.
 * L'écriture est volontairement tolérante aux pannes : une erreur d'enregistrement
 * ne doit jamais faire échouer la requête métier qui l'a déclenchée.
 */
@Injectable()
export class SecurityEventService {
  private readonly logger = new Logger(SecurityEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre un événement de sécurité de façon asynchrone.
   * Toute erreur est interceptée et journalisée, jamais propagée.
   *
   * @param input Données de l'événement à enregistrer
   */
  async log(input: SecurityEventInput): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          type: input.type,
          userId: input.userId ?? null,
          email: input.email ?? null,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          requestId: input.requestId ?? null,
          details: input.details
            ? (input.details as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec de l'écriture de l'événement de sécurité: ${input.type}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Récupère les événements de sécurité avec filtres et pagination par curseur.
   * Réservé aux administrateurs (garde AdminGuard appliqué au contrôleur).
   *
   * @param query Filtres et pagination
   * @returns Événements paginés
   */
  async findAll(
    query: {
      type?: string;
      userId?: string;
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
    },
  ): Promise<{ data: SecurityEventEntry[]; nextCursor: string | null }> {
    const limit = Math.min(query.limit ?? 50, 100);
    const take = limit + 1; // un élément de plus pour détecter la page suivante

    const where: Prisma.SecurityEventWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.userId) where.userId = query.userId;
    if (query.from || query.to) {
      where.at = {};
      if (query.from) where.at.gte = new Date(query.from);
      if (query.to) where.at.lte = new Date(query.to);
    }

    const cursor = query.cursor ? { id: BigInt(query.cursor) } : undefined;
    const skip = cursor ? 1 : 0;

    const events = await this.prisma.securityEvent.findMany({
        where,
        take,
        skip,
        cursor,
        orderBy: { at: 'desc' },
      });

    const hasNextPage = events.length > limit;
    const data = hasNextPage ? events.slice(0, -1) : events;
    const nextCursor = hasNextPage
      ? data[data.length - 1]?.id.toString() ?? null
      : null;

    return {
      data: data.map((e) => this.toDto(e)),
      nextCursor,
    };
  }

  private toDto(event: Prisma.SecurityEventGetPayload<{}>): SecurityEventEntry {
    return {
      id: event.id.toString(),
      at: event.at,
      type: event.type,
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      userAgent: event.userAgent,
      requestId: event.requestId,
      details: (event.details as
        | Record<string, unknown>
        | null) ?? null,
    };
  }
}
