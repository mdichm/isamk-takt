import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DemandesService } from './demandes.service.js';
import {
  CreateDemandeDto,
  TraiterDemandeDto,
  DemandeResponseDto,
  PaginatedDemandesDto,
  DemandeQueryDto,
} from './dto/demande.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { Scope } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Demandes de modification')
@Controller('demandes-modification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DemandesController {
  constructor(private demandesService: DemandesService) {}

  @Post()
  @Permissions('demande:write')
  @ApiOperation({ summary: 'Créer une demande de modification' })
  @ApiResponse({ status: 201, description: 'Demande créée', type: DemandeResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async createDemande(
    @Body() dto: CreateDemandeDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<DemandeResponseDto> {
    return this.demandesService.createDemande(dto, currentUser.id);
  }

  @Get()
  @Permissions('demande:read')
  @ApiOperation({ summary: 'Lister les demandes de modification avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des demandes', type: PaginatedDemandesDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAllDemandes(
    @Query() query: DemandeQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedDemandesDto> {
    return this.demandesService.findAllDemandes(query, currentUser);
  }

  @Get(':id')
  @Permissions('demande:read')
  @Scope({ resource: 'demande', idParam: 'id' })
  @ApiOperation({ summary: 'Obtenir une demande par ID' })
  @ApiParam({ name: 'id', description: 'ID de la demande (UUID)' })
  @ApiResponse({ status: 200, description: 'Demande trouvée', type: DemandeResponseDto })
  @ApiResponse({ status: 404, description: 'Demande non trouvée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  async findDemandeById(
    @Param('id') id: string,
  ): Promise<DemandeResponseDto> {
    return this.demandesService.findDemandeById(id);
  }

  @Patch(':id/traiter')
  @Permissions('demande:traiter')
  @Scope({ resource: 'demande', idParam: 'id' })
  @ApiOperation({ summary: 'Traiter (accepter ou refuser) une demande de modification' })
  @ApiParam({ name: 'id', description: 'ID de la demande (UUID)' })
  @ApiResponse({ status: 200, description: 'Demande traitée', type: DemandeResponseDto })
  @ApiResponse({ status: 400, description: 'Déjà traitée ou hors portée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Demande non trouvée' })
  async traiterDemande(
    @Param('id') id: string,
    @Body() dto: TraiterDemandeDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<DemandeResponseDto> {
    return this.demandesService.traiterDemande(id, dto, currentUser);
  }
}