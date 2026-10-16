// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Endpoint de santé /health pour Docker healthcheck et Prometheus

import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

interface HealthStatus {
  status: string;
  timestamp: string;
  services: Record<string, { status: string; latency?: number }>;
}

/**
 * Contrôleur de santé de l'API.
 * Utilisé par les healthchecks Docker et par Prometheus pour le monitoring.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: "État de santé de l’API",
    description:
      "Vérifie que l’API et ses dépendances (base de données) sont opérationnelles.",
  })
  @ApiResponse({
    status: 200,
    description: "L’API est en bonne santé",
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-10-16T10:00:00.000Z' },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                latency: { type: 'number', example: 5 },
              },
            },
          },
        },
      },
    },
  })
  async getHealth(): Promise<HealthStatus> {
    const services: Record<string, { status: string; latency?: number }> = {};
    let overallStatus = 'ok';

    // Vérification de la base de données
    const dbStart = process.hrtime.bigint();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Number(process.hrtime.bigint() - dbStart) / 1_000_000;
      services.database = { status: 'ok', latency: Math.round(dbLatency) };
    } catch {
      services.database = { status: 'error' };
      overallStatus = 'error';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    };
  }
}