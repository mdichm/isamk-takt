// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de lecture des séances (L3-11)
// GET /versions/{id}/seances, GET /seances/{id} — consultation seulement (pas d'écriture)
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoleCode } from '@takt/db';
import type { SeanceQueryDto } from './dto/seance-query.dto.js';
import type { SeanceResponseDto } from './dto/seance-response.dto.js';
import { toSeanceDto } from './dto/seance-response.dto.js';

// ============================================
// Seance (L3-11) — lecture seule
// Règles de visibilité (ST §5.2, tickets L3-11) :
// - ADMINISTRATEUR / GESTIONNAIRE : tout voir (pas de filtre département)
// - RESPONSABLE_DEPARTEMENT : seulement les séances dont au moins un groupe
//   appartient à ses départements (via SeanceGroupe → Groupe → Niveau →
//   Formation → Departement). Hors portée → 404.
// - DIRECTION : lecture seule, uniquement versions PUBLIE / ARCHIVE
//   (pas de versions de travail). Hors portée → 404.
// ============================================

@Injectable()
export class SeancesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste paginée des séances d'une version, avec filtres et scope métier. */
  async findSeancesByVersion(
    versionId: string,
    query: SeanceQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<{ data: SeanceResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 10, statut, jour, enseignantId, salleId, affectationKey } = query;

    // 1. Vérifier l'existence de la version et appliquer le filtrage Direction
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;

    // Direction : uniquement PUBLIE / ARCHIVE, sinon 404 (ne rien révéler des versions de travail)
    if (isDirection && !['PUBLIE', 'ARCHIVE'].includes(version.statut)) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }

    // 2. Construire le where de base
    const where: Record<string, unknown> = { versionId };
    if (statut) where.statut = statut;
    if (jour) where.jour = jour;
    if (enseignantId) where.enseignantId = enseignantId;
    if (salleId) where.salleId = salleId;
    if (affectationKey) where.affectationKey = affectationKey;

    // 3. Scope département (Responsable de département uniquement)
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    if (isScopedRole) {
      // Ne garder que les séances dont au moins un groupe appartient aux départements de l'utilisateur
      (where as Record<string, unknown>).seanceGroupes = {
        some: {
          groupe: {
            niveau: {
              formation: {
                departementId: { in: userDepartments },
              },
            },
          },
        },
      };
    }

    // 4. Requêtes ciblées (select, pas d'include profond) + pagination
    const [seances, total] = await Promise.all([
      this.prisma.seance.findMany({
        where,
        select: {
          id: true,
          versionId: true,
          semestreId: true,
          affectationKey: true,
          rang: true,
          tag: true,
          statut: true,
          origine: true,
          revision: true,
          jour: true,
          creneauDebutId: true,
          nbCreneaux: true,
          enseignantId: true,
          salleId: true,
          seanceGroupes: {
            select: { groupeId: true },
          },
        },
        orderBy: { rang: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seance.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: seances.map((s) => toSeanceDto(s, false)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /** Détail d'une séance avec ses occupations. */
  async findSeanceById(
    id: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    // Construire le where avec scope
    const where: Record<string, unknown> = { id };
    if (isScopedRole) {
      (where as Record<string, unknown>).seanceGroupes = {
        some: {
          groupe: {
            niveau: {
              formation: {
                departementId: { in: userDepartments },
              },
            },
          },
        },
      };
    }

    const seance = await this.prisma.seance.findFirst({
      where,
      select: {
        id: true,
        versionId: true,
        semestreId: true,
        affectationKey: true,
        rang: true,
        tag: true,
        statut: true,
        origine: true,
        revision: true,
        jour: true,
        creneauDebutId: true,
        nbCreneaux: true,
        enseignantId: true,
        salleId: true,
        seanceGroupes: {
          select: { groupeId: true },
        },
        occupations: {
          select: {
            id: true,
            versionId: true,
            seanceId: true,
            jour: true,
            creneauId: true,
            ressourceType: true,
            ressourceId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        version: {
          select: { id: true, statut: true },
        },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Séance "${id}" introuvable`);
    }

    // Direction : vérifier que la version est PUBLIE / ARCHIVE (404 sinon)
    if (isDirection) {
      const statutVersion = (seance.version as { statut: string }).statut;
      if (!['PUBLIE', 'ARCHIVE'].includes(statutVersion)) {
        throw new NotFoundException(`Séance "${id}" introuvable`);
      }
    }

    return toSeanceDto(seance, true);
  }
}
