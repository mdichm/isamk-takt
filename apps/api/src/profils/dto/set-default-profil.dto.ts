// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO pour définir le profil par défaut d'un semestre (L4-10)
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultProfilDto {
  @ApiProperty({ description: 'ID du profil à définir comme par défaut' })
  @IsUUID()
  profilId: string;
}