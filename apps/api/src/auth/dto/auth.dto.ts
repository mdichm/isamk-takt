import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'johndoe', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3, { message: 'Le login doit contenir au moins 3 caractères' })
  @MaxLength(50, { message: 'Le login ne doit pas dépasser 50 caractères' })
  login: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(50, { message: 'Le mot de passe ne doit pas dépasser 50 caractères' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1, { message: 'Le prénom est requis' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1, { message: 'Le nom est requis' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  lastName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'Identifiant (login) ou email' })
  @IsString()
  @MinLength(1, { message: 'L\'identifiant est requis' })
  login: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est requis' })
  password: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Le code TOTP doit contenir 6 chiffres' })
  @MaxLength(6, { message: 'Le code TOTP doit contenir 6 chiffres' })
  totp?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

/**
 * Corps de la requête de déconnexion.
 *
 * Le jeton de rafraîchissement est normalement lu dans le cookie httpOnly
 * `refreshToken` : ce champ n'est fourni que par les clients non-navigateur.
 * Le corps peut être absent (POST sans body) : le DTO est alors normalisé en
 * objet vide par le ValidationPipe global.
 */
export class LogoutDto {
  @ApiProperty({ required: false, description: 'Jeton de rafraîchissement (sinon lu dans le cookie httpOnly)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}