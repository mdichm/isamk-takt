import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserQueryDto, UserResponseDto, PaginatedUsersDto } from './dto/user.dto.js';
import { RoleCode } from '@takt/db';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await hashPassword(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: true,
        roles: {
          create: {
            role: RoleCode.ETUDIANT,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    return this.toResponseDto(user);
  }

  async findAll(query: UserQueryDto): Promise<PaginatedUsersDto> {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.roles = {
        some: { role: query.role },
      };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => this.toResponseDto(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return this.toResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const data: any = {};
    if (updateUserDto.firstName) data.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) data.lastName = updateUserDto.lastName;
    if (updateUserDto.email) data.email = updateUserDto.email;
    if (updateUserDto.isActive !== undefined) data.isActive = updateUserDto.isActive;

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: true,
      },
    });

    return this.toResponseDto(user);
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const isPasswordValid = await verifyPassword(updatePasswordDto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ConflictException('Mot de passe actuel incorrect');
    }

    const passwordHash = await hashPassword(updatePasswordDto.newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  private toResponseDto(user: any): UserResponseDto {
    const primaryRole = user.roles?.[0]?.role || RoleCode.ETUDIANT;
    const { passwordHash: _passwordHash, roles: _roles, ...result } = user;
    return {
      ...result,
      firstName: user.firstName,
      lastName: user.lastName,
      role: primaryRole,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl || null,
    };
  }
}
