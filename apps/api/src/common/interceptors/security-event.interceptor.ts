// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Intercepteur d'enregistrement d'événements de sécurité (L0-37)
// Capture type, userId, ip, userAgent, timestamp et détails pour chaque requête marquée.

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityEventService } from '../services/security-event.service.js';
import { SECURITY_EVENT_KEY } from '../decorators/security-event.decorator.js';

/**
 * Intercepteur qui enregistre un événement de sécurité après chaque requête
 * dont le handler est marqué par le décorateur @SecurityEvent(type).
 *
 * Les champs capturés sont : type (métadonnée), userId (utilisateur connecté),
 * ip (adresse client), userAgent (en-tête requête), timestamp (automatique DB),
 * détails (corps de requête sans données sensibles).
 */
@Injectable()
export class SecurityEventInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityEvent: SecurityEventService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const eventType = this.reflector.get<string>(
      SECURITY_EVENT_KEY,
      context.getHandler(),
    );

    // Si le handler n'est pas marqué, on ne trace rien.
    if (!eventType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as
      | { id?: string; email?: string }
      | undefined;

    // Fallback : lire l'email depuis le corps de la requête pour les routes
    // publiques (ex: login, register) où request.user n'est pas défini.
    const bodyEmail =
      typeof request.body === 'object' && request.body !== null
        ? (request.body as { email?: string }).email
        : undefined;

    return next.handle().pipe(
      tap(async () => {
        await this.securityEvent.log({
          type: eventType as any,
          userId: user?.id,
          email: user?.email ?? bodyEmail,
          ip: request.ip ?? request.socket?.remoteAddress ?? undefined,
          userAgent: request.headers['user-agent'],
          requestId:
            (request.headers['x-request-id'] as string) || undefined,
        });
      }),
    );
  }
}
