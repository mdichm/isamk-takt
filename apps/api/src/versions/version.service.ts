// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de création de version (L3-09)
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
import type { VersionStatut } from '@takt/db';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import type { VersionResponseDto } from './dto/version-response.dto.js';

// ============================================
// Création de version (L3-09)
// POST /versions : sélection des derniers snapshots validés par département,
// création des séances à partir des affectations figées.
// ============================================

@Injectable()
export class VersionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste toutes les versions (lecture, permission version:read). */
  async findAll(): Promise<VersionResponseDto[]> {
    const versions = await this.prisma.versionEdt.findMany({
      select: {
        id: true,
        semestreId: true,
        numero: true,
        statut: true,
        motif: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return versions.map((v) => ({
      id: v.id,
      semestreId: v.semestreId,
      numero: v.numero,
      statut: v.statut,
      motif: v.motif ?? undefined,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  /** Détail d'une version par ID (lecture, permission version:read). */
  async findOne(id: string): Promise<VersionResponseDto> {
    const version = await this.prisma.versionEdt.findUnique({
      where: { id },
      select: {
        id: true,
        semestreId: true,
        numero: true,
        statut: true,
        motif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!version) {
      throw new NotFoundException(`Version "${id}" introuvable`);
    }

    // L3-24 : dernier auteur et dernière modification de la version depuis l'audit.
    const dernierAudit = await this.prisma.auditLog.findFirst({
      where: { versionId: id },
      orderBy: { at: 'desc' },
      select: { userId: true, at: true },
    });

    return {
      id: version.id,
      semestreId: version.semestreId,
      numero: version.numero,
      statut: version.statut,
      motif: version.motif ?? undefined,
      dernierAuteurId: dernierAudit?.userId ?? undefined,
      derniereModificationAt: dernierAudit?.at ?? undefined,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  async createVersion(
    dto: CreateVersionDto,
    _userId: string,
  ): Promise<VersionResponseDto> {
    // 1. Vérifier l'existence du semestre
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    // 2. Récupérer les départements du semestre
    const departements = await this.prisma.departement.findMany({
      where: { anneeId: semestre.anneeId },
      select: { id: true, code: true },
    });

    // 3. Pour chaque département, trouver le dernier snapshot VALIDEE
    const snapshotsParDepartement = await Promise.all(
      departements.map(async (departement) => {
        const repartition = await this.prisma.repartition.findFirst({
          where: {
            semestreId: dto.semestreId,
            departementId: departement.id,
            statut: 'VALIDEE',
          },
          select: { id: true },
        });

        if (!repartition) {
          throw new BadRequestException(
            `Aucun snapshot valide pour le département "${departement.code}"`,
          );
        }

        const snapshot = await this.prisma.snapshot.findFirst({
          where: { repartitionId: repartition.id },
          orderBy: { createdAt: 'desc' },
        });

        if (!snapshot) {
          throw new BadRequestException(
            `Aucun snapshot valide pour le département "${departement.code}"`,
          );
        }

        return snapshot;
      }),
    );

    // 4. Vérifier qu'aucune version de travail n'existe déjà pour ce semestre
    const versionExistante = await this.prisma.versionEdt.findFirst({
      where: {
        semestreId: dto.semestreId,
        statut: {
          notIn: ['PUBLIE', 'ARCHIVE'],
        },
      },
    });
    if (versionExistante) {
      throw new ConflictException(
        `Une version de travail existe déjà pour ce semestre (${versionExistante.numero}, statut ${versionExistante.statut})`,
      );
    }

    // 5. Numérotation : premier majeur à 1, sinon dernier majeur + 1, mineur 0
    const derniereVersion = await this.prisma.versionEdt.findFirst({
      where: { semestreId: dto.semestreId },
      orderBy: { createdAt: 'desc' },
    });
    let majeur = 1;
    if (derniereVersion) {
      const dernierMajeur = parseInt(derniereVersion.numero.split('.')[0], 10);
      majeur = Number.isNaN(dernierMajeur) ? 1 : dernierMajeur + 1;
    }
    const numero = `${majeur}.0`;

    // 6. Créer la version, ses snapshots et ses séances dans une transaction
    const version = await this.prisma.$transaction(async (tx) => {
      const v = await tx.versionEdt.create({
        data: {
          semestreId: dto.semestreId,
          numero,
          statut: 'BROUILLON' as VersionStatut,
          motif: dto.motif ?? null,
        },
      });

      // Lier les snapshots sélectionnés
      await tx.versionSnapshot.createMany({
        data: snapshotsParDepartement.map((s: { id: string }) => ({
          versionId: v.id,
          snapshotId: s.id,
        })),
      });

      // Créer une séance par affectation figée dans chaque snapshot
      for (const snapshot of snapshotsParDepartement) {
        const affectations = await tx.snapshotAffectation.findMany({
          where: { snapshotId: snapshot.id },
          orderBy: [
            { enseignantId: 'asc' },
            { moduleId: 'asc' },
            { typeEnseignementId: 'asc' },
          ],
        });

        // Dédoublonnage CM commun : regrouper par (groupeCommunKey, module, type, enseignant)
        const cmParCle = new Map<string, typeof affectations[number][]>();
        const affectationsSimples: typeof affectations = [];

        for (const a of affectations) {
          if (a.estCmCommun && a.groupeId) {
            const cle = `cm-${a.moduleId}-${a.typeEnseignementId}`;
            if (!cmParCle.has(cle)) cmParCle.set(cle, []);
            cmParCle.get(cle)!.push(a);
          } else {
            affectationsSimples.push(a);
          }
        }

        // Séances pour les affectations simples (1 séance par affectation)
        for (const a of affectationsSimples) {
          const groupeIds = a.groupeId ? [a.groupeId] : [];
          await this.creerSeance(
            tx,
            v.id,
            dto.semestreId,
            a,
            groupeIds,
            snapshot.tag,
          );
        }

        // Séances pour les CM communs (1 séance multi-groupes par clé)
        for (const [_cle, groupeAffectations] of cmParCle) {
          const representant = groupeAffectations[0];
          const groupeIds = [
            ...new Set(
              groupeAffectations
                .map((a) => a.groupeId)
                .filter((g): g is string => g !== null),
            ),
          ];
          await this.creerSeance(
            tx,
            v.id,
            dto.semestreId,
            representant,
            groupeIds,
            snapshot.tag,
          );
        }
      }

      return v;
    });

    return {
      id: version.id,
      semestreId: version.semestreId,
      numero: version.numero,
      statut: version.statut,
      motif: version.motif ?? undefined,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }
  /**
   * Crée une séance et ses liens SeanceGroupe à partir d'une affectation figée.
   */
  private async creerSeance(
    tx: any,
    versionId: string,
    semestreId: string,
    affectation: {
      enseignantId: string;
      groupeId: string | null;
      moduleId: string;
      typeEnseignementId: string;
      activityTagId: string | null;
      dureeMinutes: number;
      seancesParSemaine: number;
      estCmCommun: boolean;
    },
    groupeIds: string[],
    tag: string | undefined,
  ): Promise<void> {
    const affectationKey = affectation.groupeId
      ? `${affectation.groupeId}:${affectation.moduleId}:${affectation.typeEnseignementId}:${affectation.enseignantId}`
      : `cm:${affectation.moduleId}:${affectation.typeEnseignementId}:${affectation.enseignantId}`;

    await tx.seance.create({
      data: {
        versionId,
        semestreId,
        affectationKey,
        rang: 1,
        tag,
        enseignantId: affectation.enseignantId,
        salleId: null,
        jour: null,
        creneauDebut: null,
        nbCreneaux: 1,
        statut: 'NON_PLACEE',
        groupes: {
          create: groupeIds.map((groupeId) => ({ groupeId })),
        },
      },
    });
  }
}
