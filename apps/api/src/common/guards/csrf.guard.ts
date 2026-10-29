// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Guard CSRF : rejette les requêtes mutantes sans en-tête X-CSRF-Token
// ni Origin dans la liste blanche CORS (ST §5.3, EX-SEC-08).

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard CSRF appliqué globalement.
 * Pour les méthodes mutantes (POST/PUT/PATCH/DELETE) :
 *  - exige l'en-tête X-CSRF-Token
 *  - exige que l'en-tête Origin (si présent) figure dans la liste blanche CORS
 *
 * Les routes publiques (/auth/*, /, /health/*) sont exclues.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  private readonly corsOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const raw = configService.get<string>('app.cors.origin') ?? '';
    this.corsOrigins = raw
      .split(',')
      .map((o: string) => o.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Routes publiques non protégées par CSRF
    if (
      req.path.startsWith('/auth/') ||
      req.path === '/' ||
      req.path.startsWith('/health')
    ) {
      return true;
    }

    // Seules les méthodes mutantes sont vérifiées
    if (!this.mutatingMethods.has(req.method)) {
      return true;
    }

    const token = req.headers['x-csrf-token'];
    if (!token) {
      throw new ForbiddenException('CSRF token manquant (en-tête X-CSRF-Token requis)');
    }

    const origin = req.headers.origin;
    if (origin && !this.corsOrigins.includes(origin as string)) {
      throw new ForbiddenException('Origin non autorisée par la liste blanche CORS');
    }

    return true;
  }
}
