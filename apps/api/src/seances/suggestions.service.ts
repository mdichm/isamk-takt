// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de suggestions de résolution (L3-25)
// Lecture seule : aucune écriture en base. Dépend de ce_recompute et evals.
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { RoleCode, JourSemaine } from '@takt/db';
import {
  validatePlacement,
  computeSoftDelta,
  type Conflit,
  type SeanceInput,
  type PlacementCandidat,
  type ConflictContext,
} from '@takt/conflict-engine';
import {
  SuggestionsQueryDto,
  SuggestionsResponseDto,
  SuggestionDto,
  SuggestionConflitDto,
} from './dto/suggestions.dto.js';

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
  seanceGroupes: { groupeId: string }[];
}

function toSeanceInput(s: SeanceAvecDonnees): SeanceInput {
  return {
    id: s.id,
    enseignantId: s.enseignantId ?? '',
    salleId: s.salleId ?? '',
    groupes: s.seanceGroupes.map((g) => g.groupeId),
    nbCreneaux: s.nbCreneaux,
    tag: s.tag ?? '',
    moduleId: '',
    typeEnseignementId: '',
    statut: s.statut as 'PLACEE' | 'NON_PLACEE',
    versionId: s.versionId,
    placeInitiale: s.salleId ? { salleId: s.salleId } : undefined,
  };
}

function toConflitDto(c: Conflit): SuggestionConflitDto {
  return {
    regleCode: c.regleCode,
    type: c.type,
    severite: c.severite,
    message: c.message,
    signature: c.signature,
  };
}

function creneauKey(
  ctx: ConflictContext,
  creneauId: string,
): { jour: string; ordre: number } | undefined {
  for (const [id, c] of ctx.creneaux) {
    if (id === creneauId) {
      return { jour: c.jour, ordre: c.ordre };
    }
  }
  return undefined;
}

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conflitService: ConflitService,
  ) {}

  async suggestions(
    seanceId: string,
    dto: SuggestionsQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SuggestionsResponseDto> {
    const start = Date.now();

    // 1. Récupérer la séance avec le scope métier
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

    // 2. Construire le ConflictContext de la version (lecture seule)
    const ctx = await this.conflitService.getConflictContext(seance.versionId);

    // 3. SeanceInput et placement actuel
    const seanceInput = toSeanceInput(seance as unknown as SeanceAvecDonnees);
    const placementActuel: PlacementCandidat = {
      jour: seance.jour ?? '',
      creneauDebut: seance.creneauDebutId ?? '',
      salle: seance.salleId ?? '',
    };

    // Conflits actuels de la séance
    const conflitsActuels = validatePlacement(seanceInput, placementActuel, ctx);

    // 4. Générer les candidats : grille × salles actives
    const creneauxDisponibles = Array.from(ctx.creneaux.entries()).filter(
      ([, c]) => !c.estPause,
    );
    const sallesDisponibles = Array.from(ctx.salles.values());

    const candidates: Array<{ placement: PlacementCandidat }> = [];

    for (const [creneauId, creneau] of creneauxDisponibles) {
      const slots = ctx.grille.consecutifs(
        creneau.jour,
        creneauId,
        seanceInput.nbCreneaux,
      );
      if (!slots || slots.length === 0) continue;

      for (const salle of sallesDisponibles) {
        const placement: PlacementCandidat = {
          jour: creneau.jour,
          creneauDebut: creneauId,
          salle: salle.id,
        };

        // Ignorer la position actuelle
        if (
          placement.jour === placementActuel.jour &&
          placement.creneauDebut === placementActuel.creneauDebut &&
          placement.salle === placementActuel.salle
        ) {
          continue;
        }

        candidates.push({ placement });
      }
    }

    // 5. Valider, filtrer les bloquants, calculer le score
    const suggestions: SuggestionDto[] = [];

    for (const { placement } of candidates) {
      const conflits = validatePlacement(seanceInput, placement, ctx);
      const conflitsBloquants = conflits.filter(
        (c) => c.severite === 'BLOQUANT',
      );

      // Rejeter si conflit bloquant
      if (conflitsBloquants.length > 0) continue;

      // Conflits résolus = conflits actuels qui disparaissent
      const conflitsResolus = conflitsActuels.filter(
        (c) => !conflits.some((nc) => nc.signature === c.signature),
      ).length;

      // Delta de score souple
      const delta = computeSoftDelta(
        ctx,
        seanceInput,
        placementActuel,
        placement,
        {},
      );
      const deltaScoreSouple = Number.isNaN(delta.delta) ? 0 : delta.delta;

      // Distance en minutes
      const actuelCreneau = creneauKey(ctx, placementActuel.creneauDebut);
      const cibleCreneau = creneauKey(ctx, placement.creneauDebut);
      let distanceMinutes = 0;
      if (
        actuelCreneau &&
        cibleCreneau &&
        actuelCreneau.jour === cibleCreneau.jour
      ) {
        distanceMinutes =
          Math.abs(cibleCreneau.ordre - actuelCreneau.ordre) * 30;
      } else if (actuelCreneau && cibleCreneau) {
        distanceMinutes = 1440; // jours différents
      }

      const salleConservee = placement.salle === placementActuel.salle;
      const estAlternativeEnseignant =
        Boolean(dto.enseignantId) &&
        seanceInput.enseignantId !== dto.enseignantId;

      suggestions.push({
        jour: placement.jour as JourSemaine,
        creneauDebutId: placement.creneauDebut,
        salleId: placement.salle,
        conflitsResolus,
        deltaScoreSouple,
        distanceMinutes,
        salleConservee,
        conflitsResiduels: conflits
          .filter((c: Conflit) => c.severite !== 'BLOQUANT')
          .map(toConflitDto),
        estAlternativeEnseignant,
      });
    }

    // 6. Tri : conflits résolus desc, delta score souple desc, distance asc,
    //    salle conservée desc, puis départage déterministe (jour, creneau, salle)
    suggestions.sort((a, b) => {
      if (b.conflitsResolus !== a.conflitsResolus)
        return b.conflitsResolus - a.conflitsResolus;
      if (b.deltaScoreSouple !== a.deltaScoreSouple)
        return b.deltaScoreSouple - a.deltaScoreSouple;
      if (a.distanceMinutes !== b.distanceMinutes)
        return a.distanceMinutes - b.distanceMinutes;
      if (b.salleConservee !== a.salleConservee)
        return (b.salleConservee ? 1 : -1) - (a.salleConservee ? 1 : -1);
      if (a.jour !== b.jour) return a.jour.localeCompare(b.jour);
      if (a.creneauDebutId !== b.creneauDebutId)
        return a.creneauDebutId.localeCompare(b.creneauDebutId);
      return a.salleId.localeCompare(b.salleId);
    });

    // 7. Filtres optionnels du query
    let filtrees = suggestions;
    if (dto.jour) {
      filtrees = filtrees.filter((s) => s.jour === dto.jour);
    }
    if (dto.creneauDebutId) {
      filtrees = filtrees.filter(
        (s) => s.creneauDebutId === dto.creneauDebutId,
      );
    }
    if (dto.salleId) {
      filtrees = filtrees.filter((s) => s.salleId === dto.salleId);
    }

    // 8. Limite à 20
    const limit = Math.min(dto.limit ?? 20, 20);
    const result = filtrees.slice(0, limit);

    return {
      suggestions: result,
      total: result.length,
      dureeMs: Date.now() - start,
    };
  }
}