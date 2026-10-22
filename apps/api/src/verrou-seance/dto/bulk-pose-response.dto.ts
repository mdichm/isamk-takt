// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO réponse pour pose en masse de verrous (L3-37)

export class BulkPoseDetailDto {
  seanceId: string;
  status: 'POSED' | 'SKIPPED_EXISTING';
}

export class BulkPoseResponseDto {
  poses: number;
  ignores: number;
  details: BulkPoseDetailDto[];
}