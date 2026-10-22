// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de changement d'enseignant d'une séance (L3-22)
// PATCH /seances/{id}/enseignant — changement d'enseignant avec contrôle optimiste, bail, verrous, détection de conflits et audit.

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
import { RoleCode, VersionStatut, VerrouType } from '@takt/db';
import type { SeanceResponseDto } from './dto/seance-response.dto.js';
import { toSeanceDto } from './dto/seance-response.dto.js';
import { ChangeEnseignantDto } from './dto/change-enseignant.dto.js';

const VERROUX_BLOQUANTS_ENSEIGNANT: VerrouType[] = ['ENSEIGNANT', 'ACTIVITE'];

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
  affectationKey: string;
  revision: number;
  seanceGroupes: { groupeId: string }[];
}

function extraireModuleEtType(
  affectationKey: string,
): { moduleId: string; typeEnseignementId: string } {
  const parts = affectationKey.split(':');
  if (parts.length < 4) {
    throw new ConflictException(
      `Clé d'affectation mal formée : ${affectationKey}`,
    );
  }
  return {
    moduleId: parts[1],
    typeEnseignementId: parts[2],
  };
}

@Injectable()
export class ChangeEnseignantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
    private readonly audit: AuditService,
  ) {}

  async changeEnseignant(
    seanceId: string,
    dto: ChangeEnseignantDto,
    ifMatch: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;
    const isAdmin = role === RoleCode.ADMINISTRATEUR;
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
        affectationKey: true,
        revision: true,
        seanceGroupes: { select: { groupeId: true } },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Séance "${seanceId}" introuvable`);
    }

    const seanceData: SeanceAvecDonnees = seance as unknown as SeanceAvecDonnees;

    if (isDirection) {
      const version = await this.prisma.versionEdt.findUnique({
        where: { id: seance.versionId! },
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

    const versionId = seance.versionId!;

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
        `IMMUTABILITY : cette séance appartient à une version ${version.statut} et ne peut pas être modifiée`,
      );
    }

    const now = new Date();
    const editLock = await this.prisma.editLock.findUnique({
      where: { versionId },
    });
    if (!editLock || editLock.expiresAt < now) {
      throw new ForbiddenException(
        'Aucun bail d\'édition actif sur cette version. Acquérez un bail avant de modifier une séance.',
      );
    }
    const isOwner = editLock.userId === currentUser.id;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Le bail d\'édition est détenu par un autre utilisateur',
      );
    }

    const verrousActifs = await this.prisma.verrouSeance.findMany({
      where: {
        seanceId,
        type: { in: VERROUX_BLOQUANTS_ENSEIGNANT },
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

    const { moduleId, typeEnseignementId } = extraireModuleEtType(
      seanceData.affectationKey,
    );

    const ctx = await this.conflitService.getConflictContext(versionId);

    for (const sg of seanceData.seanceGroupes) {
      const entree = ctx.snapshot.get(sg.groupeId, moduleId, typeEnseignementId);
      const enseignantsAutorises = entree?.enseignantsAutorises ?? [];
      if (!enseignantsAutorises.includes(dto.enseignantId)) {
        throw new HttpException(
          {
            code: 'TEACHER_NOT_ASSIGNED',
            message: `L'enseignant ${dto.enseignantId} n'est pas autorisé pour le groupe ${sg.groupeId} dans le snapshot de cette séance`,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    const ancienneValeur = {
      enseignantId: seance.enseignantId,
      revision: seance.revision,
    };

    const slotKeys = seance.jour && seance.creneauDebutId
      ? ctx.grille.consecutifs(seance.jour, seance.creneauDebutId, seance.nbCreneaux)
      : null;
    const creneauIds = slotKeys ? slotKeys.map((sk) => sk.split('|')[1]) : [];

    const result = await this.prisma.$transaction(async (tx) => {
      const txService = tx as unknown as PrismaService;

      const updatedSeance = await txService.seance.update({
        where: { id: seanceId },
        data: {
          enseignantId: dto.enseignantId,
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
          seanceGroupes: { select: { groupeId: true } },
        },
      });

      if (creneauIds.length > 0) {
        await txService.occupation.deleteMany({
          where: { seanceId, ressourceType: 'ENSEIGNANT' },
        });

        for (const creneauId of creneauIds) {
          await txService.occupation.create({
            data: {
              versionId,
              seanceId,
              jour: seance.jour!,
              creneauId,
              ressourceType: 'ENSEIGNANT' as any,
              ressourceId: dto.enseignantId,
            },
          });
        }
      }

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'SEANCE_ENSEIGNANT_CHANGE',
        objetType: 'Seance',
        objetId: seanceId,
        ancienneValeur,
        nouvelleValeur: {
          enseignantId: updatedSeance.enseignantId,
          revision: updatedSeance.revision,
        },
        versionId,
        motif: `Changement d'enseignant de la séance ${seanceId} vers ${dto.enseignantId}`,
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