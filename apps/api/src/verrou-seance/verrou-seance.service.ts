// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des verrous de séance (L3-36)

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import { VerrouSeanceResponseDto } from './dto/verrou-seance-response.dto.js';
import { BulkPoseResponseDto } from './dto/bulk-pose-response.dto.js';
import { VerrouPreviewResponseDto } from './dto/verrou-preview-response.dto.js';
import { RoleCode, VerrouType, VersionStatut } from '@takt/db';

/**
 * Vérifie que l'utilisateur courant est autorisé à poser/lever un verrou
 * (uniquement Gestionnaire ou Administrateur, conformément à EX-VRR-01).
 */
function verrouAutorise(role: string): void {
  if (role !== RoleCode.ADMINISTRATEUR && role !== RoleCode.GESTIONNAIRE) {
    throw new ForbiddenException(
      'Seul un Gestionnaire ou un Administrateur peut poser ou lever un verrou de séance',
    );
  }
}

@Injectable()
export class VerrouSeanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Pose un verrou sur une séance.
   * 404 si la séance est introuvable.
   * 423 si un verrou actif existe déjà pour (séance, type).
   */
  async pose(
    seanceId: string,
    type: VerrouType,
    auteurId: string,
    justification: string | undefined,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    verrouAutorise(currentUser.role);

    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      select: { id: true, versionId: true },
    });
    if (!seance) {
      throw new NotFoundException(`Séance ${seanceId} introuvable`);
    }

    const existing = await this.prisma.verrouSeance.findFirst({
      where: { seanceId, type, leveLe: null },
    });
    if (existing) {
      throw new ConflictException({
        code: 'VERROU_ACTIF',
        message: `Un verrou de type ${type} est déjà actif sur cette séance`,
        heldBy: existing.auteurId,
        creeLe: existing.creeLe,
      } as any);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const verrou = await (tx as unknown as PrismaService).verrouSeance.create({
        data: {
          seanceId,
          versionId: seance.versionId!,
          type,
          auteurId,
          justification,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'VERROU_POSE',
        objetType: 'VerrouSeance',
        objetId: verrou.id,
        ancienneValeur: undefined,
        nouvelleValeur: {
          seanceId: verrou.seanceId,
          type: verrou.type,
          auteurId: verrou.auteurId,
          justification: verrou.justification,
          creeLe: verrou.creeLe,
        },
        versionId: seance.versionId!,
        motif: `Pose d'un verrou ${type} sur la séance ${seanceId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(
        tx as unknown as PrismaService,
        auditData,
      );

      return verrou;
    });

    return VerrouSeanceResponseDto.fromPrisma(result);
  }

  /**
   * Leve le verrou actif sur une séance pour un type donné.
   * 404 si aucun verrou actif n'existe pour (séance, type).
   * Seuls Gestionnaire et Administrateur peuvent lever.
   */
  async leve(
    seanceId: string,
    type: VerrouType,
    auteurId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    verrouAutorise(currentUser.role);

    const existing = await this.prisma.verrouSeance.findFirst({
      where: { seanceId, type, leveLe: null },
      select: { id: true, seanceId: true, versionId: true, auteurId: true, type: true, creeLe: true },
    });
    if (!existing) {
      throw new NotFoundException(
        `Aucun verrou actif de type ${type} sur la séance ${seanceId}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const verrou = await (tx as unknown as PrismaService).verrouSeance.update({
        where: { id: existing.id },
        data: {
          leveLe: new Date(),
          levePar: currentUser.id,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'VERROU_LEVE',
        objetType: 'VerrouSeance',
        objetId: verrou.id,
        ancienneValeur: {
          seanceId: existing.seanceId,
          type: existing.type,
          auteurId: existing.auteurId,
          leveLe: null,
          levePar: null,
        },
        nouvelleValeur: {
          seanceId: verrou.seanceId,
          type: verrou.type,
          auteurId: verrou.auteurId,
          leveLe: verrou.leveLe,
          levePar: verrou.levePar,
        },
        versionId: existing.versionId!,
        motif: `Levée du verrou ${type} sur la séance ${seanceId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(
        tx as unknown as PrismaService,
        auditData,
      );

      return verrou;
    });

    return VerrouSeanceResponseDto.fromPrisma(result);
  }

  /**
   * Liste tous les verrous (actifs et levés) d'une séance.
   */
  async lister(seanceId: string): Promise<VerrouSeanceResponseDto[]> {
    const verrous = await this.prisma.verrouSeance.findMany({
      where: { seanceId },
      orderBy: { creeLe: 'desc' },
    });
    return verrous.map((v) => VerrouSeanceResponseDto.fromPrisma(v));
  }

  /**
   * Vérifie que la version est dans un état éditable.
   * Lève une erreur 423 VERSION_IMMUTABLE si la version est PUBLIE ou ARCHIVE.
   */
  private async checkVersionEditable(versionId: string): Promise<void> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id: versionId },
      select: { statut: true },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} introuvable`);
    }
    if (
      version.statut === VersionStatut.PUBLIE ||
      version.statut === VersionStatut.ARCHIVE
    ) {
      throw new ConflictException({
        code: 'VERSION_IMMUTABLE',
        message: `Cette version est ${version.statut} et ne peut pas être modifiée`,
      } as any);
    }
  }

  /**
   * Récupère les IDs de séances correspondant à une cible (groupe, enseignant, salle).
   */
  private async getSeanceIdsForCible(
    versionId: string,
    cible: { type: 'GROUPE' | 'ENSEIGNANT' | 'SALLE'; id: string },
  ): Promise<string[]> {
    switch (cible.type) {
      case 'GROUPE': {
        const seanceGroupes = await this.prisma.seanceGroupe.findMany({
          where: { groupeId: cible.id },
          select: { seanceId: true },
        });
        const seanceIds = seanceGroupes.map((sg) => sg.seanceId);
        const seances = await this.prisma.seance.findMany({
          where: { id: { in: seanceIds }, versionId },
          select: { id: true },
        });
        return seances.map((s) => s.id);
      }
      case 'ENSEIGNANT': {
        const seances = await this.prisma.seance.findMany({
          where: { versionId, enseignantId: cible.id },
          select: { id: true },
        });
        return seances.map((s) => s.id);
      }
      case 'SALLE': {
        const seances = await this.prisma.seance.findMany({
          where: { versionId, salleId: cible.id },
          select: { id: true },
        });
        return seances.map((s) => s.id);
      }
    }
  }

  /**
   * Pose des verrous en masse sur toutes les séances d'un groupe, enseignant ou salle.
   * Retourne le nombre de poses effectuées, ignorées (déjà existantes) et le détail.
   */
  async bulkPose(
    versionId: string,
    cible: { type: 'GROUPE' | 'ENSEIGNANT' | 'SALLE'; id: string },
    type: VerrouType,
    justification: string | undefined,
    auteurId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<BulkPoseResponseDto> {
    verrouAutorise(currentUser.role);
    await this.checkVersionEditable(versionId);

    const seanceIds = await this.getSeanceIdsForCible(versionId, cible);

    let poses = 0;
    let ignores = 0;
    const details: { seanceId: string; status: 'POSED' | 'SKIPPED_EXISTING' }[] = [];

    for (const seanceId of seanceIds) {
      const existing = await this.prisma.verrouSeance.findFirst({
        where: { seanceId, type, leveLe: null },
      });

      if (existing) {
        ignores++;
        details.push({ seanceId, status: 'SKIPPED_EXISTING' });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        const verrou = await (tx as unknown as PrismaService).verrouSeance.create({
          data: {
            seanceId,
            versionId,
            type,
            auteurId,
            justification,
          },
        });

        const auditData: WriteAuditDto = {
          userId: currentUser.id,
          action: 'VERROU_POSE',
          objetType: 'VerrouSeance',
          objetId: verrou.id,
          ancienneValeur: undefined,
          nouvelleValeur: {
            seanceId: verrou.seanceId,
            type: verrou.type,
            auteurId: verrou.auteurId,
            justification: verrou.justification,
            creeLe: verrou.creeLe,
          },
          versionId,
          motif: `Pose d'un verrou ${type} sur la séance ${seanceId} (bulk)`,
          ip: undefined,
          requestId: undefined,
        };

        await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
      });

      poses++;
      details.push({ seanceId, status: 'POSED' });
    }

    const response = new BulkPoseResponseDto();
    response.poses = poses;
    response.ignores = ignores;
    response.details = details;
    return response;
  }

  /**
   * Prévisualise l'impact de la levée d'un verrou (sans persister).
   * Retourne le nombre de séances concernées et un avertissement.
   */
  async previewLeve(
    verrouId: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouPreviewResponseDto> {
    verrouAutorise(currentUser.role);

    const verrou = await this.prisma.verrouSeance.findUnique({
      where: { id: verrouId },
      select: {
        id: true,
        seanceId: true,
        versionId: true,
        type: true,
        auteurId: true,
        justification: true,
        creeLe: true,
        leveLe: true,
      },
    });

    if (!verrou) {
      throw new NotFoundException(`Verrou ${verrouId} introuvable`);
    }

    if (verrou.leveLe) {
      throw new ConflictException({
        code: 'VERROU_DEJA_LEVE',
        message: 'Ce verrou a déjà été levé',
      } as any);
    }

    const response = new VerrouPreviewResponseDto();
    response.seancesConcernees = 1;
    response.avertissement = 'La prochaine génération pourra déplacer cette séance.';
    response.verrouId = verrou.id;

    return response;
  }

  /**
   * Lève un verrou, avec option de preview.
   * Si preview=true, retourne l'impact sans persister.
   * Si preview=false, lève réellement le verrou.
   */
  async leveWithPreview(
    verrouId: string,
    currentUser: { id: string; role: string; departments?: string[] },
    preview: boolean,
  ): Promise<VerrouSeanceResponseDto | VerrouPreviewResponseDto> {
    if (preview) {
      return this.previewLeve(verrouId, currentUser);
    }

    verrouAutorise(currentUser.role);

    const existing = await this.prisma.verrouSeance.findUnique({
      where: { id: verrouId },
    });

    if (!existing) {
      throw new NotFoundException(`Verrou ${verrouId} introuvable`);
    }

    if (existing.leveLe) {
      throw new ConflictException({
        code: 'VERROU_DEJA_LEVE',
        message: 'Ce verrou a déjà été levé',
      } as any);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const verrou = await (tx as unknown as PrismaService).verrouSeance.update({
        where: { id: existing.id },
        data: {
          leveLe: new Date(),
          levePar: currentUser.id,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'VERROU_LEVE',
        objetType: 'VerrouSeance',
        objetId: verrou.id,
        ancienneValeur: {
          seanceId: existing.seanceId,
          type: existing.type,
          auteurId: existing.auteurId,
          leveLe: null,
          levePar: null,
        },
        nouvelleValeur: {
          seanceId: verrou.seanceId,
          type: verrou.type,
          auteurId: verrou.auteurId,
          leveLe: verrou.leveLe,
          levePar: verrou.levePar,
        },
        versionId: existing.versionId!,
        motif: `Levée du verrou ${existing.type} sur la séance ${existing.seanceId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);

      return verrou;
    });

    return VerrouSeanceResponseDto.fromPrisma(result);
  }
}
