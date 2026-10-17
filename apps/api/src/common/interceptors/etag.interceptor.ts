// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Intercepteur d'ETag faible (contrôle de fraîcheur/conditionnel).
// Génère un ETag faible (W/"hash") à partir du corps JSON de la réponse pour les requêtes GET.
// @see ST §3.1 : ETag sur les réponses de lecture pour le cache conditionnel (If-None-Match).

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { createHash } from 'crypto';

/**
 * Ajoute un en-tête ETag faible sur les réponses GET réussies (200) avec un corps JSON.
 * Les réponses en erreur, vides ou non-JSON ne reçoivent pas d'ETag.
 */
@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // L'ETag n'a de sens que sur les lectures (GET)
    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((body: unknown) => {
        // Pas d'ETag sur les erreurs ni sur les corps vides
        if (!body || response.statusCode !== 200) {
          return;
        }
        const etag = `W/"${createHash('sha256')
          .update(JSON.stringify(body))
          .digest('base64url')}"`;
        response.setHeader('ETag', etag);
      }),
    );
  }
}
