import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { IndisponibiliteService } from './indisponibilite.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateIndisponibiliteDto,
  UpdateIndisponibiliteDto,
  IndisponibiliteResponseDto,
  PaginatedIndisponibilitesDto,
  IndisponibiliteQueryDto,
} from './dto/indisponibilite.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Indisponibilites')
@Controller('indisponibilites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IndisponibiliteController {
  constructor(private indisponibiliteService: IndisponibiliteService) {}

  @Post()
  @Permissions('indisponibilite:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une indisponibilité (enseignant XOR salle)' })
  @ApiResponse({ status: 201, description: 'Indisponibilité créée', type: IndisponibiliteResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides (XOR enseignant/salle requis)' })
  @ApiResponse({ status: 404, description: 'Semestre, enseignant ou salle introuvable' })
  @ApiResponse({ status: 409, description: 'Conflit : indisponibilité déjà existante' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async createIndisponibilite(
    @Body() dto: CreateIndisponibiliteDto,
  ): Promise<IndisponibiliteResponseDto> {
    return this.indisponibiliteService.createIndisponibilite(dto, 'system');
  }

  @Get()
  @Permissions('indisponibilite:read')
  @ApiOperation({ summary: 'Lister les indisponibilités avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des indisponibilités', type: PaginatedIndisponibilitesDto })
  async findAllIndisponibilites(@Query() query: IndisponibiliteQueryDto): Promise<PaginatedIndisponibilitesDto> {
    return this.indisponibiliteService.findAllIndisponibilites(query);
  }

  @Get(':id')
  @Permissions('indisponibilite:read')
  @ApiOperation({ summary: 'Obtenir une indisponibilité par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'indisponibilité (UUID)' })
  @ApiResponse({ status: 200, description: 'Indisponibilité trouvée', type: IndisponibiliteResponseDto })
  @ApiResponse({ status: 404, description: 'Indisponibilité non trouvée' })
  async findIndisponibiliteById(@Param('id') id: string): Promise<IndisponibiliteResponseDto> {
    return this.indisponibiliteService.findIndisponibiliteById(id);
  }

  @Patch(':id')
  @Permissions('indisponibilite:write')
  @ApiOperation({ summary: 'Mettre à jour une indisponibilité' })
  @ApiParam({ name: 'id', description: 'ID de l\'indisponibilité (UUID)' })
  @ApiResponse({ status: 200, description: 'Indisponibilité mise à jour', type: IndisponibiliteResponseDto })
  @ApiResponse({ status: 404, description: 'Indisponibilité non trouvée' })
  @ApiResponse({ status: 409, description: 'Conflit : indisponibilité déjà existante' })
  async updateIndisponibilite(
    @Param('id') id: string,
    @Body() dto: UpdateIndisponibiliteDto,
  ): Promise<IndisponibiliteResponseDto> {
    return this.indisponibiliteService.updateIndisponibilite(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('indisponibilite:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une indisponibilité (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'indisponibilité (UUID)' })
  @ApiResponse({ status: 204, description: 'Indisponibilité désactivée' })
  @ApiResponse({ status: 404, description: 'Indisponibilité non trouvée' })
  async removeIndisponibilite(@Param('id') id: string): Promise<void> {
    return this.indisponibiliteService.removeIndisponibilite(id, 'system');
  }
}