// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Logger structuré pino avec requestId
// Journaux techniques (séparés de l'audit métier - voir AuditLoggerService)

import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { pino } from 'pino';

/**
 * Contexte de requête propagé via AsyncLocalStorage.
 * Permet au logger d'accéder au requestId sans passer l'objet request en paramètre.
 */
interface RequestContext {
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Récupère le requestId du contexte de requête actuel.
 */
function getCurrentRequestId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.requestId;
}

/**
 * Récupère le contexte de requête complet.
 */
function getCurrentContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Exécute une fonction dans un contexte de requête donné.
 */
function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Service de log structuré pino.
 * Chaque entrée de journal inclut automatiquement le `requestId` de la requête en cours
 * (propagé via AsyncLocalStorage par RequestIdMiddleware).
 * Les journaux techniques sont séparés de l'audit métier (AuditLoggerService).
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements LoggerService {
  private readonly logger: ReturnType<typeof pino>;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';

    this.logger = pino({
      level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname,requestId',
              singleLine: true,
            },
          }
        : undefined,
      base: {
        service: 'takt-api',
        env: process.env.NODE_ENV,
      },
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.confirmPassword',
        'res.headers.set-cookie',
      ],
    } as unknown as Parameters<typeof pino>[0]);
  }

  private enrich(message: string): Record<string, unknown> {
    const ctx = getCurrentContext();
    return {
      msg: message,
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.method ? { http_method: ctx.method } : {}),
      ...(ctx?.url ? { http_url: ctx.url } : {}),
      ...(ctx?.ip ? { client_ip: ctx.ip } : {}),
    };
  }

  log(message: string, ..._optionalParams: unknown[]): void {
    this.logger.info(this.enrich(message));
  }

  error(message: string, trace?: string, ..._optionalParams: unknown[]): void {
    this.logger.error({
      ...this.enrich(message),
      ...(trace ? { stack: trace } : {}),
    });
  }

  warn(message: string, ..._optionalParams: unknown[]): void {
    this.logger.warn(this.enrich(message));
  }

  debug(message: string, ..._optionalParams: unknown[]): void {
    this.logger.debug(this.enrich(message));
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    this.logger.debug(this.enrich(message));
  }

  /**
   * Log structuré avec champs personnalisés.
   */
  info(
    message: string,
    fields: Record<string, unknown>,
    ...optionalParams: unknown[]
  ): void {
    this.logger.info({
      ...this.enrich(message),
      ...fields,
    });
  }

  /**
   * Log d'erreur structuré avec champs personnalisés.
   */
  errorStructured(
    message: string,
    fields: Record<string, unknown>,
    ...optionalParams: unknown[]
  ): void {
    this.logger.error({
      ...this.enrich(message),
      ...fields,
    });
  }

  /**
   * Retourne l'instance pino brute pour usage avancé (ex. child loggers).
   */
  getPino(): ReturnType<typeof pino> {
    return this.logger;
  }
}

/**
 * Export des utilitaires de contexte pour le middleware et les intercepteurs.
 */
export { asyncLocalStorage, runWithRequestContext, getCurrentRequestId };