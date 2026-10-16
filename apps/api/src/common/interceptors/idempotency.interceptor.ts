// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Intercepteur d'idempotence (en-tête Idempotency-Key).
// Rejoue la réponse cached pour une clé déjà vue sur un POST de création / lancement de job.

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Request, Response } from 'express';
import { IdempotencyStore } from '../services/idempotency.store.js';

/**
 * Clé de stockage construite à partir de l'Idempotency-Key et de l'URL de la requête,
 * afin qu'une clé réutilisée sur un autre endpoint ne collisionne pas.
 */
function buildCacheKey(request: Request): string | undefined {
  const key = request.headers['idempotency-key'] as string | undefined;
  if (!key) return undefined;
  return `${key}:${request.method}:${request.originalUrl}`;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const cacheKey = buildCacheKey(request);
    if (!cacheKey) {
      return next.handle();
    }

    // Réponse déjà en cache pour cette clé : la renvoyer telle quelle
    const cached = IdempotencyStore.get(cacheKey);
    if (cached) {
      response.status(cached.statusCode);
      Object.entries(cached.headers).forEach(([name, value]) => {
        response.setHeader(name, value);
      });
      return of(cached.body);
    }

    // Première exécution : capturer la réponse et la mettre en cache
    return next.handle().pipe(
      tap((body: unknown) => {
        const statusCode = response.statusCode;
        const headers: Record<string, string> = {};
        // Capturer les en-têtes significatifs (content-type, location, etc.)
        const headerNames = response.getHeaderNames();
        for (const name of headerNames) {
          const value = response.getHeader(name);
          if (typeof value === 'string') {
            headers[name] = value;
          }
        }
        IdempotencyStore.set(cacheKey, { statusCode, headers, body });
      }),
    );
  }
}
