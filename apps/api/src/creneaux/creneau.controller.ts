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
import { CreneauService } from './creneau.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateCreneauDto,
  UpdateCreneauDto,
  CreneauResponseDto,
  PaginatedCreneauxDto,
  CreneauQueryDto,
  DuplicateCreneauxDto,
  DuplicateCreneauxResponseDto,
} from './dto/creneau.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Creneaux')
@Controller('creneaux')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreneauController {
  constructor(private creneauService: CreneauService) {}

  @Post()
  @Permissions('creneaux:write')
  @ApiOperation({ summary: 'Créer un créneau ou une pause' })
  @ApiResponse({ status: 201, description: 'Créneau créé', type: CreneauResponseDto })
  @ApiResponse({ status: 409, description: 'Conflit : créneau existant ou chevauchement' })
  @ApiResponse({ status: 400, description: 'Durée non conforme (30 min requise)' })
  async createCreneau(@Body() dto: CreateCreneauDto): Promise<CreneauResponseDto> {
    return this.creneauService.createCreneau(dto, 'system');
  }

  @Post('duplicate')
  @Permissions('creneaux:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dupliquer les créneaux d\'un semestre vers un autre' })
  @ApiResponse({ status: 201, description: 'Créneaux dupliqués', type: DuplicateCreneauxResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides (même semestre source et cible)' })
  @ApiResponse({ status: 404, description: 'Semestre source ou cible introuvable' })
  @ApiResponse({ status: 409, description: 'Conflit : cible contient déjà des créneaux' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async duplicateCreneaux(@Body() dto: DuplicateCreneauxDto): Promise<DuplicateCreneauxResponseDto> {
    return this.creneauService.duplicate(dto.sourceSemestreId, dto.cibleSemestreId, 'system', dto.remplacer ?? false);
  }

  @Get()
  @Permissions('creneaux:read')
  @ApiOperation({ summary: 'Lister les créneaux avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des créneaux', type: PaginatedCreneauxDto })
  async findAllCreneaux(@Query() query: CreneauQueryDto): Promise<PaginatedCreneauxDto> {
    return this.creneauService.findAllCreneaux(query);
  }

  @Get(':id')
  @Permissions('creneaux:read')
  @ApiOperation({ summary: 'Obtenir un créneau par ID' })
  @ApiParam({ name: 'id', description: 'ID du créneau (UUID)' })
  @ApiResponse({ status: 200, description: 'Créneau trouvé', type: CreneauResponseDto })
  @ApiResponse({ status: 404, description: 'Créneau non trouvé' })
  async findCreneauById(@Param('id') id: string): Promise<CreneauResponseDto> {
    return this.creneauService.findCreneauById(id);
  }

  @Patch(':id')
  @Permissions('creneaux:write')
  @ApiOperation({ summary: 'Mettre à jour un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau (UUID)' })
  @ApiResponse({ status: 200, description: 'Créneau mis à jour', type: CreneauResponseDto })
  @ApiResponse({ status: 404, description: 'Créneau non trouvé' })
  @ApiResponse({ status: 409, description: 'Conflit : créneau existant ou chevauchement' })
  async updateCreneau(
    @Param('id') id: string,
    @Body() dto: UpdateCreneauDto,
  ): Promise<CreneauResponseDto> {
    return this.creneauService.updateCreneau(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('creneaux:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un créneau (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du créneau (UUID)' })
  @ApiResponse({ status: 204, description: 'Créneau désactivé' })
  @ApiResponse({ status: 404, description: 'Créneau non trouvé' })
  async removeCreneau(@Param('id') id: string): Promise<void> {
    return this.creneauService.removeCreneau(id, 'system');
  }
}
