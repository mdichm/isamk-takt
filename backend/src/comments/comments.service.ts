import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto/comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, taskId: string, createCommentDto: CreateCommentDto, userId: string): Promise<CommentResponseDto> {
    await this.checkTaskAccess(projectId, taskId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        content: createCommentDto.content,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await this.prisma.activity.create({
      data: {
        taskId,
        userId,
        type: 'COMMENTED',
        metadata: { commentId: comment.id },
      },
    });

    return this.toResponseDto(comment);
  }

  async findAll(projectId: string, taskId: string, userId: string): Promise<CommentResponseDto[]> {
    await this.checkTaskAccess(projectId, taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return comments.map(this.toResponseDto);
  }

  async update(projectId: string, taskId: string, commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CommentResponseDto> {
    await this.checkTaskAccess(projectId, taskId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: updateCommentDto.content },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return this.toResponseDto(updatedComment);
  }

  async remove(projectId: string, taskId: string, commentId: string, userId: string): Promise<void> {
    await this.checkTaskAccess(projectId, taskId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  private async checkTaskAccess(projectId: string, taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
  }

  private toResponseDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
    };
  }
}