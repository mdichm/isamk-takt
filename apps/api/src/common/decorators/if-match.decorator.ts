// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Décorateur d'extraction de l'en-tête If-Match (contrôle optimiste).
// @see ST §3.1 : If-Match obligatoire sur les modifications de séance et de version.
// Renvoie 412 PRECONDITION_FAILED si l'en-tête est absent.

import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Extrait la valeur de l'en-tête `If-Match` de la requête.
 * Utilisé par le décorateur `@IfMatch()`.
 * Lance une HttpException 412 si l'en-tête est absent.
 */
export function extractIfMatch(request: Request): string | undefined {
  const ifMatch = request.headers['if-match'] as string | undefined;
  if (!ifMatch) {
    throw new HttpException(
      {
        message: 'En-tête If-Match requis pour cette modification',
        error: 'Precondition Failed',
        errorCode: 'PRECONDITION_FAILED',
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }
  return ifMatch;
}

/**
 * Décorateur de paramètre NestJS extrayant l'en-tête `If-Match`.
 * @see ST §3.1
 */
export const IfMatch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return extractIfMatch(request);
  },
);
