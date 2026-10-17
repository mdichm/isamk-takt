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
import { ActivityTagsService } from './activity-tags.service.js';
import {
  CreateActivityTagDto,
  UpdateActivityTagDto,
  ActivityTagResponseDto,
  PaginatedActivityTagsDto,
  ActivityTagsQueryDto,
} from './dto/activity-tag.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Activity Tags')
@Controller('activity-tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityTagsController {
  constructor(private activityTagsService: ActivityTagsService) {}

  @Post()
  @Permissions('activity-tag:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un tag activité' })
  @ApiResponse({ status: 201, description: 'Tag créé', type: ActivityTagResponseDto })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async create(
    @Body() dto: CreateActivityTagDto,
    @CurrentUser('id') userId: string,
  ): Promise<ActivityTagResponseDto> {
    return this.activityTagsService.createActivityTag(dto, userId);
  }

  @Get()
  @Permissions('activity-tag:read')
  @ApiOperation({ summary: 'Lister les tags activité (paginé)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche texte' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par activité' })
  @ApiResponse({ status: 200, description: 'Liste paginée', type: PaginatedActivityTagsDto })
  async findAll(
    @Query() query: ActivityTagsQueryDto,
  ): Promise<PaginatedActivityTagsDto> {
    return this.activityTagsService.findAllActivityTags(query);
  }

  @Get(':id')
  @Permissions('activity-tag:read')
  @ApiOperation({ summary: 'Obtenir un tag activité par ID' })
  @ApiParam({ name: 'id', description: 'ID du tag activité (UUID)' })
  @ApiResponse({ status: 200, description: 'Tag trouvé', type: ActivityTagResponseDto })
  @ApiResponse({ status: 404, description: 'Tag activité non trouvé' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ActivityTagResponseDto> {
    return this.activityTagsService.findActivityTagById(id);
  }

  @Patch(':id')
  @Permissions('activity-tag:write')
  @ApiOperation({ summary: 'Mettre à jour un tag activité' })
  @ApiParam({ name: 'id', description: 'ID du tag activité (UUID)' })
  @ApiResponse({ status: 200, description: 'Tag mis à jour', type: ActivityTagResponseDto })
  @ApiResponse({ status: 404, description: 'Tag activité non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityTagDto,
    @CurrentUser('id') userId: string,
  ): Promise<ActivityTagResponseDto> {
    return this.activityTagsService.updateActivityTag(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('activity-tag:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un tag activité (interdit si référencé)' })
  @ApiParam({ name: 'id', description: 'ID du tag activité (UUID)' })
  @ApiResponse({ status: 204, description: 'Tag supprimé' })
  @ApiResponse({ status: 404, description: 'Tag activité non trouvé' })
  @ApiResponse({ status: 409, description: 'Tag référencé, suppression interdite' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.activityTagsService.removeActivityTag(id, userId);
  }
}