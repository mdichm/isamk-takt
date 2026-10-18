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
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { SalleService } from './salle.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateTypeSalleDto,
  UpdateTypeSalleDto,
  TypeSalleResponseDto,
  PaginatedTypeSallesDto,
  TypeSalleQueryDto,
  CreateSalleDto,
  UpdateSalleDto,
  SalleResponseDto,
  PaginatedSallesDto,
  SalleQueryDto,
  AssignerEquipementsDto,
  CreateEquipementDto,
  UpdateEquipementDto,
  EquipementResponseDto,
  PaginatedEquipementsDto,
  EquipementQueryDto,
} from './dto/salle.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Salles')
@Controller('salles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalleController {
  constructor(private salleService: SalleService) {}

  // ============================================
  // Types de salle
  // ============================================

  @Post('types-salles')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Créer un type de salle' })
  @ApiResponse({ status: 201, description: 'Type de salle créé', type: TypeSalleResponseDto })
  @ApiResponse({ status: 409, description: 'Code de type de salle déjà existant' })
  async createTypeSalle(@Body() dto: CreateTypeSalleDto): Promise<TypeSalleResponseDto> {
    return this.salleService.createTypeSalle(dto, 'system');
  }

  @Get('types-salles')
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Lister les types de salle avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des types de salle', type: PaginatedTypeSallesDto })
  async findAllTypeSalles(@Query() query: TypeSalleQueryDto): Promise<PaginatedTypeSallesDto> {
    return this.salleService.findAllTypeSalles(query);
  }

  @Get('types-salles/:id')
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Obtenir un type de salle par ID' })
  @ApiParam({ name: 'id', description: 'ID du type de salle (UUID)' })
  @ApiResponse({ status: 200, description: 'Type de salle trouvé', type: TypeSalleResponseDto })
  @ApiResponse({ status: 404, description: 'Type de salle non trouvé' })
  async findTypeSalleById(@Param('id') id: string): Promise<TypeSalleResponseDto> {
    return this.salleService.findTypeSalleById(id);
  }

  @Patch('types-salles/:id')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Mettre à jour un type de salle' })
  @ApiParam({ name: 'id', description: 'ID du type de salle (UUID)' })
  @ApiResponse({ status: 200, description: 'Type de salle mis à jour', type: TypeSalleResponseDto })
  @ApiResponse({ status: 404, description: 'Type de salle non trouvé' })
  @ApiResponse({ status: 409, description: 'Code de type de salle déjà utilisé' })
  async updateTypeSalle(
    @Param('id') id: string,
    @Body() dto: UpdateTypeSalleDto,
  ): Promise<TypeSalleResponseDto> {
    return this.salleService.updateTypeSalle(id, dto, 'system');
  }

  @Delete('types-salles/:id')
  @Permissions('salles:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un type de salle' })
  @ApiParam({ name: 'id', description: 'ID du type de salle (UUID)' })
  @ApiResponse({ status: 204, description: 'Type de salle désactivé' })
  @ApiResponse({ status: 404, description: 'Type de salle non trouvé' })
  @ApiResponse({ status: 409, description: 'Des salles utilisent encore ce type de salle' })
  async removeTypeSalle(@Param('id') id: string): Promise<void> {
    return this.salleService.removeTypeSalle(id, 'system');
  }

  // ============================================
  // Salles
  // ============================================

  @Post()
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Créer une salle' })
  @ApiResponse({ status: 201, description: 'Salle créée', type: SalleResponseDto })
  @ApiResponse({ status: 409, description: 'Code de salle déjà existant' })
  @ApiResponse({ status: 400, description: 'Capacité recommandée invalide' })
  async createSalle(@Body() dto: CreateSalleDto): Promise<SalleResponseDto> {
    return this.salleService.createSalle(dto, 'system');
  }

  @Get()
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Lister les salles avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des salles', type: PaginatedSallesDto })
  async findAllSalles(@Query() query: SalleQueryDto): Promise<PaginatedSallesDto> {
    return this.salleService.findAllSalles(query);
  }

  @Get(':id')
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Obtenir une salle par ID' })
  @ApiParam({ name: 'id', description: 'ID de la salle (UUID)' })
  @ApiResponse({ status: 200, description: 'Salle trouvée', type: SalleResponseDto })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  async findSalleById(@Param('id') id: string): Promise<SalleResponseDto> {
    return this.salleService.findSalleById(id);
  }

  @Patch(':id')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Mettre à jour une salle' })
  @ApiParam({ name: 'id', description: 'ID de la salle (UUID)' })
  @ApiResponse({ status: 200, description: 'Salle mise à jour', type: SalleResponseDto })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  @ApiResponse({ status: 409, description: 'Code de salle déjà utilisé' })
  @ApiResponse({ status: 400, description: 'Capacité recommandée invalide' })
  async updateSalle(
    @Param('id') id: string,
    @Body() dto: UpdateSalleDto,
  ): Promise<SalleResponseDto> {
    return this.salleService.updateSalle(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('salles:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une salle (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la salle (UUID)' })
  @ApiResponse({ status: 204, description: 'Salle désactivée' })
  @ApiResponse({ status: 404, description: 'Salle non trouvée' })
  async removeSalle(@Param('id') id: string): Promise<void> {
    return this.salleService.removeSalle(id, 'system');
  }

  @Post(':id/equipements')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Affecter des équipements à une salle' })
  @ApiParam({ name: 'id', description: 'ID de la salle (UUID)' })
  @ApiResponse({ status: 200, description: 'Salle avec ses équipements', type: SalleResponseDto })
  @ApiResponse({ status: 404, description: 'Salle ou équipement introuvable' })
  async assignerEquipements(
    @Param('id') id: string,
    @Body() dto: AssignerEquipementsDto,
  ): Promise<SalleResponseDto> {
    return this.salleService.assignerEquipements(id, dto, 'system');
  }

  // ============================================
  // Équipements
  // ============================================

  @Post('equipements')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Créer un équipement' })
  @ApiResponse({ status: 201, description: 'Équipement créé', type: EquipementResponseDto })
  @ApiResponse({ status: 409, description: 'Code d\'équipement déjà existant' })
  async createEquipement(@Body() dto: CreateEquipementDto): Promise<EquipementResponseDto> {
    return this.salleService.createEquipement(dto, 'system');
  }

  @Get('equipements')
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Lister les équipements avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des équipements', type: PaginatedEquipementsDto })
  async findAllEquipements(@Query() query: EquipementQueryDto): Promise<PaginatedEquipementsDto> {
    return this.salleService.findAllEquipements(query);
  }

  @Get('equipements/:id')
  @Permissions('salles:read')
  @ApiOperation({ summary: 'Obtenir un équipement par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'équipement (UUID)' })
  @ApiResponse({ status: 200, description: 'Équipement trouvé', type: EquipementResponseDto })
  @ApiResponse({ status: 404, description: 'Équipement non trouvé' })
  async findEquipementById(@Param('id') id: string): Promise<EquipementResponseDto> {
    return this.salleService.findEquipementById(id);
  }

  @Patch('equipements/:id')
  @Permissions('salles:write')
  @ApiOperation({ summary: 'Mettre à jour un équipement' })
  @ApiParam({ name: 'id', description: 'ID de l\'équipement (UUID)' })
  @ApiResponse({ status: 200, description: 'Équipement mis à jour', type: EquipementResponseDto })
  @ApiResponse({ status: 404, description: 'Équipement non trouvé' })
  @ApiResponse({ status: 409, description: 'Code d\'équipement déjà utilisé' })
  async updateEquipement(
    @Param('id') id: string,
    @Body() dto: UpdateEquipementDto,
  ): Promise<EquipementResponseDto> {
    return this.salleService.updateEquipement(id, dto, 'system');
  }

  @Delete('equipements/:id')
  @Permissions('salles:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un équipement (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'équipement (UUID)' })
  @ApiResponse({ status: 204, description: 'Équipement désactivé' })
  @ApiResponse({ status: 404, description: 'Équipement non trouvé' })
  @ApiResponse({ status: 409, description: 'Des salles utilisent encore cet équipement' })
  async removeEquipement(@Param('id') id: string): Promise<void> {
    return this.salleService.removeEquipement(id, 'system');
  }
}