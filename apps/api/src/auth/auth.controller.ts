import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthResult } from './auth.service.js';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto.js';
import { ResetPasswordConfirmDto } from './dto/password-reset.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { MfaService } from './mfa.service.js';
import { PasswordResetService } from './password-reset.service.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

function cookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
}

function extractRefreshToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;)\s*refreshToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mfaService: MfaService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResult, 'refreshToken'>> {
    const result = await this.authService.register(registerDto);
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions());
    const { refreshToken: _refreshToken, ...response } = result;
    return response;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', type: AuthResponseDto })
  @ApiResponse({
    status: 401,
    description:
      'Identifiants invalides, ou compte verrouillé (ACCOUNT_LOCKED avec en-tête Retry-After)',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResult, 'refreshToken'>> {
    const result = await this.authService.login(loginDto);
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions());
    const { refreshToken: _refreshToken, ...response } = result;
    return response;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis' })
  @ApiResponse({ status: 401, description: 'Token de rafraîchissement invalide' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions());
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post('reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirmer la réinitialisation de mot de passe (lien à usage unique)' })
  @ApiResponse({ status: 204, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 401, description: 'Token invalide, expiré ou déjà utilisé' })
  @ApiResponse({ status: 422, description: 'Règle de politique de mot de passe violée (PASSWORD_POLICY)' })
  async resetConfirm(
    @Body() dto: ResetPasswordConfirmDto,
  ): Promise<void> {
    await this.passwordResetService.confirmReset(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('auth:logout')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = body.refreshToken ?? extractRefreshToken(req);
    if (refreshToken) {
      await this.authService.logout(userId, refreshToken);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('auth:me')
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getProfile(@CurrentUser() user: AuthResult['user']): Promise<AuthResult['user']> {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('mfa:manage')
  @Post('mfa/enroll')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enrôler l\'utilisateur connecté au MFA TOTP' })
  @ApiResponse({ status: 200, description: 'Secret et URI QR code générés', schema: { example: { secret: 'JBSWY3DPEHPK3PXP', qrCodeUri: 'otpauth://totp/TAKT:alice@example.fr?secret=JBSWY3DPEHPK3PXP&issuer=TAKT' } } })
  @ApiResponse({ status: 400, description: 'MFA déjà activé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async enroll(@CurrentUser('id') userId: string): Promise<{ secret: string; qrCodeUri: string }> {
    return this.mfaService.enroll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('mfa:manage')
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier le code TOTP et activer le MFA' })
  @ApiResponse({ status: 200, description: 'MFA activé', schema: { example: { success: true, mfaActive: true } } })
  @ApiResponse({ status: 401, description: 'Code TOTP invalide ou non authentifié' })
  async verify(
    @CurrentUser('id') userId: string,
    @Body() body: { totp: string },
  ): Promise<{ success: boolean; mfaActive: boolean }> {
    return this.mfaService.verify(userId, body.totp);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('mfa:manage')
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactiver le MFA pour l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'MFA désactivé', schema: { example: { success: true, mfaActive: false } } })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async disable(@CurrentUser('id') userId: string): Promise<{ success: boolean; mfaActive: boolean }> {
    return this.mfaService.disable(userId);
  }
}