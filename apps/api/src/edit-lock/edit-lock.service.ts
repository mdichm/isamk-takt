// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service du bail d'édition exclusif (L3-19)

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { EditLockResponseDto } from './dto/edit-lock-response.dto.js';
import { RoleCode } from '@takt/db';

const BAIL_DUREE_MINUTES = 30;

@Injectable()
export class EditLockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async acquire(
    versionId: string,
    userId: string,
    currentUser: { id: string; role: string },
  ): Promise<EditLockResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} introuvable`);
    }

    const existing = await this.prisma.editLock.findUnique({
      where: { versionId },
    });

    const now = new Date();

    if (existing) {
      if (existing.expiresAt < now) {
        return this.upsertLock(versionId, userId, currentUser, 'EDIT_LOCK_ACQUIRE', 'Bail expiré, réacquisition');
      }

      if (existing.userId === userId) {
        return this.upsertLock(versionId, userId, currentUser, 'EDIT_LOCK_ACQUIRE', 'Renouvellement du bail');
      }

      throw new ConflictException({
        code: 'EDIT_LOCK_HELD',
        message: `Cette édition est verrouillée par un autre utilisateur jusqu'au ${existing.expiresAt.toISOString()}`,
        heldBy: existing.userId,
        expiresAt: existing.expiresAt,
      } as any);
    }

    return this.upsertLock(versionId, userId, currentUser, 'EDIT_LOCK_ACQUIRE', 'Nouveau bail');
  }

  async heartbeat(
    versionId: string,
    userId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EditLockResponseDto> {
    const existing = await this.prisma.editLock.findUnique({
      where: { versionId },
    });

    if (!existing) {
      throw new NotFoundException(`Aucun bail actif sur la version ${versionId}`);
    }

    const isOwner = existing.userId === userId;
    const isAdmin = currentUser.role === RoleCode.ADMINISTRATEUR;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Seul le détenteur du bail ou un administrateur peut le renouveler');
    }

    return this.upsertLock(versionId, existing.userId, currentUser, 'EDIT_LOCK_ACQUIRE', 'Heartbeat / renouvellement');
  }

  async release(
    versionId: string,
    userId: string,
    currentUser: { id: string; role: string; departments?: string[] },
    force = false,
  ): Promise<void> {
    const existing = await this.prisma.editLock.findUnique({
      where: { versionId },
    });

    if (!existing) {
      return;
    }

    const isOwner = existing.userId === userId;
    const isAdmin = currentUser.role === RoleCode.ADMINISTRATEUR;

    if (force) {
      if (!isAdmin) {
        throw new ForbiddenException("Seul un administrateur peut forcer la libération d'un bail");
      }
    } else if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez libérer que votre propre bail');
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as unknown as PrismaService).editLock.delete({
        where: { versionId },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'EDIT_LOCK_RELEASE',
        objetType: 'EditLock',
        objetId: existing.id,
        ancienneValeur: {
          versionId: existing.versionId,
          userId: existing.userId,
          expiresAt: existing.expiresAt,
        },
        nouvelleValeur: undefined,
        versionId,
        motif: force
          ? `Libération forcée par l'administrateur ${currentUser.id}`
          : 'Libération du bail',
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
    });
  }

  private async upsertLock(
    versionId: string,
    userId: string,
    currentUser: { id: string; role: string },
    action: string,
    motif: string,
  ): Promise<EditLockResponseDto> {
    const expiresAt = new Date(Date.now() + BAIL_DUREE_MINUTES * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const lock = await (tx as unknown as PrismaService).editLock.upsert({
        where: { versionId },
        update: {
          userId,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          versionId,
          userId,
          expiresAt,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action,
        objetType: 'EditLock',
        objetId: lock.id,
        ancienneValeur: undefined,
        nouvelleValeur: {
          versionId: lock.versionId,
          userId: lock.userId,
          expiresAt: lock.expiresAt,
        },
        versionId,
        motif,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);

      return lock;
    });

    return {
      versionId: result.versionId,
      userId: result.userId,
      expiresAt: result.expiresAt,
    };
  }
}
