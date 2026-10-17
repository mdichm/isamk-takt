// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Intercepteur d'en-tête Link pour pagination curseur (RFC 5988).
// Ajoute un en-tête Link :rel=next lorsque le corps paginé contient nextCursor.
// @see ST §3.1 : pagination curseur avec en-tête Link.

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';
import type { Request, Response } from 'express';

/**
 * Ajoute un en-tête Link (RFC 5988) avec rel=next sur les réponses paginées
 * qui contiennent un champ nextCursor dans leur corps JSON.
 * L'URL construite conserve tous les paramètres de requête existants.
 */
@Injectable()
export class LinkInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((body: unknown) => {
        // Pas d'en-tête Link sur les erreurs, les corps vides ou sans nextCursor
        if (!body || response.statusCode !== 200) {
          return;
        }

        const payload = body as Record<string, unknown>;
        const nextCursor = payload.nextCursor as string | undefined;
        if (!nextCursor) {
          return;
        }

        // Construire l'URL de la page suivante en conservant les query params existants
        const host = request.headers.host ?? 'localhost';
        const url = new URL(
          `${request.protocol ?? 'https'}://${host}${request.originalUrl}`,
        );
        url.searchParams.set('cursor', nextCursor);

        // Préserver limit s'il est déjà présent
        if (request.query.limit) {
          url.searchParams.set('limit', String(request.query.limit));
        }

        const linkHeader = `<${url.toString()}>; rel="next"`;
        response.setHeader('Link', linkHeader);
      }),
    );
  }
}
