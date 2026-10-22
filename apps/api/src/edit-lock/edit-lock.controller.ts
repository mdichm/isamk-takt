// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur du bail d'édition exclusif (L3-19)
// POST /versions/{id}/edit-lock — acquérir / renouveler un bail
// DELETE /versions/{id}/edit-lock — libérer un bail (force si admin)

import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { EditLockService } from './edit-lock.service.js';
import { EditLockResponseDto } from './dto/edit-lock-response.dto.js';

interface ForceReleaseDto {
  force?: boolean;
}

// ============================================================================
// EditLock (L3-19)
// ============================================================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('edit-lock')
@Controller('versions/:versionId/edit-lock')
export class EditLockController {
  constructor(private readonly service: EditLockService) {}

  /**
   * Acquiert ou renouvelle un bail d'édition sur une version.
   * Si un autre utilisateur détient le bail actif, répond 423 EDIT_LOCK_HELD.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions('version:edit-lock')
  @ApiOperation({
    summary: 'Acquérir ou renouveler un bail d\'édition sur une version',
    description: 'Crée un bail de 30 minutes. Renouvelle si déjà détenu par l\'appelant. Refuse 423 si détenu par un autre.',
  })
  @ApiParam({ name: 'versionId', type: String, description: 'Identifiant de la version' })
  @ApiResponse({
    status: 200,
    description: 'Bail acquis ou renouvelé',
    type: EditLockResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiResponse({
    status: 423,
    description: 'Bail déjà détenu par un autre utilisateur (EDIT_LOCK_HELD)',
  })
  async acquire(
    @Param('versionId') versionId: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EditLockResponseDto> {
    return this.service.acquire(versionId, currentUser.id, currentUser);
  }

  /**
   * Libère un bail d'édition.
   * Le propriétaire libère son propre bail. Un administrateur peut forcer la libération (query ?force=true).
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('version:edit-lock')
  @ApiOperation({
    summary: 'Libérer un bail d\'édition',
    description: 'Le propriétaire libère son propre bail. Un administrateur peut forcer avec ?force=true.',
  })
  @ApiParam({ name: 'versionId', type: String, description: 'Identifiant de la version' })
  @ApiResponse({
    status: 204,
    description: 'Bail libéré (ou aucun bail existant)',
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou non propriétaire' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async release(
    @Param('versionId') versionId: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
    @Body() body: ForceReleaseDto,
  ): Promise<void> {
    return this.service.release(versionId, currentUser.id, currentUser, !!body?.force);
  }
}
