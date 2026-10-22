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
import { ContrainteInstanceService } from './contrainte-instance.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  ContrainteInstanceCreateDto,
  ContrainteInstanceUpdateDto,
  ContrainteInstanceResponseDto,
  PaginatedContrainteInstancesDto,
  ContrainteInstanceListQueryDto,
  ContrainteDuplicateDto,
  ContrainteDuplicateResponseDto,
} from './dto/contrainte-instance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Instances de contraintes')
@Controller('contraintes/instances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContrainteInstanceController {
  constructor(private readonly service: ContrainteInstanceService) {}

  @Post()
  @Permissions('contrainte:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une instance de contrainte pour un semestre' })
  @ApiResponse({ status: 201, description: 'Instance créée', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalibles (cible/poids incohérents)' })
  @ApiResponse({ status: 404, description: 'Semestre ou définition introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async create(
    @Body() dto: ContrainteInstanceCreateDto,
  ): Promise<ContrainteInstanceResponseDto> {
    return this.service.createContrainteInstance(dto, 'system');
  }

  @Post('duplicate')
  @Permissions('contrainte:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dupliquer les contraintes et vœux d\'un semestre vers un autre' })
  @ApiResponse({ status: 201, description: 'Contraintes dupliquées', type: ContrainteDuplicateResponseDto })
  @ApiResponse({ status: 400, description: 'Semestres identiques ou paramètres invalides' })
  @ApiResponse({ status: 404, description: 'Semestre source ou cible introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async duplicate(
    @Body() dto: ContrainteDuplicateDto,
  ): Promise<ContrainteDuplicateResponseDto> {
    return this.service.duplicate(
      dto.sourceSemestreId,
      dto.cibleSemestreId,
      dto.natures,
      'system',
    );
  }

  @Get()
  @Permissions('contrainte:read')
  @ApiOperation({ summary: 'Lister les instances de contraintes avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des instances', type: PaginatedContrainteInstancesDto })
  async findAll(
    @Query() query: ContrainteInstanceListQueryDto,
  ): Promise<PaginatedContrainteInstancesDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('contrainte:read')
  @ApiOperation({ summary: 'Obtenir une instance de contrainte par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 200, description: 'Instance trouvée', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  async findOne(@Param('id') id: string): Promise<ContrainteInstanceResponseDto> {
    return this.service.findOneById(id);
  }

  @Patch(':id')
  @Permissions('contrainte:write')
  @ApiOperation({ summary: 'Mettre à jour une instance de contrainte' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 200, description: 'Instance mise à jour', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async update(
    @Param('id') id: string,
    @Body() dto: ContrainteInstanceUpdateDto,
  ): Promise<ContrainteInstanceResponseDto> {
    return this.service.updateContrainteInstance(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('contrainte:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une instance de contrainte (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 204, description: 'Instance désactivée' })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.removeContrainteInstance(id);
  }
}