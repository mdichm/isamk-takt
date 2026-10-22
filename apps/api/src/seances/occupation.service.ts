// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'occupations de ressources (L3-10)
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { VersionStatut } from '@takt/db';
import type { RessourceType, JourSemaine } from '@takt/db';
import type { CreateOccupationDto } from './dto/create-occupation.dto.js';
import { OccupationResponseDto, toOccupationDto } from './dto/occupation-response.dto.js';

// ============================================
// Occupations de ressources (L3-10)
// Créer / libérer une occupation avec pré-vérification de conflit
// et immutabilité des versions PUBLIE / ARCHIVE (409).
// ============================================

@Injectable()
export class OccupationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Crée une occupation de ressource pour une séance dans une version.
   * Lève 409 si la version est PUBLIE/ARCHIVE (immutabilité) ou si l'occupation
   * existe déjà (conflit ressource/créneau/version).
   */
  async createOccupation(
    dto: CreateOccupationDto,
    userId: string,
  ): Promise<OccupationResponseDto> {
    // 1. Vérifier la version et son statut d'immutabilité
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: dto.versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version ${dto.versionId} introuvable`);
    }
    if (
      version.statut === VersionStatut.PUBLIE ||
      version.statut === VersionStatut.ARCHIVE
    ) {
      throw new ConflictException(
        `IMMUTABILITY : cette séance appartient à une version ${version.statut} et ne peut pas être modifiée`,
      );
    }

    // 2. Vérifier que la séance existe et appartient à la version
    const seance = await this.prisma.seance.findUnique({
      where: { id: dto.seanceId },
      select: { id: true, versionId: true },
    });
    if (!seance) {
      throw new NotFoundException(`Séance ${dto.seanceId} introuvable`);
    }
    if (seance.versionId !== dto.versionId) {
      throw new BadRequestException(
        `La séance ${dto.seanceId} n'appartient pas à la version ${dto.versionId}`,
      );
    }

    // 3. Pré-vérification de conflit : une même ressource ne peut pas être occupée
    //    deux fois sur le même créneau dans la même version.
    const existing = await this.prisma.occupation.findFirst({
      where: {
        versionId: dto.versionId,
        jour: dto.jour,
        creneauId: dto.creneauId,
        ressourceType: dto.ressourceType,
        ressourceId: dto.ressourceId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `CONFLICT : la ressource ${dto.ressourceType} ${dto.ressourceId} est déjà occupée sur ce créneau (jour=${dto.jour}, creneau=${dto.creneauId}) dans cette version`,
      );
    }

    // 4. Créer l'occupation dans une transaction audit
    const created = await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.occupation.create({
          data: {
            versionId: dto.versionId,
            seanceId: dto.seanceId,
            jour: dto.jour,
            creneauId: dto.creneauId,
            ressourceType: dto.ressourceType,
            ressourceId: dto.ressourceId,
          },
        });
      },
      {
        userId,
        action: 'CREATE',
        objetType: 'Occupation',
        objetId: dto.seanceId,
        motif: `Création occupation ${dto.ressourceType}/${dto.ressourceId} sur séance ${dto.seanceId}`,
      },
    );

    return toOccupationDto(created);
  }

  /**
   * Libère (supprime) une occupation de ressource.
   * Lève 409 si la version est PUBLIE/ARCHIVE (immutabilité).
   */
  async releaseOccupation(id: string, userId: string): Promise<void> {
    // 1. Vérifier que l'occupation existe et récupérer sa version
    const existing = await this.prisma.occupation.findUnique({
      where: { id },
      include: {
        version: { select: { id: true, statut: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Occupation ${id} introuvable`);
    }

    // 2. Immutabilité : version PUBLIE/ARCHIVE
    if (
      existing.version.statut === VersionStatut.PUBLIE ||
      existing.version.statut === VersionStatut.ARCHIVE
    ) {
      throw new ConflictException(
        `IMMUTABILITY : cette occupation appartient à une version ${existing.version.statut} et ne peut pas être modifiée`,
      );
    }

    // 3. Supprimer l'occupation dans une transaction audit
    await this.audit.auditTransaction<any>(
      async (tx) => {
        return tx.occupation.delete({ where: { id } });
      },
      {
        userId,
        action: 'DELETE',
        objetType: 'Occupation',
        objetId: id,
        motif: `Libération occupation ${id}`,
      },
    );
  }
}
