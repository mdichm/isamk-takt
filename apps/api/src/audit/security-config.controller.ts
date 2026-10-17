// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de configuration de sécurité (L0-42, EX-SEC-04)
// GET/PATCH des paramètres de sécurité (réservé à l'Administrateur).

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SecurityConfigService, SecurityConfigDto, UpdateSecurityConfigDto } from './security-config.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  id: string;
  role: string;
}

@ApiTags('Security Config')
@Controller('parametres-securite')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SecurityConfigController {
  constructor(private readonly securityConfig: SecurityConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lire les paramètres de sécurité (Administrateur uniquement)' })
  @ApiResponse({ status: 200, description: 'Paramètres de sécurité', type: SecurityConfigDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux administrateurs' })
  async getConfig(): Promise<SecurityConfigDto> {
    return this.securityConfig.getConfig();
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour les paramètres de sécurité (Administrateur uniquement)' })
  @ApiResponse({ status: 200, description: 'Paramètres de sécurité mis à jour', type: SecurityConfigDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux administrateurs' })
  async updateConfig(
    @Body() data: UpdateSecurityConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SecurityConfigDto> {
    return this.securityConfig.updateConfig(data, user.id);
  }
}
