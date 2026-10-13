import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto, ProjectResponseDto, PaginatedProjectsDto, AddMemberDto, UpdateMemberRoleDto } from './dto/project.dto.js';
import { ProjectStatus, UserRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const existingProject = await this.prisma.project.findUnique({
      where: { key: createProjectDto.key },
    });
    if (existingProject) {
      throw new ConflictException('Cette clé de projet est déjà utilisée');
    }

    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        key: createProjectDto.key.toUpperCase(),
        status: createProjectDto.status || ProjectStatus.PLANNING,
        startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
        endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : null,
        members: {
          create: {
            userId,
            role: UserRole.ADMIN,
          },
        },
        columns: {
          create: [
            { name: 'À faire', position: 0, color: '#6366f1' },
            { name: 'En cours', position: 1, color: '#3b82f6' },
            { name: 'En revue', position: 2, color: '#f59e0b' },
            { name: 'Terminé', position: 3, color: '#22c55e', isDone: true },
          ],
        },
      },
      include: {
        _count: {
          select: { tasks: true, members: true, sprints: true },
        },
      },
    });

    return this.toResponseDto(project);
  }

  async findAll(query: ProjectQueryDto, userId: string): Promise<PaginatedProjectsDto> {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      members: {
        some: { userId },
      },
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tasks: true, members: true, sprints: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        members: { some: { userId } },
      },
      include: {
        _count: {
          select: { tasks: true, members: true, sprints: true },
        },
      },
    });
    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }
    return this.toResponseDto(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    await this.checkProjectAccess(id, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : undefined,
        endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : undefined,
      },
      include: {
        _count: {
          select: { tasks: true, members: true, sprints: true },
        },
      },
    });

    return this.toResponseDto(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.checkProjectAccess(id, userId, [UserRole.ADMIN]);
    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: addMemberDto.userId },
      },
    });
    if (existingMember) {
      throw new ConflictException('Cet utilisateur est déjà membre du projet');
    }

    await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: addMemberDto.userId,
        role: addMemberDto.role || UserRole.VIEWER,
      },
    });
  }

  async updateMemberRole(projectId: string, memberId: string, updateMemberRoleDto: UpdateMemberRoleDto, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN]);

    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException('Membre non trouvé');
    }

    if (member.userId === userId && updateMemberRoleDto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas retirer votre propre rôle d\'admin');
    }

    await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: updateMemberRoleDto.role },
    });
  }

  async removeMember(projectId: string, memberId: string, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException('Membre non trouvé');
    }

    if (member.userId === userId) {
      throw new ForbiddenException('Vous ne pouvez pas vous retirer vous-même');
    }

    await this.prisma.projectMember.delete({ where: { id: memberId } });
  }

  async getMembers(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  private async checkProjectAccess(projectId: string, userId: string, allowedRoles: UserRole[] = []) {
    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Permissions insuffisantes pour cette action');
    }
  }

  private toResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      key: project.key,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      _count: project._count,
    };
  }
}
