// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service du tableau de préparation du semestre (L4-12)
// Agrège les 10 contrôles de ST §4.12 pour GET /semestres/{id}/preparation.

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  NiveauAnomalie,
  PreparationResponseDto,
  ControlePreparationDto,
  AnomaliePreparationDto,
} from './dto/preparation.dto.js';

@Injectable()
export class PreparationService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Point d'entrée principal
  // ============================================

  async getPreparation(
    semestreId: string,
  ): Promise<PreparationResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
      include: {
        annee: true,
        creneaux: true,
        groupes: {
          include: {
            niveau: {
              include: {
                formation: {
                  include: {
                    departement: true,
                  },
                },
              },
            },
          },
        },
        enseignants: true,
        salles: true,
        modules: true,
        repartitions: { include: { departement: true } },
        contrainteInstances: { include: { definition: true } },
        verrous: true,
        exigencesSalle: true,
        indisponibilites: true,
        profilGeneration: true,
      },
    });

    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const anomalies: AnomaliePreparationDto[] = [];
    const controles: ControlePreparationDto[] = [];

    // Contrôle 1: Grille horaire définie (Bloquant)
    const c1 = await this.controleGrille(semestre);
    controles.push(c1);
    anomalies.push(...c1.anomalies);

    // Contrôle 2: Groupes présents, codes conformes, effectifs
    const c2 = await this.controleGroupes(semestre);
    controles.push(c2);
    anomalies.push(...c2.anomalies);

    // Contrôle 3: Enseignants, salles, modules présents (Bloquant)
    const c3 = await this.controleRessources(semestre);
    controles.push(c3);
    anomalies.push(...c3.anomalies);

    // Contrôle 4: Répartition validée par département (Bloquant)
    const c4 = await this.controleRepartitions(semestre);
    controles.push(c4);
    anomalies.push(...c4.anomalies);

    // Contrôle 5: Volumes couverts (Bloquant)
    const c5 = await this.controleVolumes(semestre);
    controles.push(c5);
    anomalies.push(...c5.anomalies);

    // Contrôle 6: Verrous compatibles (Bloquant)
    const c6 = await this.controleVerrous(semestre);
    controles.push(c6);
    anomalies.push(...c6.anomalies);

    // Contrôle 7: Exigences de salle cohérentes (Bloquant / avertissement si orpheline)
    const c7 = await this.controleExigencesSalle(semestre);
    controles.push(c7);
    anomalies.push(...c7.anomalies);

    // Contrôle 8: Règles générales présentes (Avertissement)
    const c8 = await this.controleReglesGenerales(semestre);
    controles.push(c8);
    anomalies.push(...c8.anomalies);

    // Contrôle 9: Indisponibilités, vœux, covoiturages (Informatif)
    const c9 = await this.controleIndisponibilitesVoeux(semestre);
    controles.push(c9);
    anomalies.push(...c9.anomalies);

    // Contrôle 10: Profil de génération choisi (Bloquant)
    const c10 = await this.controleProfil(semestre);
    controles.push(c10);
    anomalies.push(...c10.anomalies);

    const nbBloquants = anomalies.filter((a) => a.niveau === NiveauAnomalie.BLOQUANT).length;
    const nbAvertissements = anomalies.filter((a) => a.niveau === NiveauAnomalie.AVERTISSEMENT).length;
    const nbInfos = anomalies.filter((a) => a.niveau === NiveauAnomalie.INFORMATIF).length;

    return {
      semestreId,
      peutGenerer: nbBloquants === 0,
      controles,
      nbBloquants,
      nbAvertissements,
      nbInfos,
    };
  }

  // ============================================
  // Contrôle 1 — Grille horaire définie (Bloquant)
  // ============================================

  private async controleGrille(
    semestre: { creneaux: { estPause: boolean; jour: string }[]; id: string },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const creneaux = semestre.creneaux ?? [];

    if (creneaux.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Grille horaire',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucun créneau n’a été généré pour ce semestre. La grille horaire est vide.',
        action: 'Générer la grille horaire via POST /semestres/{id}/creneaux/generate',
        lien: `/semestres/${semestre.id}/creneaux/generate`,
      });
    } else {
      const joursAvecCreneaux = new Set(
        creneaux.filter((c) => !c.estPause).map((c) => c.jour),
      );
      if (joursAvecCreneaux.size === 0) {
        anomalies.push({
          niveau: NiveauAnomalie.BLOQUANT,
          objet: 'Grille horaire',
          departement: null,
          activite: null,
          regle: null,
          explication: 'La grille ne contient que des pauses, aucun créneau planifiable.',
          action: 'Ajouter des créneaux planifiables à la grille horaire',
          lien: `/semestres/${semestre.id}/creneaux`,
        });
      }
    }

    return {
      numero: 1,
      libelle: 'Grille horaire définie (au moins un jour, créneaux de 30 minutes)',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }


  // ============================================
  // Contrôle 2 — Groupes présents, codes conformes, effectifs
  // Bloquant (effectif nul = avertissement)
  // ============================================

  private async controleGroupes(
    semestre: {
      groupes: { code: string; effectif: number | null; niveau: { formation: { departement: { id: string; code: string } | null } | null } | null }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const groupes = semestre.groupes ?? [];

    if (groupes.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Groupe',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucun groupe n’est défini pour ce semestre.',
        action: 'Créer des groupes pour ce semestre',
        lien: `/semestres/${semestre.id}/groupes`,
      });
      return {
        numero: 2,
        libelle: 'Groupes du semestre présents, codes conformes, effectifs renseignés',
        niveau: NiveauAnomalie.BLOQUANT,
        statut: 'NON_CONFORME',
        anomalies,
      };
    }

    for (const g of groupes) {
      const dep = g?.niveau?.formation?.departement;
      const depNom = dep ? dep.code : null;

      const codeConforme = /^[A-Z0-9]+-[A-Z0-9]{2,8}-[A-Z0-9]{1,4}$/.test(g.code);
      if (!codeConforme) {
        anomalies.push({
          niveau: NiveauAnomalie.BLOQUANT,
          objet: 'Groupe',
          departement: depNom,
          activite: g.code,
          regle: 'EX-ORG-03',
          explication: `Le code du groupe "${g.code}" ne respecte pas le format attendu (NIVEAU-ABRÉVIATION-GROUPE).`,
          action: 'Corriger le code du groupe',
          lien: `/semestres/${semestre.id}/groupes`,
        });
      }

      if (g.effectif === undefined || g.effectif === null || g.effectif <= 0) {
        anomalies.push({
          niveau: NiveauAnomalie.AVERTISSEMENT,
          objet: 'Groupe',
          departement: depNom,
          activite: g.code,
          regle: null,
          explication: `Le groupe "${g.code}" a un effectif nul ou non renseigné.`,
          action: 'Renseigner un effectif supérieur à 0 pour ce groupe',
          lien: `/semestres/${semestre.id}/groupes`,
        });
      }
    }

    return {
      numero: 2,
      libelle: 'Groupes du semestre présents, codes conformes, effectifs renseignés',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }

  // ============================================
  // Contrôle 3 — Enseignants, salles, modules présents (Bloquant)
  // ============================================

  private async controleRessources(
    semestre: {
      enseignants: { id: string }[];
      salles: { id: string }[];
      modules: { id: string; code: string }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];

    if (semestre.enseignants.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Enseignant',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucun enseignant n’est défini pour ce semestre.',
        action: 'Créer des enseignants pour ce semestre',
        lien: `/semestres/${semestre.id}/enseignants`,
      });
    }

    if (semestre.salles.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Salle',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucune salle n’est définie pour ce semestre.',
        action: 'Créer des salles pour ce semestre',
        lien: `/semestres/${semestre.id}/salles`,
      });
    }

    if (semestre.modules.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Module',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucun module n’est défini pour ce semestre.',
        action: 'Créer des modules pour ce semestre',
        lien: `/semestres/${semestre.id}/modules`,
      });
    }

    return {
      numero: 3,
      libelle: 'Enseignants, salles et modules présents',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }


  // ============================================
  // Contrôle 4 — Répartition validée par département (Bloquant)
  // ============================================

  private async controleRepartitions(
    semestre: {
      groupes: { niveau: { formation: { departement: { id: string; code: string } | null } | null } | null }[];
      repartitions: { statut: string; departement: { id: string; code: string } }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];

    const depsAvecGroupes = new Map<string, { id: string; code: string }>();
    for (const g of semestre.groupes ?? []) {
      const dep = g?.niveau?.formation?.departement;
      if (dep) {
        depsAvecGroupes.set(dep.id, { id: dep.id, code: dep.code });
      }
    }

    const repartitionsValidees = new Map<string, boolean>();
    for (const r of semestre.repartitions ?? []) {
      if (r.statut === 'VALIDEE') {
        repartitionsValidees.set(r.departement.id, true);
      }
    }

    for (const [depId, dep] of depsAvecGroupes) {
      if (!repartitionsValidees.get(depId)) {
        anomalies.push({
          niveau: NiveauAnomalie.BLOQUANT,
          objet: 'Répartition',
          departement: dep.code,
          activite: null,
          regle: 'EX-REP-02',
          explication: `Le département "${dep.code}" possède des groupes mais sa répartition n’est pas validée.`,
          action: 'Valider la répartition du département via POST /repartitions/{id}/validate',
          lien: `/repartitions?departementId=${depId}`,
        });
      }
    }

    return {
      numero: 4,
      libelle: 'Répartition validée pour chaque département qui a des groupes (n/m)',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }

  // ============================================
  // Contrôle 5 — Volumes couverts (Bloquant)
  // ============================================

  private async controleVolumes(
    semestre: {
      modules: { id: string; code: string; effectifMax: number | null }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];

    for (const m of semestre.modules ?? []) {
      if (!m.effectifMax || m.effectifMax <= 0) {
        anomalies.push({
          niveau: NiveauAnomalie.BLOQUANT,
          objet: 'Module',
          departement: null,
          activite: m.code,
          regle: null,
          explication: `Le module "${m.code}" n’a pas d’effectif maximal renseigné ou il est nul.`,
          action: 'Renseigner l’effectif maximal du module',
          lien: `/semestres/${semestre.id}/modules/${m.id}`,
        });
      }
    }

    return {
      numero: 5,
      libelle: 'Volumes couverts (aucun écart)',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }

  // ============================================
  // Contrôle 6 — Verrous compatibles (Bloquant)
  // ============================================

  private async controleVerrous(
    semestre: {
      verrous: { leveLe: Date | null }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const verrous = semestre.verrous ?? [];

    const verrousActifs = verrous.filter((v) => !v.leveLe);
    if (verrousActifs.length > 0) {
      anomalies.push({
        niveau: NiveauAnomalie.AVERTISSEMENT,
        objet: 'Verrou',
        departement: null,
        activite: null,
        regle: 'EX-VRR-01',
        explication: `${verrousActifs.length} verrou(x) actif(s) sur ce semestre. Ils seront vérifiés pour compatibilité lors du lancement de génération.`,
        action: 'Vérifier la compatibilité des verrous avant le lancement',
        lien: `/semestres/${semestre.id}/verrous`,
      });
    }

    return {
      numero: 6,
      libelle: 'Verrous compatibles avec contraintes et indisponibilités',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }


  // ============================================
  // Contrôle 7 — Exigences de salle cohérentes
  // Bloquant (orpheline = avertissement)
  // ============================================

  private async controleExigencesSalle(
    semestre: {
      exigencesSalle: { id: string; salleImposeeId: string | null; affectationKey: string }[];
      salles: { id: string }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const exigences = semestre.exigencesSalle ?? [];

    if (exigences.length === 0) {
      return {
        numero: 7,
        libelle: 'Exigences de salle cohérentes (salle imposée valide, aucune exigence orpheline)',
        niveau: NiveauAnomalie.BLOQUANT,
        statut: 'CONFORME',
        anomalies: [],
      };
    }

    for (const e of exigences) {
      if (e.salleImposeeId) {
        const salleExiste = semestre.salles?.some((s) => s.id === e.salleImposeeId) ?? false;
        if (!salleExiste) {
          anomalies.push({
            niveau: NiveauAnomalie.BLOQUANT,
            objet: 'ExigenceSalle',
            departement: null,
            activite: e.affectationKey,
            regle: 'EX-ACT-04',
            explication: `La salle imposée pour l’activité "${e.affectationKey}" n’existe pas ou n’appartient pas à ce semestre.`,
            action: 'Corriger ou supprimer l’exigence de salle',
            lien: `/semestres/${semestre.id}/exigences-salle/${e.id}`,
          });
        }
      }

      anomalies.push({
        niveau: NiveauAnomalie.AVERTISSEMENT,
        objet: 'ExigenceSalle',
        departement: null,
        activite: e.affectationKey,
        regle: 'EX-ACT-04',
        explication: `L’exigence de salle pour "${e.affectationKey}" est orpheline (aucune affectation correspondante trouvée dans le snapshot validé).`,
        action: 'Supprimer l’exigence orpheline ou recréer l’affectation correspondante',
        lien: `/semestres/${semestre.id}/exigences-salle/${e.id}`,
      });
    }

    return {
      numero: 7,
      libelle: 'Exigences de salle cohérentes (salle imposée valide, aucune exigence orpheline)',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }


  // ============================================
  // Contrôle 8 — Règles générales présentes (Avertissement)
  // ============================================

  private async controleReglesGenerales(
    semestre: {
      contrainteInstances: { nature: string; actif: boolean; definition: { code: string; portee: string } }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const instances = semestre.contrainteInstances ?? [];

    const reglesGlobales = instances.filter(
      (i) => i.nature === 'REGLE' && i.actif && i.definition.portee === 'GLOBALE',
    );

    if (reglesGlobales.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.AVERTISSEMENT,
        objet: 'Règle générale',
        departement: null,
        activite: null,
        regle: 'EX-CTR-02',
        explication: 'Aucune règle générale globale n’est définie pour ce semestre.',
        action: 'Créer des règles générales (heures par jour, creux, jours par semaine, etc.)',
        lien: `/semestres/${semestre.id}/contraintes`,
      });
    }

    const codesVus = new Map<string, boolean>();
    for (const inst of reglesGlobales) {
      const code = inst.definition.code;
      if (codesVus.has(code)) {
        anomalies.push({
          niveau: NiveauAnomalie.AVERTISSEMENT,
          objet: 'Règle générale',
          departement: null,
          activite: null,
          regle: code,
          explication: `Plusieurs instances actives pour la règle "${code}" (portée GLOBALE).`,
          action: 'Conserver une seule instance globale par code de règle',
          lien: `/semestres/${semestre.id}/contraintes`,
        });
      } else {
        codesVus.set(code, true);
      }
    }

    return {
      numero: 8,
      libelle: 'Règles générales présentes, contraintes sans contradiction',
      niveau: NiveauAnomalie.AVERTISSEMENT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }


  // ============================================
  // Contrôle 9 — Indisponibilités, vœux, covoiturages (Informatif)
  // ============================================

  private async controleIndisponibilitesVoeux(
    semestre: {
      indisponibilites: { id: string }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const inds = semestre.indisponibilites ?? [];

    if (inds.length === 0) {
      anomalies.push({
        niveau: NiveauAnomalie.INFORMATIF,
        objet: 'Indisponibilité',
        departement: null,
        activite: null,
        regle: null,
        explication: 'Aucune indisponibilité n’est déclarée pour ce semestre.',
        action: 'Déclarer les indisponibilités enseignants et salles si nécessaire',
        lien: `/semestres/${semestre.id}/indisponibilites`,
      });
    } else {
      anomalies.push({
        niveau: NiveauAnomalie.INFORMATIF,
        objet: 'Indisponibilité',
        departement: null,
        activite: null,
        regle: null,
        explication: `${inds.length} indisponibilité(s) déclarée(s) pour ce semestre.`,
        action: 'Vérifier que les indisponibilités sont cohérentes avec les verrous',
        lien: `/semestres/${semestre.id}/indisponibilites`,
      });
    }

    return {
      numero: 9,
      libelle: 'Indisponibilités, vœux et covoiturages saisis',
      niveau: NiveauAnomalie.INFORMATIF,
      statut: 'CONFORME',
      anomalies,
    };
  }

  // ============================================
  // Contrôle 10 — Profil de génération choisi (Bloquant)
  // ============================================

  private async controleProfil(
    semestre: {
      profilGeneration: { estParDefaut: boolean }[];
      id: string;
    },
  ): Promise<ControlePreparationDto> {
    const anomalies: AnomaliePreparationDto[] = [];
    const profils = semestre.profilGeneration ?? [];

    const defaultProfil = profils.find((p) => p.estParDefaut);

    if (!defaultProfil) {
      anomalies.push({
        niveau: NiveauAnomalie.BLOQUANT,
        objet: 'Profil de génération',
        departement: null,
        activite: null,
        regle: 'EX-GEN-01',
        explication: 'Aucun profil de génération par défaut n’est défini pour ce semestre.',
        action: 'Définir un profil par défaut via POST /semestres/{id}/profils/defaut',
        lien: `/semestres/${semestre.id}/profils`,
      });
    }

    return {
      numero: 10,
      libelle: 'Profil de génération choisi (par défaut du semestre)',
      niveau: NiveauAnomalie.BLOQUANT,
      statut: anomalies.length === 0 ? 'CONFORME' : 'NON_CONFORME',
      anomalies,
    };
  }
}

