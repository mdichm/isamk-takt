// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur pour opérations bulk sur verrous (L3-37)

import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { BulkPoseVerrouDto } from './dto/bulk-pose-verrou.dto.js';
import { BulkPoseResponseDto } from './dto/bulk-pose-response.dto.js';
import { VerrouPreviewResponseDto } from './dto/verrou-preview-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Verrous')
@ApiBearerAuth()
@Controller('versions/:versionId/verrous')
export class VerrouBulkController {
  constructor(private readonly verrouService: VerrouSeanceService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pose en masse de verrous (groupe, enseignant ou salle)',
    description:
      'Pose des verrous sur toutes les séances appartenant à un groupe, un enseignant ou une salle dans une version donnée. Ignore les séances déjà verrouillées du même type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verrous posés (ou ignorés si déjà existants)',
    type: BulkPoseResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Accès réservé Gestionnaire/Administrateur' })
  @ApiResponse({ status: 423, description: 'Version immuable (PUBLIE/ARCHIVE)' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async bulkPose(
    @Param('versionId') versionId: string,
    @Body() dto: BulkPoseVerrouDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<BulkPoseResponseDto> {
    // Idempotency handled by global IdempotencyInterceptor via Idempotency-Key header
    return this.verrouService.bulkPose(
      versionId,
      dto.cible,
      dto.type,
      dto.justification,
      currentUser.id,
      currentUser,
    );
  }
}

@Controller('verrous')
export class VerrouDeleteController {
  constructor(private readonly verrouService: VerrouSeanceService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lève un verrou (avec preview optionnel)',
    description:
      "Lève un verrou de séance. Avec `?preview=true`, retourne l'impact sans persister. Sans query param, lève réellement le verrou.",
  })
  @ApiResponse({
    status: 200,
    description: 'Verrou levé ou preview de l\'impact',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/VerrouSeanceResponseDto' },
        { $ref: '#/components/schemas/VerrouPreviewResponseDto' },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Accès réservé Gestionnaire/Administrateur' })
  @ApiResponse({ status: 404, description: 'Verrou introuvable' })
  @ApiResponse({ status: 409, description: 'Verrou déjà levé' })
  async leve(
    @Param('id') verrouId: string,
    @Query('preview', new ParseBoolPipe({ optional: true })) preview: boolean = false,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouPreviewResponseDto | any> {
    return this.verrouService.leveWithPreview(verrouId, currentUser, preview);
  }
}