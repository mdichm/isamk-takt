// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur d'import CSV/XLSX (L1-26)
// POST /imports/{entite}?dryRun=true
import {
  Controller,
  Post,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ImportsService } from './imports.service.js';
import { ImportCsvDto, ImportPreviewDto, ImportResultDto, ImportEntity, ALL_IMPORT_ENTITIES } from './dto/import-csv.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Imports CSV/XLSX')
@Controller('imports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Post(':entite')
  @Permissions('import:write')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Importer des données depuis un fichier CSV ou XLSX',
    description:
      "Entités supportées : enseignants, salles, groupes, modules, indisponibilites, voeux, contraintes, covoiturage. Avec dryRun=true (défaut), retourne un aperçu sans écriture. Avec confirmation=true, applique l'import de manière transactionnelle.",
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'entite',
    description: 'Entité à importer',
    enum: ALL_IMPORT_ENTITIES,
    example: 'enseignants',
  })
  @ApiBody({
    description: 'Fichier CSV ou XLSX à importer',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Aperçu (dryRun) ou résultat de l’application',
    type: ImportPreviewDto,
  })
  @ApiResponse({ status: 400, description: 'Fichier invalide, taille excessive ou paramètres manquants' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes (import:write requis)' })
  @ApiResponse({ status: 409, description: 'Conflit : doublon ou donnée utilisée dans une répartition validée' })
  async importCsv(
    @Param('entite') entite: ImportEntity,
    @Query() dto: ImportCsvDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ): Promise<ImportPreviewDto | ImportResultDto> {
    return this.importsService.importCsv(entite, dto, file, userId);
  }
}
