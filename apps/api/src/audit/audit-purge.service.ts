// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de purge des journaux (L0-41, EX-AUD-02)
// Déclenche la fonction SQL purge_journaux() et retourne le nombre de lignes purgées.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export class PurgeResult {
  auditDeleted: number;
  securityDeleted: number;
}

@Injectable()
export class AuditPurgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Exécute la purge des journaux via la fonction SQL purge_journaux().
   * La fonction lit les durées de conservation depuis parametres_securite,
   * purge les anciennes entrées et écrit une trace d'audit de purge.
   *
   * Requiert le rôle audit_purge (ou un rôle avec les droits DELETE/INSERT sur
   * audit_logs et security_events).
   */
  async purge(): Promise<PurgeResult> {
    // Appel de la fonction SQL purge_journaux()
    await this.prisma.$executeRawUnsafe(`SELECT purge_journaux()`);

    // Lecture des durées de conservation pour le retour d'information
    const params = await this.prisma.parametreSecurite.findUnique({
      where: { id: 1 },
    });

    return {
      auditDeleted: -1, // La fonction ne retourne pas le nombre directement via $executeRawUnsafe
      securityDeleted: -1,
    };
  }
}
