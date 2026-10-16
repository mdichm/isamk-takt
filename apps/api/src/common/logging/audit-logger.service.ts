// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Logger d'audit métier (séparé des logs techniques - voir PinoLoggerService)
// Conforme EX-NFR-05 : journaux techniques séparés de l'audit métier.

import { Injectable, Scope } from '@nestjs/common';
import { pino } from 'pino';

/**
 * Événements d'audit métier tracés séparément des logs techniques.
 * Utilisé pour les actions de modification de données (création, suppression, mise à jour).
 */
export type AuditEventType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VALIDATE'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'GENERATE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_RESET'
  | 'SECURITY_ALERT';

/**
 * Entrée d'audit métier.
 */
export interface AuditLogEntry {
  /** Identifiant de requête pour corrélation avec les logs techniques */
  requestId: string;
  /** Type d'événement métier */
  event: AuditEventType;
  /** Ressource concernée (ex: 'seance', 'projet', 'utilisateur') */
  resource: string;
  /** Identifiant de la ressource */
  resourceId?: string;
  /** Identifiant de l'utilisateur ayant déclenché l'action */
  userId?: string;
  /** Département de l'utilisateur (pour filtrage RBAC) */
  department?: string;
  /** Détails de l'action */
  details: Record<string, unknown>;
  /** Horodatage ISO 8601 */
  timestamp: string;
}

/**
 * Service de log d'audit métier.
 * Écrit dans un flux séparé des logs techniques (conforme EX-NFR-05).
 * Peut être envoyé vers un index Loki distinct ou un fichier d'audit dédié.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AuditLoggerService {
  private readonly logger: ReturnType<typeof pino>;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';

    this.logger = pino({
      level: process.env.AUDIT_LOG_LEVEL ?? 'info',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
              singleLine: true,
            },
          }
        : undefined,
      base: {
        service: 'takt-api',
        env: process.env.NODE_ENV,
        type: 'audit',
      },
      redact: [
        'details.password',
        'details.token',
        'details.secret',
        'userId',
      ],
    } as unknown as Parameters<typeof pino>[0]);
  }

  /**
   * Écrit une entrée d'audit métier.
   * @param entry Données de l'événement d'audit
   */
  audit(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logger.info({
      type: 'audit',
      requestId: logEntry.requestId,
      event: logEntry.event,
      resource: logEntry.resource,
      resourceId: logEntry.resourceId,
      userId: logEntry.userId,
      department: logEntry.department,
      details: logEntry.details,
      timestamp: logEntry.timestamp,
      msg: `Audit: ${logEntry.event} ${logEntry.resource}${logEntry.resourceId ? ` #${logEntry.resourceId}` : ''}`,
    });
  }

  /**
   * Log d'événement de création de ressource.
   */
  create(
    requestId: string,
    resource: string,
    resourceId: string | undefined,
    userId: string | undefined,
    details: Record<string, unknown>,
    department?: string,
  ): void {
    this.audit({
      requestId,
      event: 'CREATE',
      resource,
      resourceId,
      userId,
      department,
      details,
    });
  }

  /**
   * Log d'événement de mise à jour de ressource.
   */
  update(
    requestId: string,
    resource: string,
    resourceId: string | undefined,
    userId: string | undefined,
    details: Record<string, unknown>,
    department?: string,
  ): void {
    this.audit({
      requestId,
      event: 'UPDATE',
      resource,
      resourceId,
      userId,
      department,
      details,
    });
  }

  /**
   * Log d'événement de suppression de ressource.
   */
  remove(
    requestId: string,
    resource: string,
    resourceId: string | undefined,
    userId: string | undefined,
    details: Record<string, unknown>,
    department?: string,
  ): void {
    this.audit({
      requestId,
      event: 'DELETE',
      resource,
      resourceId,
      userId,
      department,
      details,
    });
  }

  /**
   * Log d'événement de sécurité (connexion, verrouillage, etc.).
   */
  security(
    requestId: string,
    event: AuditEventType,
    userId: string | undefined,
    details: Record<string, unknown>,
    department?: string,
  ): void {
    this.audit({
      requestId,
      event,
      resource: 'security',
      resourceId: undefined,
      userId,
      department,
      details,
    });
  }

  /**
   * Retourne l'instance pino brute pour usage avancé.
   */
  getPino(): ReturnType<typeof pino> {
    return this.logger;
  }
}