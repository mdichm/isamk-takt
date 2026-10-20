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
import { CreneauxAffichageService } from './creneaux-affichage.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateCreneauAffichageDto,
  UpdateCreneauAffichageDto,
  CreneauAffichageResponseDto,
  CreneauxAffichageQueryDto,
  PaginatedCreneauxAffichagesDto,
  DuplicateCreneauxAffichageDto,
  DuplicateCreneauxAffichageResponseDto,
} from './dto/creneaux-affichage.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('CreneauxAffichage')
@Controller('creneaux-affichage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreneauxAffichageController {
  constructor(private creneauxAffichageService: CreneauxAffichageService) {}

  @Post()
  @Permissions('creneau-affichage:write')
  @ApiOperation({ summary: 'Créer une correspondance d\'affichage Ramadan' })
  @ApiResponse({ status: 201, description: 'Affichage créé', type: CreneauAffichageResponseDto })
  @ApiResponse({ status: 409, description: 'Conflit : pause, doublon ou chevauchement' })
  @ApiResponse({ status: 400, description: 'Heure de fin antérieure au début' })
  @ApiResponse({ status: 404, description: 'Créneau introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async create(
    @Body() dto: CreateCreneauAffichageDto,
  ): Promise<CreneauAffichageResponseDto> {
    return this.creneauxAffichageService.create(dto, 'system');
  }

  @Post('duplicate')
  @Permissions('creneau-affichage:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dupliquer les correspondances d\'affichage d\'un semestre vers un autre' })
  @ApiResponse({ status: 201, description: 'Correspondances dupliquées', type: DuplicateCreneauxAffichageResponseDto })
  @ApiResponse({ status: 400, description: 'Semestres identiques' })
  @ApiResponse({ status: 404, description: 'Semestre source ou cible introuvable' })
  @ApiResponse({ status: 409, description: 'Cible contient déjà des affichages' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async duplicate(
    @Body() dto: DuplicateCreneauxAffichageDto,
  ): Promise<DuplicateCreneauxAffichageResponseDto> {
    return this.creneauxAffichageService.duplicate(dto, 'system');
  }

  @Get()
  @Permissions('creneau-affichage:read')
  @ApiOperation({ summary: 'Lister les correspondances d\'affichage avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des affichages', type: PaginatedCreneauxAffichagesDto })
  async findAll(
    @Query() query: CreneauxAffichageQueryDto,
  ): Promise<PaginatedCreneauxAffichagesDto> {
    return this.creneauxAffichageService.findAll(query);
  }

  @Get(':id')
  @Permissions('creneau-affichage:read')
  @ApiOperation({ summary: 'Obtenir une correspondance d\'affichage par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'affichage (UUID)' })
  @ApiResponse({ status: 200, description: 'Affichage trouvé', type: CreneauAffichageResponseDto })
  @ApiResponse({ status: 404, description: 'Affichage non trouvé' })
  async findOne(@Param('id') id: string): Promise<CreneauAffichageResponseDto> {
    return this.creneauxAffichageService.findOne(id);
  }

  @Patch(':id')
  @Permissions('creneau-affichage:write')
  @ApiOperation({ summary: 'Mettre à jour une correspondance d\'affichage' })
  @ApiParam({ name: 'id', description: 'ID de l\'affichage (UUID)' })
  @ApiResponse({ status: 200, description: 'Affichage mis à jour', type: CreneauAffichageResponseDto })
  @ApiResponse({ status: 404, description: 'Affichage non trouvé' })
  @ApiResponse({ status: 409, description: 'Conflit : chevauchement ou ordre' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCreneauAffichageDto,
  ): Promise<CreneauAffichageResponseDto> {
    return this.creneauxAffichageService.update(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('creneau-affichage:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une correspondance d\'affichage' })
  @ApiParam({ name: 'id', description: 'ID de l\'affichage (UUID)' })
  @ApiResponse({ status: 204, description: 'Affichage supprimé' })
  @ApiResponse({ status: 404, description: 'Affichage non trouvé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.creneauxAffichageService.remove(id, 'system');
  }
}
