// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur d'espace Direction (L5-29)
// Lecture seule : plannings publiés/archivés, répartition, charges, contraintes, audit, exports officiels.
// Aucune route POST/PATCH/DELETE n'est exposée sous ce préfixe.
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DirectionService } from './direction.service.js';
import { SeanceQueryDto } from '../seances/dto/seance-query.dto.js';
import { SeanceResponseDto } from '../seances/dto/seance-response.dto.js';
import {
  RepartitionQueryDto,
  PaginatedRepartitionsDto,
} from '../repartitions/dto/repartition.dto.js';
import {
  ChargeQueryDto,
  PaginatedChargesDto,
} from '../charges/dto/charge.dto.js';
import {
  ContrainteDefinitionListQueryDto,
  PaginatedContrainteDefinitionsDto,
} from '../contraintes/dto/contrainte-definition.dto.js';
import { DirectionVersionDto } from './dto/direction-version.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

interface AuditQuery {
  objetType?: string;
  objetId?: string;
  userId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

@ApiTags('Espace Direction')
@Controller('direction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DirectionController {
  constructor(private readonly direction: DirectionService) {}

  @Get('versions')
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Lister les versions publiées et archivées',
    description:
      'Retourne les versions dont le statut est VALIDE, PUBLIE ou ARCHIVE. Réservée à la Direction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des versions publiées/archivées',
    type: DirectionVersionDto,
    isArray: true,
  })
  async findVersions(): Promise<DirectionVersionDto[]> {
    return this.direction.findVersions();
  }

  @Get('versions/:versionId/seances')
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Lister les séances d\'une version publiée ou archivée',
    description:
      "Les versions de travail (BROUILLON, EDITION, VALIDE non publiée...) retournent une 404 pour la Direction.",
  })
  @ApiParam({ name: 'versionId', description: 'Identifiant de la version' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'jour', required: false, type: String })
  @ApiQuery({ name: 'enseignantId', required: false, type: String })
  @ApiQuery({ name: 'salleId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Séances paginées de la version',
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({
    status: 404,
    description: 'Version non trouvée ou non publiée',
  })
  async findSeancesByVersion(
    @Param('versionId') versionId: string,
    @Query() query: SeanceQueryDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<{
    data: SeanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.direction.findSeancesByVersion(versionId, query, currentUser);
  }

  @Get('versions/:versionId/seances/:seanceId')
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Détail d\'une séance d\'une version publiée ou archivée',
  })
  @ApiParam({ name: 'versionId', description: 'Identifiant de la version' })
  @ApiParam({ name: 'seanceId', description: 'Identifiant de la séance' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la séance',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({
    status: 404,
    description: 'Séance non trouvée ou non publiée',
  })
  async findSeanceById(
    @Param('seanceId') seanceId: string,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.direction.findSeanceById(seanceId, currentUser);
  }

  @Get('repartitions')
  @Permissions('repartition:read')
  @ApiOperation({
    summary: 'Lister les répartitions (lecture seule pour la Direction)',
  })
  @ApiResponse({
    status: 200,
    description: 'Répartitions paginées',
    type: PaginatedRepartitionsDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'semestreId', required: false, type: String })
  async findRepartitions(
    @Query() query: RepartitionQueryDto,
  ): Promise<PaginatedRepartitionsDto> {
    return this.direction.findRepartitions(query, {
      id: '',
      role: 'DIRECTION',
    } as { id: string; role: string; departments?: string[] });
  }

  @Get('charges')
  @Permissions('charges:read')
  @ApiOperation({
    summary: 'Lister les charges (lecture seule pour la Direction)',
  })
  @ApiResponse({
    status: 200,
    description: 'Charges paginées',
    type: PaginatedChargesDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'enseignantId', required: false, type: String })
  @ApiQuery({ name: 'departementId', required: false, type: String })
  async findCharges(
    @Query() query: ChargeQueryDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedChargesDto> {
    return this.direction.findCharges(query, currentUser);
  }

  @Get('contraintes')
  @Permissions('contrainte:read')
  @ApiOperation({
    summary:
      'Lister les définitions de contraintes (lecture seule pour la Direction)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraintes paginées',
    type: PaginatedContrainteDefinitionsDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  @ApiQuery({
    name: 'categorie',
    required: false,
    enum: ['DURE', 'SOUPLE'],
  })
  async findContraintes(
    @Query() query: ContrainteDefinitionListQueryDto,
  ): Promise<PaginatedContrainteDefinitionsDto> {
    return this.direction.findContraintes(query);
  }

  @Get('audit')
  @Permissions('audit:read')
  @ApiOperation({
    summary: 'Lister les entrées d\'audit (lecture seule pour la Direction)',
  })
  @ApiResponse({ status: 200, description: 'Entrées d\'audit paginées' })
  @ApiQuery({ name: 'objetType', required: false, type: String })
  @ApiQuery({ name: 'objetId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async findAudit(
    @Query() query: AuditQuery,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ) {
    return this.direction.findAudit(query, currentUser);
  }

  @Get('exports')
  @Permissions('export:create')
  @ApiOperation({
    summary: 'Lister les exports officiels disponibles pour la Direction',
  })
  @ApiResponse({
    status: 200,
    description: 'Métadonnées des exports disponibles',
  })
  async findExports() {
    return this.direction.findExports();
  }
}
