// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module global des métriques Prometheus
import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
