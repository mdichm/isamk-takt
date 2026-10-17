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
import { ModulesService } from './modules.service.js';
import {
  CreateTypeEnseignementDto,
  UpdateTypeEnseignementDto,
  TypeEnseignementResponseDto,
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  CreateModuleDto,
  UpdateModuleDto,
  ModuleResponseDto,
  PaginatedModulesDto,
  ModulesQueryDto,
} from './dto/module.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Modules, types et grades')
@Controller('modules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  // ============================================
  // Types d'enseignement
  // ============================================

  @Post('types-enseignement')
  @Permissions('type-enseignement:write')
  @ApiOperation({ summary: 'Créer un type d\'enseignement' })
  @ApiResponse({ status: 201, description: 'Type créé', type: TypeEnseignementResponseDto })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async createTypeEnseignement(@Body() dto: CreateTypeEnseignementDto): Promise<TypeEnseignementResponseDto> {
    return this.modulesService.createTypeEnseignement(dto, 'system');
  }

  @Get('types-enseignement')
  @Permissions('type-enseignement:read')
  @ApiOperation({ summary: 'Lister tous les types d\'enseignement' })
  @ApiResponse({ status: 200, description: 'Liste des types d\'enseignement', type: [TypeEnseignementResponseDto] })
  async findAllTypesEnseignement(): Promise<TypeEnseignementResponseDto[]> {
    return this.modulesService.findAllTypesEnseignement();
  }

  @Get('types-enseignement/:id')
  @Permissions('type-enseignement:read')
  @ApiOperation({ summary: 'Obtenir un type d\'enseignement par ID' })
  @ApiParam({ name: 'id', description: 'ID du type d\'enseignement (UUID)' })
  @ApiResponse({ status: 200, description: 'Type trouvé', type: TypeEnseignementResponseDto })
  @ApiResponse({ status: 404, description: 'Type d\'enseignement non trouvé' })
  async findTypeEnseignementById(@Param('id') id: string): Promise<TypeEnseignementResponseDto> {
    return this.modulesService.findTypeEnseignementById(id);
  }

  @Patch('types-enseignement/:id')
  @Permissions('type-enseignement:write')
  @ApiOperation({ summary: 'Mettre à jour un type d\'enseignement' })
  @ApiParam({ name: 'id', description: 'ID du type d\'enseignement (UUID)' })
  @ApiResponse({ status: 200, description: 'Type mis à jour', type: TypeEnseignementResponseDto })
  @ApiResponse({ status: 404, description: 'Type d\'enseignement non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async updateTypeEnseignement(
    @Param('id') id: string,
    @Body() dto: UpdateTypeEnseignementDto,
  ): Promise<TypeEnseignementResponseDto> {
    return this.modulesService.updateTypeEnseignement(id, dto, 'system');
  }

  @Delete('types-enseignement/:id')
  @Permissions('type-enseignement:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un type d\'enseignement' })
  @ApiParam({ name: 'id', description: 'ID du type d\'enseignement (UUID)' })
  @ApiResponse({ status: 204, description: 'Type supprimé' })
  @ApiResponse({ status: 404, description: 'Type d\'enseignement non trouvé' })
  @ApiResponse({ status: 409, description: 'Référencé par des modules' })
  async removeTypeEnseignement(@Param('id') id: string): Promise<void> {
    return this.modulesService.removeTypeEnseignement(id, 'system');
  }

  // ============================================
  // Grades

  @Post('grades')
  @Permissions('grade:write')
  @ApiOperation({ summary: 'Créer un grade' })
  @ApiResponse({ status: 201, description: 'Grade créé', type: GradeResponseDto })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async createGrade(@Body() dto: CreateGradeDto): Promise<GradeResponseDto> {
    return this.modulesService.createGrade(dto, 'system');
  }

  @Get('grades')
  @Permissions('grade:read')
  @ApiOperation({ summary: 'Lister tous les grades' })
  @ApiResponse({ status: 200, description: 'Liste des grades', type: [GradeResponseDto] })
  async findAllGrades(): Promise<GradeResponseDto[]> {
    return this.modulesService.findAllGrades();
  }

  @Get('grades/:id')
  @Permissions('grade:read')
  @ApiOperation({ summary: 'Obtenir un grade par ID' })
  @ApiParam({ name: 'id', description: 'ID du grade (UUID)' })
  @ApiResponse({ status: 200, description: 'Grade trouvé', type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade non trouvé' })
  async findGradeById(@Param('id') id: string): Promise<GradeResponseDto> {
    return this.modulesService.findGradeById(id);
  }

  @Patch('grades/:id')
  @Permissions('grade:write')
  @ApiOperation({ summary: 'Mettre à jour un grade' })
  @ApiParam({ name: 'id', description: 'ID du grade (UUID)' })
  @ApiResponse({ status: 200, description: 'Grade mis à jour', type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async updateGrade(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.modulesService.updateGrade(id, dto, 'system');
  }

  @Delete('grades/:id')
  @Permissions('grade:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un grade' })
  @ApiParam({ name: 'id', description: 'ID du grade (UUID)' })
  @ApiResponse({ status: 204, description: 'Grade supprimé' })
  @ApiResponse({ status: 404, description: 'Grade non trouvé' })
  @ApiResponse({ status: 409, description: 'Référencé par des modules' })
  async removeGrade(@Param('id') id: string): Promise<void> {
    return this.modulesService.removeGrade(id, 'system');
  }

  // ============================================
  // Modules
  // ============================================

  @Post()
  @Permissions('module:write')
  @ApiOperation({ summary: 'Créer un module' })
  @ApiResponse({ status: 201, description: 'Module créé', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Niveau, type ou grade non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async createModule(@Body() dto: CreateModuleDto): Promise<ModuleResponseDto> {
    return this.modulesService.createModule(dto, 'system');
  }

  @Get()
  @Permissions('module:read')
  @ApiOperation({ summary: 'Lister les modules avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des modules', type: PaginatedModulesDto })
  async findAllModules(@Query() query: ModulesQueryDto): Promise<PaginatedModulesDto> {
    return this.modulesService.findAllModules(query);
  }

  @Get(':id')
  @Permissions('module:read')
  @ApiOperation({ summary: 'Obtenir un module par ID' })
  @ApiParam({ name: 'id', description: 'ID du module (UUID)' })
  @ApiResponse({ status: 200, description: 'Module trouvé', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Module non trouvé' })
  async findModuleById(@Param('id') id: string): Promise<ModuleResponseDto> {
    return this.modulesService.findModuleById(id);
  }

  @Patch(':id')
  @Permissions('module:write')
  @ApiOperation({ summary: 'Mettre à jour un module' })
  @ApiParam({ name: 'id', description: 'ID du module (UUID)' })
  @ApiResponse({ status: 200, description: 'Module mis à jour', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Module non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async updateModule(
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    return this.modulesService.updateModule(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('module:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un module' })
  @ApiParam({ name: 'id', description: 'ID du module (UUID)' })
  @ApiResponse({ status: 204, description: 'Module supprimé' })
  @ApiResponse({ status: 404, description: 'Module non trouvé' })
  async removeModule(@Param('id') id: string): Promise<void> {
    return this.modulesService.removeModule(id, 'system');
  }
}
  // ============================================