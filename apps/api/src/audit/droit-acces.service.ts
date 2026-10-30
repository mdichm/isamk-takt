// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de droit d'accès aux données personnelles (L7-12, EX-NFR-06)
// Retourne toutes les données personnelles d'un utilisateur connecté.

import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type {
  MesDonneesDto,
  DonneesSecuriteDto,
  DonneesExportDto,
  ExportMesDonneesDto,
} from './dto/droit-personnel.dto.js';

@Injectable()
export class DroitAccesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne toutes les données personnelles de l'utilisateur connecté
   * (droit d'accès, article 15 du RGPD / droit d'accès INPDP).
   */
  async getMesDonnees(userId: string): Promise<ExportMesDonneesDto> {
    // Profil utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const profil: MesDonneesDto = {
      id: user.id,
      email: user.email,
      nom: user.firstName,
      prenom: user.lastName,
      actif: user.isActive ? true : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Événements de sécurité liés à l'utilisateur
    const securityEvents = await this.prisma.securityEvent.findMany({
      where: { userId },
      select: {
        id: true,
        at: true,
        type: true,
        ip: true,
        userAgent: true,
        requestId: true,
      },
      orderBy: { at: 'desc' },
      take: 100,
    });

    const securite: DonneesSecuriteDto[] = securityEvents.map((e) => ({
      id: e.id.toString(),
      at: e.at,
      type: e.type,
      ip: e.ip ?? undefined,
      userAgent: e.userAgent ?? undefined,
      requestId: e.requestId ?? undefined,
    }));

    // Jobs d'export créés par l'utilisateur
    const exportJobs = await this.prisma.exportJob.findMany({
      where: { auteurId: userId },
      select: {
        id: true,
        versionId: true,
        format: true,
        mode: true,
        statut: true,
        createdAt: true,
        finishedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const exports: DonneesExportDto[] = exportJobs.map((j) => ({
      id: j.id,
      versionId: j.versionId,
      format: j.format,
      mode: j.mode,
      statut: j.statut,
      createdAt: j.createdAt,
      finishedAt: j.finishedAt ?? undefined,
    }));

    return { profil, securite, exports };
  }
}