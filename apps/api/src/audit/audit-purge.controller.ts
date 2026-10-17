// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de purge des journaux (L0-41, EX-AUD-02)
// Déclenche la purge des journaux d'audit et de sécurité (réservé aux administrateurs).

import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditPurgeService, PurgeResult } from './audit-purge.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

@ApiTags('Audit Purge')
@Controller('audit/purge')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AuditPurgeController {
  constructor(private readonly purgeService: AuditPurgeService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Déclenche la purge des journaux d\'audit et de sécurité',
    description:
      'Purge les anciennes entrées selon les durées de conservation configurées ' +
      'dans les paramètres de sécurité. Réservé aux administrateurs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Purge effectuée',
    type: PurgeResult,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux administrateurs' })
  async purge(): Promise<PurgeResult> {
    return this.purgeService.purge();
  }
}
