// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de droit à l'oubli (suppression/anonymisation des données personnelles) (L7-12, EX-NFR-06)

import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuditService } from './audit.service.js';

@Injectable()
export class DroitSuppressionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Demande de suppression/anonymisation des données personnelles de l'utilisateur connecté
   * (droit à l'oubli, INPDP / RGPD art. 17).
   *
   * Comme l'utilisateur est référencé par de nombreuses tables (clés étrangères),
   * une suppression immédiate violerait l'intégrité référentielle.
   * La demande est donc enregistrée et l'utilisateur est anonymisé (pseudonymisation)
   * dans la mesure du possible ; un traitement complet est planifié par le DPO.
   */
  async demanderSuppression(
    userId: string,
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

    // Anonymisation réversible des données personnelles (pseudonymisation)
    const timestamp = Date.now();
    const anonymousEmail = `supprime-${timestamp}@anonyme.takt`;
    const anonymousNom = 'SUPPRIME';
    const anonymousPrenom = 'SUPPRIME';

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          firstName: anonymousNom,
          lastName: anonymousPrenom,
        },
      });

      await this.audit.writeAudit(tx as unknown as PrismaService, {
        userId,
        action: 'SUPPRESSION_DONNEES',
        objetType: 'User',
        objetId: userId,
        ancienneValeur: {
          email: user.email,
          nom: user.firstName,
          prenom: user.lastName,
        },
        nouvelleValeur: {
          email: anonymousEmail,
          nom: anonymousNom,
          prenom: anonymousPrenom,
        },
        motif: 'Droit à l\'oubli exercé par l\'utilisateur - anonymisation des données personnelles',
        requestId,
        ip,
      });
    });
  }
}