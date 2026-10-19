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
import {
  ContrainteDefinitionService,
} from './contrainte-definition.service.js';
import {
  ContrainteDefinitionListQueryDto,
  PaginatedContrainteDefinitionsDto,
  ContrainteDefinitionResponseDto,
} from './dto/contrainte-definition.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Catalogue de contraintes')
@Controller('contraintes/definitions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContrainteDefinitionController {
  constructor(
    private readonly service: ContrainteDefinitionService,
  ) {}

  @Get()
  @Permissions('contrainte:read')
  @ApiOperation({
    summary: 'Lister le catalogue des définitions de contraintes',
    description:
      'Retourne les définitions de contraintes actives (dures/souples) avec leur schéma de paramètres, catégorie, portée et support FET. Consultable par Administrateur, Gestionnaire et Direction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des définitions de contraintes',
    type: PaginatedContrainteDefinitionsDto,
  })
  @ApiQuery({ name: 'actif', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'categorie', required: false, enum: ['DURE', 'SOUPLE'] })
  @ApiQuery({ name: 'portee', required: false, enum: ['GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async findAll(
    @Query() query: ContrainteDefinitionListQueryDto,
  ): Promise<PaginatedContrainteDefinitionsDto> {
    return this.service.findAll(query);
  }

  @Get(':code')
  @Permissions('contrainte:read')
  @ApiOperation({
    summary: 'Obtenir une définition de contrainte par son code',
  })
  @ApiParam({ name: 'code', description: 'Code de la définition (ex: MAX_HOURS_PER_DAY)' })
  @ApiResponse({
    status: 200,
    description: 'Définition trouvée',
    type: ContrainteDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Définition non trouvée' })
  async findOneByCode(
    @Param('code') code: string,
  ): Promise<ContrainteDefinitionResponseDto> {
    return this.service.findOneByCode(code);
  }
}