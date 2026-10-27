// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service du tableau de bord (L5-26)
// Agrège les indicateurs des 4 voies selon le rôle (ST §4.17, §3.4.20)

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { VersionService } from '../versions/version.service.js';
import { ChargesService } from '../charges/charges.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  RoleCode,
  DecisionDepartement,
} from '@takt/db';
import type { VersionStatut, GenerationStatut } from '@takt/db';
import {
  TableauDeBordQueryDto,
  TableauDeBordResponseDto,
  ActionPrioritaireDto,
  ContexteDto,
  RepartitionDto,
  PreparationResumeDto,
  VersionEnPreparationDto,
  GenerationsResumeDto,
  GenerationResumeDto,
  VersionPublieeDto,
  ChangementsDto,
  ResponsableViewDto,
  ChargeEnseignantAlerteDto,
  DirectionViewDto,
} from './dto/index.js';

const MAX_ACTIONS_DEFAULT = 5;

const ACTION_CODES = [
  'GENERATION_ECHEC',
  'PLANNING_REJETE',
  'CONFLITS_BLOQUANTS',
  'SEANCES_NON_PLACEES',
  'REPARTITIONS_BLOQUANTES',
  'PRET_A_GENERER',
  'PRET_A_SOUMETTRE',
  'VALIDEE_ATTENTE_PUBLICATION',
] as const;

type ActionCode = (typeof ACTION_CODES)[number];

@Injectable()
export class TableauDeBordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preparation: PreparationService,
    private readonly versions: VersionService,
    private readonly charges: ChargesService,
    private readonly notifications: NotificationsService,
  ) {}

  async getTableauDeBord(
    query: TableauDeBordQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
    actionsAll = false,
  ): Promise<TableauDeBordResponseDto> {
    const semestre = await this.resoudreSemestre(query.semestreId);
    const role = currentUser.role as RoleCode;

    const response: TableauDeBordResponseDto = {
      role,
      contexte: {
        annee: semestre.annee.code,
        semestre: String(semestre.numero),
      },
    };

    switch (role) {
      case RoleCode.GESTIONNAIRE:
      case RoleCode.ADMINISTRATEUR:
        return this.construireVueGestionnaire(
          response,
          semestre,
          currentUser,
          actionsAll,
        );
      case RoleCode.RESPONSABLE_DEPARTEMENT:
        return this.construireVueResponsable(response, semestre, currentUser);
      case RoleCode.DIRECTION:
        return this.construireVueDirection(response, semestre);
      default:
        return this.construireVueGestionnaire(
          response,
          semestre,
          currentUser,
          actionsAll,
        );
    }
  }

  private async resoudreSemestre(
    semestreId?: string,
  ): Promise<{
    id: string;
    numero: number;
    annee: { code: string; numero: number };
  }> {
    if (semestreId) {
      const s = await this.prisma.semestre.findUnique({
        where: { id: semestreId },
        include: { annee: true },
      });
      if (!s) {
        throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
      }
      return { id: s.id, numero: s.numero, annee: s.annee };
    }

    const annee = await this.prisma.annee.findFirst({
      where: { statut: 'ACTIVE' },
      include: { semestres: { orderBy: { numero: 'asc' }, take: 1 } },
    });
    if (!annee?.semestres?.[0]) {
      throw new NotFoundException('Aucun semestre actif trouvé');
    }
    const s = annee.semestres[0];
    return { id: s.id, numero: s.numero, annee: { code: annee.code, numero: annee.numero } };
  }

  private async construireVueGestionnaire(
    response: TableauDeBordResponseDto,
    semestre: { id: string; numero: number; annee: { code: string; numero: number } },
    currentUser: { id: string; role: string; departments?: string[] },
    actionsAll: boolean,
  ): Promise<TableauDeBordResponseDto> {
    const { id: semestreId } = semestre;

    const repartitions = await this.prisma.repartition.findMany({
      where: { semestreId },
      include: { departement: { select: { code: true } } },
      orderBy: { departement: { code: 'asc' } },
    });
    response.repartitions = repartitions.map((r) => ({
      departementCode: r.departement.code,
      statut: r.statut,
      avancement: r.statut === 'VALIDEE' ? '1/1' : '0/1',
    }));

    const versions = await this.prisma.versionEdt.findMany({
      where: { semestreId },
      select: { id: true },
    });
    const versionIds = versions.map((v) => v.id);
    const validationsEnAttente =
      versionIds.length > 0
        ? await this.prisma.validationDepartement.findMany({
            where: {
              versionId: { in: versionIds },
              decision: DecisionDepartement.EN_ATTENTE,
            },
            select: { departement: { select: { code: true } }, version: { select: { numero: true } } },
          })
        : [];
    response.validationsEnAttente = validationsEnAttente.map(
      (v) => `Validation ${v.departement.code} pour version ${v.version.numero}`,
    );

    const preparation = await this.preparation.getPreparation(semestreId);
    const nbBloquants = preparation.nbBloquants ?? 0;
    const nbAvertissements = preparation.nbAvertissements ?? 0;
    response.preparation = {
      bloquants: nbBloquants,
      avertissements: nbAvertissements,
      principaux: preparation.controles
        .filter((c) => c.statut === 'NON_CONFORME')
        .flatMap((c) =>
          c.anomalies
            .filter((a) => a.niveau === 'BLOQUANT')
            .map((a) => `${c.numero} - ${a.explication}`),
        )
        .slice(0, 5),
    };

    const versionEnPreparation = await this.prisma.versionEdt.findFirst({
      where: { semestreId, statut: 'EDITION' as VersionStatut },
      orderBy: { updatedAt: 'desc' },
    });
    if (versionEnPreparation) {
      const [conflitsBloquants, nonPlacees, avertissementsNonAcceptes] =
        await Promise.all([
          this.prisma.conflit.count({
            where: {
              versionId: versionEnPreparation.id,
              severite: 'BLOQUANT',
              resoluLe: null,
            },
          }),
          this.prisma.seance.count({
            where: {
              versionId: versionEnPreparation.id,
              statut: 'NON_PLACEE',
            },
          }),
          this.prisma.avertissementAccepte.count({
            where: {
              versionId: versionEnPreparation.id,
              caduqueLe: null,
            },
          }),
        ]);
      response.versionEnPreparation = {
        id: versionEnPreparation.id,
        statut: versionEnPreparation.statut,
        conflitsBloquants,
        nonPlacees,
        avertissementsNonAcceptes,
      };
    } else {
      response.versionEnPreparation = {
        id: '',
        statut: 'BROUILLON' as VersionStatut,
        conflitsBloquants: 0,
        nonPlacees: 0,
        avertissementsNonAcceptes: 0,
      };
    }

    const generations = await this.prisma.generation.findMany({
      where: { semestreId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, statut: true, createdAt: true },
    });
    const enCours = generations
      .filter((g) => g.statut === 'QUEUED' || g.statut === 'RUNNING')
      .map((g) => ({
        id: g.id,
        statut: g.statut as GenerationStatut,
        creeLe: g.createdAt.toISOString(),
      }));
    const recentes = generations
      .filter((g) => g.statut !== 'QUEUED' && g.statut !== 'RUNNING')
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        statut: g.statut as GenerationStatut,
        creeLe: g.createdAt.toISOString(),
      }));
    response.generations = { enCours, recentes };

    const versionPubliee = await this.prisma.versionEdt.findFirst({
      where: { semestreId, statut: 'PUBLIE' as VersionStatut },
      orderBy: { updatedAt: 'desc' },
    });
    if (versionPubliee) {
      try {
        const provenance = await this.versions.getProvenance(versionPubliee.id);
        response.versionPubliee = {
          numero: versionPubliee.numero,
          publieLe: versionPubliee.updatedAt.toISOString(),
          provenance: {
            generationId: provenance.generation?.id ?? null,
            profil: provenance.generation?.profil
              ? {
                  code: provenance.generation.profil.code ?? undefined,
                  numero: provenance.generation.profil.numero ?? undefined,
                  libelle: provenance.generation.profil.libelle ?? undefined,
                }
              : null,
            chargeRuleSet: provenance.chargeRuleSet
              ? {
                  code: provenance.chargeRuleSet.code,
                  libelle: provenance.chargeRuleSet.libelle,
                }
              : null,
            fet: provenance.generation?.engineVersion ?? undefined,
            engineVersion: provenance.generation?.engineVersion ?? undefined,
          },
        };
      } catch {
        response.versionPubliee = {
          numero: versionPubliee.numero,
          publieLe: versionPubliee.updatedAt.toISOString(),
          provenance: null,
        };
      }
    }

    const derniereVersion = await this.prisma.versionEdt.findFirst({
      where: { semestreId },
      orderBy: { createdAt: 'desc' },
    });
    if (derniereVersion) {
      try {
        const impact = await this.versions.getImpact(derniereVersion.id);
        response.changements = {
          seancesModifiees:
            impact.resume.impactes +
            impact.resume.nonImpactes +
            impact.resume.reportees,
          departementsImpactes: impact.departements
            .filter((d) => d.statut === 'IMPACTE')
            .map((d) => d.departementCode),
        };
      } catch {
        response.changements = { seancesModifiees: 0, departementsImpactes: [] };
      }
    } else {
      response.changements = { seancesModifiees: 0, departementsImpactes: [] };
    }

    response.actionsPrioritaires = await this.evaluerActionsPrioritaires(
      semestreId,
      response.versionEnPreparation!,
      response.versionPubliee
        ? { id: versionPubliee!.id, numero: versionPubliee!.numero }
        : null,
      { peutGenerer: preparation.peutGenerer, nbBloquants: nbBloquants, nbAvertissements: nbAvertissements },
      currentUser.id,
      actionsAll,
    );

    return response;
  }

  private async construireVueResponsable(
    response: TableauDeBordResponseDto,
    semestre: { id: string; numero: number; annee: { code: string; numero: number } },
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<TableauDeBordResponseDto> {
    const departements = currentUser.departments ?? [];
    const { id: semestreId } = semestre;

    const repartitions = await this.prisma.repartition.findMany({
      where: {
        semestreId,
        departement: { code: { in: departements } },
      },
      include: { departement: { select: { code: true } } },
      orderBy: { departement: { code: 'asc' } },
    });
    const responsable: ResponsableViewDto = {
      repartitions: repartitions.map((r) => ({
        departementCode: r.departement.code,
        statut: r.statut,
        avancement: r.statut === 'VALIDEE' ? '1/1' : '0/1',
      })),
      charges: [],
      validations: [],
      demandes: [],
    };

    try {
      const chargesResult = await this.charges.findAllCharges(
        { page: 1, limit: 100, dimension: 'departement' },
        currentUser,
      );
      responsable.charges = chargesResult.data.map((c) => ({
        enseignantId: c.id,
        nom: c.libelle,
        charge: String(c.chargePonderee ?? 0),
        seuil: String(c.volumeBrut ?? 0),
        depassement: String(c.chargePonderee > (c.volumeBrut ?? 0) ? 'true' : 'false'),
      }));
    } catch {
      responsable.charges = [];
    }

    const versions = await this.prisma.versionEdt.findMany({
      where: { semestreId },
      select: { id: true },
    });
    const versionIds = versions.map((v) => v.id);
    if (versionIds.length > 0 && departements.length > 0) {
      const validations = await this.prisma.validationDepartement.findMany({
        where: {
          versionId: { in: versionIds },
          decision: DecisionDepartement.EN_ATTENTE,
          departementId: { in: departements },
        },
        select: { departement: { select: { code: true } }, version: { select: { numero: true } } },
      });
      responsable.validations = validations.map(
        (v) => `Validation ${v.departement.code} pour version ${v.version.numero}`,
      );
    }

    if (departements.length > 0) {
      const demandes = await this.prisma.demandeModification.findMany({
        where: {
          semestreId,
          departementCode: { in: departements },
          statut: 'OUVERTE',
        },
        select: { id: true, type: true, motif: true },
        take: 10,
      });
      responsable.demandes = demandes.map((d) => `${d.type} - ${d.motif}`);
    }

    response.responsable = responsable;
    return response;
  }

  private async construireVueDirection(
    response: TableauDeBordResponseDto,
    semestre: { id: string; numero: number; annee: { code: string; numero: number } },
  ): Promise<TableauDeBordResponseDto> {
    const versionPubliee = await this.prisma.versionEdt.findFirst({
      where: { semestreId: semestre.id, statut: 'PUBLIE' as VersionStatut },
      orderBy: { updatedAt: 'desc' },
      select: { numero: true },
    });
    response.direction = {
      versionPubliee: versionPubliee?.numero ?? 'Aucune',
      exports: 'true',
    };
    return response;
  }

  private async evaluerActionsPrioritaires(
    semestreId: string,
    versionEnPreparation: {
      id: string;
      conflitsBloquants: number;
      nonPlacees: number;
      avertissementsNonAcceptes: number;
      statut: VersionStatut;
    },
    versionPubliee: { id: string; numero: string } | null,
    preparation: { peutGenerer: boolean; nbBloquants: number; nbAvertissements: number },
    currentUserId: string,
    actionsAll: boolean,
  ): Promise<ActionPrioritaireDto[]> {
    const actions: ActionPrioritaireDto[] = [];

    const generationEchec = await this.prisma.generation.findFirst({
      where: { semestreId, statut: 'FAILED' },
      orderBy: { finishedAt: 'desc' },
      select: { id: true, finishedAt: true },
    });
    if (generationEchec) {
      const notifNonLue = await this.prisma.notification.findFirst({
        where: {
          destinataireId: currentUserId,
          versionId: generationEchec.id,
          lu: false,
        },
      });
      if (notifNonLue) {
        actions.push({
          code: 'GENERATION_ECHEC',
          pourquoi: 'Une génération a échoué et n a pas encore été consultée',
          lien: `/generations/${generationEchec.id}`,
        });
      }
    }

    const allVersionIds = await this.prisma.versionEdt
      .findMany({ where: { semestreId }, select: { id: true } })
      .then((v) => v.map((x) => x.id));
    if (allVersionIds.length > 0) {
      const planningRejete = await this.prisma.validationDepartement.findFirst({
        where: {
          versionId: { in: allVersionIds },
          decision: 'REJETE',
        },
        select: { version: { select: { numero: true } }, departement: { select: { code: true } } },
      });
      if (planningRejete) {
        actions.push({
          code: 'PLANNING_REJETE',
          pourquoi: `Planning rejeté par le département ${planningRejete.departement.code} (version ${planningRejete.version.numero})`,
          lien: `/versions/${planningRejete.version.numero}/validations`,
        });
      }
    }

    if (versionEnPreparation.conflitsBloquants > 0) {
      actions.push({
        code: 'CONFLITS_BLOQUANTS',
        pourquoi: `${versionEnPreparation.conflitsBloquants} conflit(s) bloquant(s) dans la version de travail`,
        lien: `/versions/${versionEnPreparation.id}/conflits`,
      });
    }

    if (versionEnPreparation.nonPlacees > 0) {
      actions.push({
        code: 'SEANCES_NON_PLACEES',
        pourquoi: `${versionEnPreparation.nonPlacees} séance(s) non placée(s)`,
        lien: `/versions/${versionEnPreparation.id}/seances`,
      });
    }

    const repartitionsBloquantes = await this.prisma.repartition.findMany({
      where: { semestreId, statut: { not: 'VALIDEE' } },
      include: { departement: { select: { code: true } } },
      take: 1,
    });
    if (repartitionsBloquantes.length > 0) {
      actions.push({
        code: 'REPARTITIONS_BLOQUANTES',
        pourquoi: `Répartition non validée pour le département ${repartitionsBloquantes[0].departement.code}`,
        lien: `/repartitions?semestreId=${semestreId}`,
      });
    }

    if (preparation.peutGenerer && preparation.nbBloquants === 0) {
      actions.push({
        code: 'PRET_A_GENERER',
        pourquoi: 'Aucun blocage de préparation : le semestre est prêt à générer',
        lien: `/semestres/${semestreId}/generations`,
      });
    }

    if (
      versionEnPreparation.statut === 'EDITION' &&
      versionEnPreparation.conflitsBloquants === 0 &&
      versionEnPreparation.nonPlacees === 0
    ) {
      actions.push({
        code: 'PRET_A_SOUMETTRE',
        pourquoi: 'La version de travail est prête à être soumise à la validation',
        lien: `/versions/${versionEnPreparation.id}/submit`,
      });
    }

    if (versionPubliee) {
      const versionValidee = await this.prisma.versionEdt.findFirst({
        where: { semestreId, statut: 'VALIDE' as VersionStatut },
        orderBy: { updatedAt: 'desc' },
      });
      if (versionValidee) {
        actions.push({
          code: 'VALIDEE_ATTENTE_PUBLICATION',
          pourquoi: `La version ${versionValidee.numero} est validée et attend sa publication`,
          lien: `/versions/${versionValidee.id}/publish`,
        });
      }
    }

    const limite = actionsAll ? actions.length : MAX_ACTIONS_DEFAULT;
    return actions.slice(0, limite);
  }
}
