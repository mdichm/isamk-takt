// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Intercepteur de traces OpenTelemetry pour les requêtes HTTP
// Propagation du contexte de trace via requestId (API → base → worker)

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { Request, Response } from 'express';
import {
  trace,
  context,
  propagation,
  SpanStatusCode,
} from '@opentelemetry/api';
import { getCurrentRequestId } from '../logging/pino-logger.service.js';

/**
 * Intercepteur OpenTelemetry pour créer des spans sur chaque requête HTTP.
 * Le contexte de trace est propagé via les en-têtes W3C TraceContext.
 * Le requestId est utilisé comme lien entre les spans API, base de données et worker.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class TracingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      getCurrentRequestId() ||
      (request as any).requestId;

    // Extraire le contexte de trace parent depuis les en-têtes W3C
    const parentCtx = propagation.extract(context.active(), {
      'traceparent': request.headers['traceparent'],
      'tracestate': request.headers['tracestate'],
    });

    // Créer un span pour cette requête HTTP
    const tracer = trace.getTracer('takt-api');
    const span = tracer.startSpan(
      `${request.method} ${request.route?.path ?? request.url}`,
      {
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.route': request.route?.path ?? request.url,
          'http.request_id': requestId,
          'http.client_ip': request.ip ?? request.socket?.remoteAddress ?? '',
        },
      },
      parentCtx,
    );

    const startTime = process.hrtime.bigint();

    // Attacher le span au contexte pour les instruments enfants (Prisma, pg, etc.)
    trace.setSpan(context.active(), span);

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        span.setAttributes({
          'http.status_code': response.statusCode,
          'http.duration_ms': durationMs,
        });

        span.setStatus({
          code:
            response.statusCode >= 500
              ? SpanStatusCode.ERROR
              : SpanStatusCode.OK,
        });

        span.end();
      }),
      catchError((error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error?.message ?? 'Unknown error',
        });
        span.end();
        throw error;
      }),
    );
  }
}