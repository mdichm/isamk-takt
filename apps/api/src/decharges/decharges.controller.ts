import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { DechargesService } from './decharges.service.js';
import {
  CreateDechargeDto,
  UpdateDechargeDto,
  DechargeResponseDto,
  PaginatedDechargesDto,
  DechargesQueryDto,
} from './dto/decharge.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Décharges')
@Controller('decharges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DechargesController {
  constructor(private dechargesService: DechargesService) {}

  @Post()
  @Permissions('decharge:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une décharge enseignant' })
  @ApiResponse({ status: 201, description: 'Décharge créée', type: DechargeResponseDto })
  @ApiResponse({ status: 409, description: 'Décharge déjà existante pour cet enseignant et semestre' })
  @ApiResponse({ status: 404, description: 'Enseignant ou semestre non trouvé' })
  async create(
    @Body() dto: CreateDechargeDto,
    @CurrentUser('id') userId: string,
  ): Promise<DechargeResponseDto> {
    return this.dechargesService.createDecharge(dto, userId);
  }

  @Get()
  @Permissions('decharge:read')
  @ApiOperation({ summary: 'Lister les décharges (paginé, filtrés)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiQuery({ name: 'enseignantId', required: false, type: String, description: 'Filtrer par enseignant' })
  @ApiQuery({ name: 'semestreId', required: false, type: String, description: 'Filtrer par semestre' })
  @ApiResponse({ status: 200, description: 'Liste paginée', type: PaginatedDechargesDto })
  async findAll(
    @Query() query: DechargesQueryDto,
  ): Promise<PaginatedDechargesDto> {
    return this.dechargesService.findAllDecharges(query);
  }

  @Get(':id')
  @Permissions('decharge:read')
  @ApiOperation({ summary: 'Obtenir une décharge par ID' })
  @ApiParam({ name: 'id', description: 'ID de la décharge (UUID)' })
  @ApiResponse({ status: 200, description: 'Décharge trouvée', type: DechargeResponseDto })
  @ApiResponse({ status: 404, description: 'Décharge non trouvée' })
  async findOne(
    @Param('id') id: string,
  ): Promise<DechargeResponseDto> {
    return this.dechargesService.findDechargeById(id);
  }

  @Patch(':id')
  @Permissions('decharge:write')
  @ApiOperation({ summary: 'Mettre à jour une décharge' })
  @ApiParam({ name: 'id', description: 'ID de la décharge (UUID)' })
  @ApiResponse({ status: 200, description: 'Décharge mise à jour', type: DechargeResponseDto })
  @ApiResponse({ status: 404, description: 'Décharge non trouvée' })
  @ApiResponse({ status: 409, description: 'Conflit d’unicité enseignant/semestre' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDechargeDto,
    @CurrentUser('id') userId: string,
  ): Promise<DechargeResponseDto> {
    return this.dechargesService.updateDecharge(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('decharge:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une décharge' })
  @ApiParam({ name: 'id', description: 'ID de la décharge (UUID)' })
  @ApiResponse({ status: 204, description: 'Décharge supprimée' })
  @ApiResponse({ status: 404, description: 'Décharge non trouvée' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.dechargesService.removeDecharge(id, userId);
  }
}