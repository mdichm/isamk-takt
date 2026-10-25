// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de création de version (L3-09)
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { VersionService } from './version.service.js';
import { VersionResponseDto } from './dto/version-response.dto.js';
import { CompletudeResponseDto } from './dto/completude-response.dto.js';
import { PerimetreResponseDto } from './dto/perimetre-response.dto.js';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import type { CreateGenerationDto } from './dto/create-generation.dto.js';
import { GenerationResponseDto } from './dto/generation-response.dto.js';
import { AdoptGenerationDto } from './dto/adopt-generation.dto.js';
import { AdoptResponseDto } from './dto/adopt-response.dto.js';
import { GenerationListResponseDto } from './dto/generation-list-response.dto.js';
import type { ImportGenerationDto } from './dto/import-generation.dto.js';
import { ImportGenerationResponseDto } from './dto/import-generation-response.dto.js';
import { TransitionDto } from './dto/transition.dto.js';
import { TransitionResponseDto } from './dto/transition-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

// ============================================
// Version (L3-09)
// POST /versions : création d'une version de travail à partir des snapshots validés.
// ============================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('versions')
@Controller('versions')
export class VersionController {
  constructor(private readonly service: VersionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('version:create')
  @ApiOperation({ summary: 'Créer une version de travail pour un semestre' })
  @ApiResponse({
    status: 201,
    description: 'Version créée',
    type: VersionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  @ApiResponse({
    status: 404,
    description: 'Semestre introuvable',
  })
  @ApiResponse({
    status: 409,
    description: 'Une version de travail existe déjà pour ce semestre',
  })
  @ApiResponse({
    status: 422,
    description: 'Un département n\'a pas de snapshot validé',
  })
  async create(
    @Body() dto: CreateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.service.createVersion(dto, 'system');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Lister toutes les versions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des versions',
    type: [VersionResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAll(): Promise<VersionResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Détail d\'une version' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la version',
    type: VersionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async findOne(@Param('id') id: string): Promise<VersionResponseDto> {
    return this.service.findOne(id);
  }

  @Get(':id/completude')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Couverture et complétude d\'une version' })
  @ApiResponse({
    status: 200,
    description: 'Couverture de la version',
    type: CompletudeResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async completude(@Param('id') id: string): Promise<CompletudeResponseDto> {
    return this.service.getCompletude(id);
  }

  @Get(':id/perimetre')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Perimetre fige et empreinte d une version (L4-13)' })
  @ApiParam({ name: 'id', description: 'ID de la version (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Périmètre figé du semestre avec son empreinte',
    type: PerimetreResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async perimetre(@Param('id') id: string): Promise<PerimetreResponseDto> {
    return this.service.getPerimetre(id);
  }

  @Post(':id/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('generation:launch')
  @ApiOperation({
    summary: 'Lancer une génération d emploi du temps',
    description:
      "Lance une génération en statut QUEUED après pré-validation synchrone (préparation, verrous, contraintes, empreinte du périmètre). Retourne 202 ACCEPTED.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la version (UUID)' })
  @ApiResponse({
    status: 202,
    description: 'Génération créée et mise en file d attente',
    type: GenerationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiResponse({
    status: 409,
    description:
      "L'empreinte du périmètre ne correspond plus aux données actuelles (PERIMETER_CHANGED) ou une génération est déjà en cours (GENERATION_ALREADY_RUNNING)",
  })
  @ApiResponse({
    status: 422,
    description:
      'Préparation non conforme (PREPARATION_BLOCKED), verrou incompatible (LOCK_INCOMPATIBLE) ou contraintes non traduites sans acquittement (UNTRANSLATED_CONSTRAINTS_UNACKNOWLEDGED)',
  })
  @ApiResponse({
    status: 423,
    description:
      'Version immuable (VERSION_IMMUTABLE) ou bail d edition détenu (EDIT_LOCK_HELD)',
  })
  async createGeneration(
    @Param('id') id: string,
    @Body() dto: CreateGenerationDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<GenerationResponseDto> {
    return this.service.createGeneration(id, dto, currentUser.id);
  }

  @Post(':id/adopt')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:adopt')
  @ApiOperation({
    summary: 'Adopter une génération comme base d\'édition d\'une version',
    description:
      'Remplace les séances MOTEUR de la version, insère les séances de la génération, ' +
      'recalcule les conflits, passe la version en EDITION et incrémente le numéro majeur (RC-04).',
  })
  @ApiParam({ name: 'id', description: 'ID de la version (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Version adoptée',
    type: AdoptResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version ou génération introuvable' })
  @ApiResponse({
    status: 409,
    description: "Version immuable (INVALID_STATE_TRANSITION)",
  })
  @ApiResponse({
    status: 422,
    description:
      'Génération non réussie, ou snapshots de la version modifiés depuis la génération',
  })
  async adopt(
    @Param('id') id: string,
    @Body() dto: AdoptGenerationDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AdoptResponseDto> {
    return this.service.adoptGeneration(id, dto.generationId, currentUser.id);
  }

  @Post(':id/transitions')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:transition')
  @ApiOperation({
    summary: 'Exécuter une transition de workflow sur une version (machine d\'états)',
    description:
      'Exécute une action de transition (DEMARRER_EDITION, MARQUER_PRET, SOUMETTRE, REPRENDRE, RESOUMETTRE, ABANDONNER). ' +
      'Écrit atomiquement : VersionEdt (statut + revision), WorkflowTransition et AuditLog.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la version (UUID)' })
  @ApiBody({ type: TransitionDto })
  @ApiResponse({
    status: 200,
    description: 'Transition effectuée avec succès',
    type: TransitionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiResponse({
    status: 409,
    description:
      'Transition interdite depuis l\'état actuel (INVALID_STATE_TRANSITION) ou garde de métier non satisfaite (SEANCES_NON_PLACES, NO_SEANCES_TO_EDIT)',
  })
  async transition(
    @Param('id') id: string,
    @Body() dto: TransitionDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<TransitionResponseDto> {
    return this.service.transition(id, dto.action, currentUser.id, dto.commentaire);
  }

  @Get(':id/generations')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Lister les générations d une version' })
  @ApiParam({ name: 'id', description: 'ID de la version (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des générations de la version',
    type: GenerationListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async getGenerationsByVersion(
    @Param('id') id: string,
  ): Promise<GenerationListResponseDto> {
    return this.service.getGenerationsByVersion(id);
  }

  @Post(':id/generations/import')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('generation:launch')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importer le résultat d une exécution manuelle de FET',
    description:
      "Reçoit le fichier résultat d'une exécution manuelle de FET (.fet) ainsi que l'empreinte du fichier moteur exporté. Vérifie que l'empreinte correspond à un fichier moteur de ce périmètre (422 ENGINE_FILE_MISMATCH sinon), puis crée une génération en mode MANUELLE et l'enfile pour import.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la version (UUID)' })
  @ApiBody({
    description: 'Fichier résultat FET (.fet) et empreinte du fichier moteur',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier résultat d exécution FET (.fet)',
        },
        fichierMoteurSha256: {
          type: 'string',
          description: "Empreinte SHA-256 du fichier moteur exporté (GET /versions/{id}/generations/:genId/engine-file)",
        },
      },
      required: ['file', 'fichierMoteurSha256'],
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Génération manuelle créée et mise en file d attente',
    type: ImportGenerationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiResponse({
    status: 422,
    description:
      "Empreinte fichier moteur non correspondante (ENGINE_FILE_MISMATCH) ou paramètres invalides",
  })
  @ApiResponse({
    status: 409,
    description: 'Une génération est déjà en cours sur cette version (GENERATION_ALREADY_RUNNING)',
  })
  async importManualGeneration(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportGenerationDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ImportGenerationResponseDto> {
    return this.service.importManualGeneration(id, file, dto.fichierMoteurSha256, currentUser.id);
  }
}
