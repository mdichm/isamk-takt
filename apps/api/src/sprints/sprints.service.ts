import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSprintDto, UpdateSprintDto, SprintQueryDto, SprintResponseDto, PaginatedSprintsDto, AddSprintMemberDto } from './dto/sprint.dto.js';
import { SprintStatus, UserRole, Prisma } from '@takt/db';

@Injectable()
export class SprintsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createSprintDto: CreateSprintDto, userId: string): Promise<SprintResponseDto> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const sprint = await this.prisma.sprint.create({
      data: {
        projectId,
        name: createSprintDto.name,
        goal: createSprintDto.goal,
        startDate: new Date(createSprintDto.startDate),
        endDate: new Date(createSprintDto.endDate),
        status: SprintStatus.PLANNING,
        members: { create: { userId, role: UserRole.MANAGER } },
      },
      include: { _count: { select: { tasks: true, members: true } } },
    });

    return this.toResponseDto(sprint);
  }

  async findAll(projectId: string, query: SprintQueryDto, userId: string): Promise<PaginatedSprintsDto> {
    await this.checkProjectAccess(projectId, userId);

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { projectId };
    if (query.status) where.status = query.status;

    const [sprints, total] = await Promise.all([
      this.prisma.sprint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { tasks: true, members: true } } },
      }),
      this.prisma.sprint.count({ where }),
    ]);

    return {
      data: sprints.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(projectId: string, sprintId: string, userId: string): Promise<SprintResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      include: { _count: { select: { tasks: true, members: true } } },
    });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }
    return this.toResponseDto(sprint);
  }

  async update(projectId: string, sprintId: string, updateSprintDto: UpdateSprintDto, userId: string): Promise<SprintResponseDto> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }

    const updateData: any = { ...updateSprintDto };
    if (updateSprintDto.startDate) updateData.startDate = new Date(updateSprintDto.startDate);
    if (updateSprintDto.endDate) updateData.endDate = new Date(updateSprintDto.endDate);

    const updatedSprint = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: updateData,
      include: { _count: { select: { tasks: true, members: true } } },
    });

    return this.toResponseDto(updatedSprint);
  }

  async start(projectId: string, sprintId: string, userId: string): Promise<SprintResponseDto> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }
    if (sprint.status !== SprintStatus.PLANNING) {
      throw new BadRequestException('Seuls les sprints en planification peuvent etre demarres');
    }

    const updatedSprint = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.ACTIVE },
      include: { _count: { select: { tasks: true, members: true } } },
    });

    return this.toResponseDto(updatedSprint);
  }

  async complete(projectId: string, sprintId: string, userId: string): Promise<SprintResponseDto> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }
    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Seuls les sprints actifs peuvent etre termines');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.updateMany({
        where: { sprintId, status: { not: 'DONE' } },
        data: { sprintId: null },
      });

      await tx.sprint.update({
        where: { id: sprintId },
        data: { status: SprintStatus.COMPLETED },
      });
    });

    const updatedSprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId },
      include: { _count: { select: { tasks: true, members: true } } },
    });

    return this.toResponseDto(updatedSprint!);
  }

  async remove(projectId: string, sprintId: string, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN]);

    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }
    if (sprint.status === SprintStatus.ACTIVE) {
      throw new BadRequestException('Impossible de supprimer un sprint actif');
    }

    await this.prisma.sprint.delete({ where: { id: sprintId } });
  }

  async addMember(projectId: string, sprintId: string, addMemberDto: AddSprintMemberDto, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new NotFoundException('Sprint non trouve');
    }

    const existingMember = await this.prisma.sprintMember.findUnique({
      where: { sprintId_userId: { sprintId, userId: addMemberDto.userId } },
    });
    if (existingMember) {
      throw new ConflictException('Cet utilisateur est deja membre du sprint');
    }

    const projectMember = await this.prisma.projectMember.findFirst({
      where: { projectId, userId: addMemberDto.userId },
    });
    if (!projectMember) {
      throw new BadRequestException('L\'utilisateur doit etre membre du projet avant d\'etre ajoute au sprint');
    }

    await this.prisma.sprintMember.create({ data: { sprintId, userId: addMemberDto.userId } });
  }

  async removeMember(projectId: string, sprintId: string, memberId: string, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId, [UserRole.ADMIN, UserRole.MANAGER]);

    const member = await this.prisma.sprintMember.findFirst({ where: { id: memberId, sprintId } });
    if (!member) {
      throw new NotFoundException('Membre non trouve');
    }

    await this.prisma.sprintMember.delete({ where: { id: memberId } });
  }

  async getMembers(projectId: string, sprintId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.sprintMember.findMany({
      where: { sprintId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
    });
  }

  private async checkProjectAccess(projectId: string, userId: string, allowedRoles: UserRole[] = []) {
    const membership = await this.prisma.projectMember.findFirst({ where: { projectId, userId } });
    if (!membership) {
      throw new ForbiddenException('Acces non autorise a ce projet');
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Permissions insuffisantes pour cette action');
    }
  }

  private toResponseDto(sprint: any): SprintResponseDto {
    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
      _count: sprint._count,
    };
  }
}
