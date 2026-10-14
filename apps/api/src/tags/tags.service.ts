import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTagDto, UpdateTagDto, TagResponseDto } from './dto/tag.dto.js';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createTagDto: CreateTagDto, userId: string): Promise<TagResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const existingTag = await this.prisma.tag.findFirst({
      where: { name: createTagDto.name },
    });
    if (existingTag) {
      throw new ConflictException('Ce tag existe déjà');
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: createTagDto.name,
        color: createTagDto.color || '#6366f1',
      },
    });

    return this.toResponseDto(tag);
  }

  async findAll(projectId: string, userId: string): Promise<TagResponseDto[]> {
    await this.checkProjectAccess(projectId, userId);

    const tags = await this.prisma.tag.findMany({
      where: {
        tasks: {
          some: { task: { projectId } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map(this.toResponseDto);
  }

  async findOne(projectId: string, tagId: string, userId: string): Promise<TagResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        tasks: { some: { task: { projectId } } },
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }
    return this.toResponseDto(tag);
  }

  async update(projectId: string, tagId: string, updateTagDto: UpdateTagDto, userId: string): Promise<TagResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        tasks: { some: { task: { projectId } } },
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }

    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { name: updateTagDto.name },
      });
      if (existingTag) {
        throw new ConflictException('Ce nom de tag est déjà utilisé');
      }
    }

    const updatedTag = await this.prisma.tag.update({
      where: { id: tagId },
      data: updateTagDto,
    });

    return this.toResponseDto(updatedTag);
  }

  async remove(projectId: string, tagId: string, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId);

    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        tasks: { some: { task: { projectId } } },
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag non trouvé');
    }

    await this.prisma.tag.delete({ where: { id: tagId } });
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
  }

  private toResponseDto(tag: any): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    };
  }
}