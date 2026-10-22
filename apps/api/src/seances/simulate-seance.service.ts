// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de simulation de placement (L3-21)
// Lecture seule : aucune écriture en base. Dépend uniquement de ce_recompute.
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { RoleCode } from '@takt/db';
import {
  validatePlacement,
  type Conflit,
  type SeanceInput,
  type PlacementCandidat,
} from '@takt/conflict-engine';
import { SimulatePlacementDto, SimulatePlacementResponseDto } from './dto/simulate-placement.dto.js';

interface SeanceAvecDonnees {
  id: string;
  versionId: string;
  semestreId: string;
  enseignantId: string | null;
  salleId: string | null;
  jour: string | null;
  creneauDebutId: string | null;
  nbCreneaux: number;
  statut: string;
  tag: string | null;
  groupes: { groupeId: string }[];
}

function toSeanceInput(s: SeanceAvecDonnees): SeanceInput {
  return {
    id: s.id,
    enseignantId: s.enseignantId ?? '',
    salleId: s.salleId ?? '',
    groupes: s.groupes.map((g) => g.groupeId),
    nbCreneaux: s.nbCreneaux,
    tag: s.tag ?? '',
    moduleId: '',
    typeEnseignementId: '',
    statut: s.statut as 'PLACEE' | 'NON_PLACEE',
    versionId: s.versionId,
    volumePlace: 0,
    placeInitiale: s.salleId ? { salleId: s.salleId } : undefined,
  };
}

@Injectable()
export class SimulateSeanceService {
  private readonly logger = new Logger(SimulateSeanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
  ) {}

  async simulate(
    seanceId: string,
    dto: SimulatePlacementDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SimulatePlacementResponseDto> {
    const start = Date.now();

    // 1. Récupérer la séance avec le scope métier (même logique que findSeanceById)
    const role = currentUser.role as RoleCode;
    const isDirection = role === RoleCode.DIRECTION;
    const userDepartments = currentUser.departments;
    const isScopedRole =
      role === RoleCode.RESPONSABLE_DEPARTEMENT &&
      userDepartments &&
      userDepartments.length > 0;

    const where: Record<string, unknown> = { id: seanceId };
    if (isScopedRole) {
      where.seanceGroupes = {
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

    // Direction : uniquement versions PUBLIE / ARCHIVE (lecture seule)
    if (isDirection) {
      const version = await this.prisma.versionEdt.findUnique({
        where: { id: seance.versionId },
        select: { statut: true },
      });
      if (!version || !['PUBLIE', 'ARCHIVE'].includes(version.statut)) {
        throw new NotFoundException(`Séance "${seanceId}" introuvable`);
      }
    }

    // 2. Construire le ConflictContext de la version (lecture seule, via ConflitService)
    const ctx = await this.conflitService.getConflictContext(seance.versionId);

    // 3. Construire le SeanceInput et le candidat de placement
    const seanceInput = toSeanceInput(seance as unknown as SeanceAvecDonnees);
    const candidat: PlacementCandidat = {
      jour: dto.jour,
      creneauDebut: dto.creneauDebutId,
      salle: dto.salleId,
    };

    // 4. Valider le placement via le conflict-engine pur
    const conflits = validatePlacement(seanceInput, candidat, ctx);

    // 5. Classer les conflits par sévérité
    const conflitsBloquants = conflits.filter((c) => c.severite === 'BLOQUANT');
    const conflitsAvertissements = conflits.filter(
      (c) => c.severite === 'AVERTISSEMENT',
    );

    // 6. Impacts (groupes, enseignant, salle, verrous impactés)
    const verrousIds = [
      ...new Set(
        conflits
          .filter((c) => c.type === 'VERROU')
          .flatMap((c) => c.seanceIds),
      ),
    ];
    const impacts = {
      groupes: [...new Set(seanceInput.groupes)],
      enseignant: seanceInput.enseignantId,
      salle: seanceInput.salleId,
      verrous: verrousIds,
    };

    return {
      conflits: conflits.map(toConflitDto),
      conflitsBloquants: conflitsBloquants.map(toConflitDto),
      conflitsAvertissements: conflitsAvertissements.map(toConflitDto),
      placementValide: conflitsBloquants.length === 0,
      impacts,
      dureeMs: Date.now() - start,
    };
  }
}

function toConflitDto(c: Conflit) {
  return {
    regleCode: c.regleCode,
    type: c.type,
    severite: c.severite,
    message: c.message,
    signature: c.signature,
  };
}
