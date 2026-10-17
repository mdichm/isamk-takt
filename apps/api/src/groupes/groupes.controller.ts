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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GroupesService } from './groupes.service.js';
import {
  CreateGroupeDto,
  UpdateGroupeDto,
  GroupeResponseDto,
  PaginatedGroupesDto,
  GroupeQueryDto,
} from './dto/groupe.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Groupes hiérarchiques')
@Controller('groupes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupesController {
  constructor(private groupesService: GroupesService) {}

  // ============================================
  // Groupes
  // ============================================

  @Post()
  @Permissions('groupe:write')
  @ApiOperation({ summary: 'Créer un groupe hiérarchique' })
  @ApiResponse({ status: 201, description: 'Groupe créé', type: GroupeResponseDto })
  @ApiResponse({ status: 404, description: 'Niveau, semestre ou parent non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant ou cycle détecté' })
  async createGroupe(@Body() dto: CreateGroupeDto): Promise<GroupeResponseDto> {
    return this.groupesService.createGroupe(dto, 'system');
  }

  @Get()
  @Permissions('groupe:read')
  @ApiOperation({ summary: 'Lister les groupes avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des groupes', type: PaginatedGroupesDto })
  async findAllGroupes(@Query() query: GroupeQueryDto): Promise<PaginatedGroupesDto> {
    return this.groupesService.findAllGroupes(query);
  }

  @Get(':id')
  @Permissions('groupe:read')
  @ApiOperation({ summary: 'Obtenir un groupe par ID' })
  @ApiParam({ name: 'id', description: 'ID du groupe (UUID)' })
  @ApiResponse({ status: 200, description: 'Groupe trouvé', type: GroupeResponseDto })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  async findGroupeById(@Param('id') id: string): Promise<GroupeResponseDto> {
    return this.groupesService.findGroupeById(id);
  }

  @Patch(':id')
  @Permissions('groupe:write')
  @ApiOperation({ summary: 'Mettre à jour un groupe' })
  @ApiParam({ name: 'id', description: 'ID du groupe (UUID)' })
  @ApiResponse({ status: 200, description: 'Groupe mis à jour', type: GroupeResponseDto })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant ou cycle détecté' })
  async updateGroupe(
    @Param('id') id: string,
    @Body() dto: UpdateGroupeDto,
  ): Promise<GroupeResponseDto> {
    return this.groupesService.updateGroupe(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('groupe:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un groupe' })
  @ApiParam({ name: 'id', description: 'ID du groupe (UUID)' })
  @ApiResponse({ status: 204, description: 'Groupe supprimé' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiResponse({ status: 409, description: 'Le groupe possède des sous-groupes' })
  async removeGroupe(@Param('id') id: string): Promise<void> {
    return this.groupesService.removeGroupe(id, 'system');
  }

  @Get(':id/fermeture')
  @Permissions('groupe:read')
  @ApiOperation({ summary: 'Obtenir la fermeture hiérarchique (soi, ancêtres, descendants)' })
  @ApiParam({ name: 'id', description: 'ID du groupe (UUID)' })
  @ApiResponse({ status: 200, description: 'Fermeture hiérarchique du groupe' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  async getClosure(@Param('id') id: string) {
    return this.groupesService.getClosure(id);
  }
}