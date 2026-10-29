import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Garde d'immutabilité au niveau année (L7-03).
 *
 * Toute année dont le statut est `CLOTUREE` est en lecture seule :
 * aucune écriture n'est possible sur ses ressources dérivées,
 * y compris pour un Administrateur.
 */
@Injectable()
export class AnneeImmutabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie qu'une année n'est pas clôturée.
   * Lève ForbiddenException si l'année est CLOTUREE.
   * Lève NotFoundException si l'année n'existe pas.
   */
  async verifyAnneeWritable(anneeId: string): Promise<void> {
    const annee = await this.prisma.annee.findUnique({
      where: { id: anneeId },
      select: { id: true, statut: true, code: true },
    });
    if (!annee) {
      throw new NotFoundException(`Année "${anneeId}" introuvable`);
    }
    if (annee.statut === 'CLOTUREE') {
      throw new ForbiddenException(
        `L'année "${annee.code}" est clôturée et en lecture seule. Aucune écriture n'est autorisée.`,
      );
    }
  }

  /**
   * Vérifie qu'aucune des années données n'est clôturée.
   */
  async verifyAnneesWritable(anneeIds: string[]): Promise<void> {
    if (anneeIds.length === 0) return;
    const uniqueIds = [...new Set(anneeIds)];
    const annees = await this.prisma.annee.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, statut: true, code: true },
    });
    const cloturees = annees.filter((a) => a.statut === 'CLOTUREE');
    if (cloturees.length > 0) {
      const codes = cloturees.map((a) => a.code).join(', ');
      throw new ForbiddenException(
        `L'année(s) clôturée(s) et en lecture seule : ${codes}. Aucune écriture n'est autorisée.`,
      );
    }
  }
}
