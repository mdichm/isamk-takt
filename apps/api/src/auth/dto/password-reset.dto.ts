import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Confirmation de réinitialisation de mot de passe (lien à usage unique) */
export class ResetPasswordConfirmDto {
  @ApiProperty({ example: 'opaque-reset-token-uuid', description: 'Token de réinitialisation à usage unique' })
  @IsString()
  @MinLength(1, { message: 'Le token est requis' })
  token: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne doit pas dépasser 128 caractères' })
  password: string;
}