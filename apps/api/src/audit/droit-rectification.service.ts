// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de droit de rectification des données personnelles (L7-12, EX-NFR-06)
// Permet à un utilisateur de corriger ses propres données.

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RectificationDto } from './dto/droit-personnel.dto.js';
import type { AuditService } from './audit.service.js';

@Injectable()
export class DroitRectificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Rectifie les données personnelles de l'utilisateur connecté
   * (droit de rectification, INPDP / RGPD art. 16).
   * Les champs modifiables sont : nom, prénom, e-mail.
   * L'opération est tracée dans l'audit métier.
   */
  async rectifierMesDonnees(
    userId: string,
    data: RectificationDto,
    requestId?: string,
    ip?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const updates: Record<string, unknown> = {};
    const ancienneValeur: Record<string, unknown> = {};
    const nouvelleValeur: Record<string, unknown> = {};

    if (data.nom !== undefined && data.nom !== user.firstName) {
      ancienneValeur.nom = user.firstName;
      nouvelleValeur.nom = data.nom;
      updates.firstName = data.nom;
    }

    if (data.prenom !== undefined && data.prenom !== user.lastName) {
      ancienneValeur.prenom = user.lastName;
      nouvelleValeur.prenom = data.prenom;
      updates.lastName = data.prenom;
    }

    if (data.email !== undefined && data.email !== user.email) {
      // Vérifier que l'email n'est pas déjà pris
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Cet e-mail est déjà utilisé par un autre compte');
      }
      ancienneValeur.email = user.email;
      nouvelleValeur.email = data.email;
      updates.email = data.email;
    }

    if (Object.keys(updates).length === 0) {
      return; // Rien à modifier
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updates,
      });

      await this.audit.writeAudit(tx as unknown as PrismaService, {
        userId,
        action: 'RECTIFICATION_DONNEES',
        objetType: 'User',
        objetId: userId,
        ancienneValeur: Object.keys(ancienneValeur).length > 0 ? ancienneValeur : undefined,
        nouvelleValeur: Object.keys(nouvelleValeur).length > 0 ? nouvelleValeur : undefined,
        motif: 'Droit de rectification exercé par l\'utilisateur',
        requestId,
        ip,
      });
    });
  }
}