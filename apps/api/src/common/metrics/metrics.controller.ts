// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Endpoint Prometheus /metrics

import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Registry } from 'prom-client';
import { MetricsService } from './metrics.service.js';

/**
 * Contrôleur exposant les métriques Prometheus sur /metrics.
 * Endpoint technique (non authentifié, accessible depuis le réseau de monitoring).
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Métriques Prometheus',
    description:
      'Exposition des métriques au format Prometheus pour collecte par le serveur Prometheus.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métriques au format texte Prometheus',
  })
  async getMetrics(): Promise<string> {
    const registry: Registry = this.metricsService.getRegistry();
    return registry.metrics();
  }
}