// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de liste paginée des jobs d'export (L6-04)
import { ApiProperty } from '@nestjs/swagger';
import { ExportJobResponseDto } from './export-job-response.dto.js';

/**
 * Réponse paginée de GET /exports.
 */
export class PaginatedExportJobsDto {
  @ApiProperty({ type: [ExportJobResponseDto] })
  data: ExportJobResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
