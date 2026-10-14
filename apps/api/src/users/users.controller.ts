import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserQueryDto, UserResponseDto, PaginatedUsersDto } from './dto/user.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@takt/db';

@ApiTags('Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lister les utilisateurs avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des utilisateurs', type: PaginatedUsersDto })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur (UUID)' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Admin seulement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur (UUID)' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Changer le mot de passe d\'un utilisateur (Admin seulement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur (UUID)' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto): Promise<void> {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin seulement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur (UUID)' })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}