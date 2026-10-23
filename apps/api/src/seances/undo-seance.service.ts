// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'annulation d'un déplacement de séance (L3-24)
// PATCH /seances/{id}/undo — restaure la position précédente (avant le dernier déplacement)
// avec les mêmes contrôles que le déplacement (If-Match, bail d'édition, verrous, immuabilité).

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionStatut, RoleCode, SeanceStatut, VerrouType, JourSemaine } from '@takt/db';
import type { SeanceResponseDto } from './dto/seance-response.dto.js';
import { toSeanceDto } from './dto/seance-response.dto.js';
import { UndoSeanceDto } from './dto/undo-seance.dto.js';

const VERROUX_BLOQUANTS: VerrouType[] = ['CRENEAU', 'SALLE', 'ACTIVITE'];

interface SeanceAvecDonnees {
  id: string;
  versionId: string | null;
  semestreId: string;
  enseignantId: string | null;
  salleId: string | null;
  jour: string | null;
  creneauDebutId: string | null;
  nbCreneaux: number;
  statut: string;
  tag: string | null;
  revision: number;
  seanceGroupes: { groupeId: string }[];
}

@Injectable()
export class UndoSeanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
    private readonly audit: AuditService,
  ) {}

  async undo(
    seanceId: string,
    ifMatch: string,
    currentUser: { id: string; role: string; departments?: string[] },
    dto: UndoSeanceDto,
  ): Promise<SeanceResponseDto> {
    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    const where: Record<string, unknown> = { id: seanceId };
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
        enseignantId: true,
        salleId: true,
        jour: true,
        creneauDebutId: true,
        nbCreneaux: true,
        statut: true,
        tag: true,
        revision: true,
        seanceGroupes: { select: { groupeId: true } },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Séance "${seanceId}" introuvable`);
    }

    if (!seance.versionId) {
      throw new NotFoundException(
        `Séance "${seanceId}" n'est rattachée à aucune version`,
      );
    }
    const versionId: string = seance.versionId;

    if (isDirection) {
      const version = await this.prisma.versionEdt.findUnique({
        where: { id: versionId },
        select: { statut: true },
      });
      if (!version || !['PUBLIE', 'ARCHIVE'].includes(version.statut)) {
        throw new NotFoundException(`Séance "${seanceId}" introuvable`);
      }
    }

    if (!ifMatch || String(seance.revision) !== ifMatch) {
      throw new HttpException(
        {
          message: 'En-tête If-Match requis ou révision périmée',
          error: 'Precondition Failed',
          errorCode: 'PRECONDITION_FAILED',
        },
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { id: true, statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version "${versionId}" introuvable`);
    }
    if (
      version.statut === VersionStatut.PUBLIE ||
      version.statut === VersionStatut.ARCHIVE
    ) {
      throw new ConflictException(
        `IMMUTABILITY : cette séance appartient à une version ${version.statut} et ne peut pas être annulée`,
      );
    }

    const now = new Date();
    const editLock = await this.prisma.editLock.findUnique({
      where: { versionId },
    });
    if (!editLock || editLock.expiresAt < now) {
      throw new ForbiddenException(
        'Aucun bail d\'édition actif sur cette version. Acquérez un bail avant d\'annuler une modification.',
      );
    }
    const isOwner = editLock.userId === currentUser.id;
    const isAdmin = currentUser.role === RoleCode.ADMINISTRATEUR;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Le bail d\'édition est détenu par un autre utilisateur',
      );
    }

    const verrousActifs = await this.prisma.verrouSeance.findMany({
      where: {
        seanceId,
        type: { in: VERROUX_BLOQUANTS },
        leveLe: null,
      },
      select: { id: true, type: true, auteurId: true, creeLe: true },
    });
    if (verrousActifs.length > 0) {
      const types = verrousActifs.map((v) => v.type).join(', ');
      throw new ConflictException(
        `Séance verrouillée (${types}), état non éditable`,
      );
    }

    const dernierAudit = await this.prisma.auditLog.findFirst({
      where: {
        objetType: 'Seance',
        objetId: seanceId,
        action: 'SEANCE_DEPLACE',
      },
      orderBy: { at: 'desc' },
      select: {
        id: true,
        at: true,
        ancienneValeur: true,
        nouvelleValeur: true,
        userId: true,
      },
    });

    if (!dernierAudit || !dernierAudit.ancienneValeur) {
      throw new NotFoundException(
        `Aucun historique de déplacement trouvé pour la séance "${seanceId}"`,
      );
    }

    const ancienneValeur = dernierAudit.ancienneValeur as {
      jour?: string | null;
      creneauDebutId?: string | null;
      salleId?: string | null;
      statut?: string;
      revision?: number;
    };

    const precedentePosition = {
      jour: ancienneValeur.jour ?? null,
      creneauDebutId: ancienneValeur.creneauDebutId ?? null,
      salleId: ancienneValeur.salleId ?? null,
      statut: (ancienneValeur.statut ?? seance.statut) as SeanceStatut,
    };

    const nouvelleValeurPourAudit = {
      jour: precedentePosition.jour,
      creneauDebutId: precedentePosition.creneauDebutId,
      salleId: precedentePosition.salleId,
      statut: precedentePosition.statut,
      revision: seance.revision + 1,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const txService = tx as unknown as PrismaService;

      const updatedSeance = await txService.seance.update({
        where: { id: seanceId },
        data: {
          jour: precedentePosition.jour as JourSemaine,
          creneauDebutId: precedentePosition.creneauDebutId ?? undefined,
          salleId: precedentePosition.salleId ?? undefined,
          statut: precedentePosition.statut,
          revision: { increment: 1 },
        },
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
        },
      });

      await txService.occupation.deleteMany({
        where: { seanceId },
      });

      const ressources: { ressourceType: string; ressourceId: string }[] = [];
      if (updatedSeance.enseignantId) {
        ressources.push({ ressourceType: 'ENSEIGNANT', ressourceId: updatedSeance.enseignantId });
      }
      if (updatedSeance.salleId) {
        ressources.push({ ressourceType: 'SALLE', ressourceId: updatedSeance.salleId });
      }
      for (const sg of (seance.seanceGroupes as { groupeId: string }[])) {
        ressources.push({ ressourceType: 'GROUPE', ressourceId: sg.groupeId });
      }

      if (precedentePosition.creneauDebutId) {
        for (const ressource of ressources) {
          await txService.occupation.create({
            data: {
              versionId,
              seanceId,
              jour: precedentePosition.jour as JourSemaine,
              creneauId: precedentePosition.creneauDebutId,
              ressourceType: ressource.ressourceType as any,
              ressourceId: ressource.ressourceId,
            },
          });
        }
      }

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'SEANCE_ANNULE',
        objetType: 'Seance',
        objetId: seanceId,
        ancienneValeur: {
          jour: seance.jour,
          creneauDebutId: seance.creneauDebutId,
          salleId: seance.salleId,
          statut: seance.statut,
          revision: seance.revision,
        },
        nouvelleValeur: nouvelleValeurPourAudit,
        versionId,
        motif: dto.motif ?? `Annulation du dernier déplacement de la séance ${seanceId}`,
        ip: undefined,
        requestId: undefined,
      };
      await this.audit.writeAudit(txService, auditData);

      return updatedSeance;
    });

    await this.conflitService.recomputeConflits(versionId);

    const seanceAvecOccupations = await this.prisma.seance.findUnique({
      where: { id: seanceId },
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
        seanceGroupes: { select: { groupeId: true } },
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
      },
    });

    return toSeanceDto(seanceAvecOccupations!, true);
  }
}
