// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de génération XLSX pour les jobs d'export (L6-06)
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ExportFormat,
  ExportMode,
  GrilleAffichage,
  VersionStatut,
} from '@takt/db';

interface ExportJobData {
  exportJobId: string;
  mode: string;
  grille: string;
  avertissementIds: string[];
  numeroVersion: string;
  publieLe: string | null;
}

interface VersionWithRelations {
  id: string;
  numero: string;
  statut: VersionStatut;
  publieLe: Date | null;
  grilleFigée: GrilleAffichage | null;
  semestreId: string;
}

interface StyleWithConfig {
  id: string;
  code: string;
  libelle: string;
  config: Record<string, unknown>;
}

interface ViewWithConfig {
  id: string;
  code: string;
  libelle: string;
  vue: string;
  format: ExportFormat;
  config: Record<string, unknown>;
}

interface SeanceWithCreneau {
  id: string;
  jour: string | null;
  creneauDebutId: string | null;
  creneauDebut: {
    id: string;
    jour: string;
    ordre: number;
    heureDebut: Date;
    heureFin: Date;
    estPause: boolean;
  } | null;
  nbCreneaux: number;
  enseignantId: string | null;
  salleId: string | null;
  tag: string | null;
  groupes: Array<{ groupeId: string }>;
}

interface CreneauAffichageWithCreneau {
  id: string;
  creneauId: string;
  grille: GrilleAffichage;
  heureDebut: Date;
  heureFin: Date;
  creneau: {
    id: string;
    jour: string;
    ordre: number;
  };
}

export interface GenerateXlsxInput {
  job: ExportJobData;
  version: VersionWithRelations;
  style: StyleWithConfig;
  view: ViewWithConfig;
  seances: SeanceWithCreneau[];
  creneauxAffichage: CreneauAffichageWithCreneau[];
}

export interface GenerateXlsxResult {
  buffer: Buffer;
  filename: string;
}

const COLONNE_LARGEUR_PAR_DEFAUT = 20;
const LARGEUR_COLONNE_JOUR = 15;
const LARGEUR_COLONNE_HEURE = 12;

@Injectable()
export class ExportXlsxService {
  private readonly logger = new Logger(ExportXlsxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateXlsxForJob(
    exportJobId: string,
  ): Promise<GenerateXlsxResult> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
      include: {
        version: {
          select: {
            id: true,
            numero: true,
            statut: true,
            publieLe: true,
            grilleFigée: true,
            semestreId: true,
          },
        },
        style: {
          select: { id: true, code: true, libelle: true, config: true },
        },
        view: {
          select: {
            id: true,
            code: true,
            libelle: true,
            vue: true,
            format: true,
            config: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`ExportJob introuvable : ${exportJobId}`);
    }

    const version: VersionWithRelations = {
      id: job.version.id,
      numero: job.version.numero,
      statut: job.version.statut,
      publieLe: job.version.publieLe,
      grilleFigée: job.version.grilleFigée,
      semestreId: job.version.semestreId,
    };

    const style: StyleWithConfig = {
      id: job.style.id,
      code: job.style.code,
      libelle: job.style.libelle,
      config: (job.style.config ?? {}) as Record<string, unknown>,
    };

    const view: ViewWithConfig = {
      id: job.view.id,
      code: job.view.code,
      libelle: job.view.libelle,
      vue: job.view.vue,
      format: job.view.format,
      config: (job.view.config ?? {}) as Record<string, unknown>,
    };

    const seancesRaw = await this.prisma.seance.findMany({
      where: { versionId: job.versionId, statut: 'PLACEE' },
      include: {
        creneauDebut: {
          select: {
            id: true,
            jour: true,
            ordre: true,
            heureDebut: true,
            heureFin: true,
            estPause: true,
          },
        },
        groupes: { select: { groupeId: true } },
      },
      orderBy: [{ jour: 'asc' }, { creneauDebut: { ordre: 'asc' } }],
    });

    const seances: SeanceWithCreneau[] = seancesRaw.map((s) => ({
      id: s.id,
      jour: s.jour ?? null,
      creneauDebutId: s.creneauDebutId ?? null,
      creneauDebut: s.creneauDebut
        ? {
            id: s.creneauDebut.id,
            jour: s.creneauDebut.jour,
            ordre: s.creneauDebut.ordre,
            heureDebut: s.creneauDebut.heureDebut,
            heureFin: s.creneauDebut.heureFin,
            estPause: s.creneauDebut.estPause,
          }
        : null,
      nbCreneaux: s.nbCreneaux,
      enseignantId: s.enseignantId ?? null,
      salleId: s.salleId ?? null,
      tag: s.tag ?? null,
      groupes: s.groupes,
    }));

    let creneauxAffichage: CreneauAffichageWithCreneau[] = [];
    if (job.grille === GrilleAffichage.RAMADAN) {
      const affichagesRaw = await this.prisma.creneauAffichage.findMany({
        where: {
          creneau: { semestreId: version.semestreId },
          grille: GrilleAffichage.RAMADAN,
        },
        include: {
          creneau: {
            select: { id: true, jour: true, ordre: true },
          },
        },
      });

      creneauxAffichage = affichagesRaw.map((a) => ({
        id: a.id,
        creneauId: a.creneauId,
        grille: a.grille,
        heureDebut: a.heureDebut,
        heureFin: a.heureFin,
        creneau: {
          id: a.creneau.id,
          jour: a.creneau.jour,
          ordre: a.creneau.ordre,
        },
      }));
    }

    return this.generateXlsx({
      job: {
        exportJobId: job.id,
        mode: job.mode,
        grille: job.grille,
        avertissementIds: job.avertissementIds,
        numeroVersion: version.numero,
        publieLe: version.publieLe ? version.publieLe.toISOString() : null,
      },
      version,
      style,
      view,
      seances,
      creneauxAffichage,
    });
  }

  generateXlsx(input: GenerateXlsxInput): GenerateXlsxResult {
    const { job, version, style, view, seances, creneauxAffichage } = input;
    const workbook = XLSX.utils.book_new();

    const config = view.config as Record<string, unknown>;
    const feuilles = (config['feuilles'] as string[] ?? ['Export']);
    const colonnes = (config['colonnes'] as string[] ?? [
      'Jour',
      'Créneau',
      'Groupe',
      'Enseignant',
      'Salle',
      'Module',
    ]);

    const modeLibelle =
      job.mode === ExportMode.OFFICIEL ? 'OFFICIEL' : 'BROUILLON';
    const grilleEffective =
      job.grille === GrilleAffichage.RAMADAN
        ? GrilleAffichage.RAMADAN
        : GrilleAffichage.NORMALE;
    const pubInfo = version.publieLe
      ? `, publiée le ${version.publieLe.toISOString().slice(0, 10)}`
      : '';

    const affichageByCreneauId = new Map<string, CreneauAffichageWithCreneau>();
    for (const a of creneauxAffichage) {
      affichageByCreneauId.set(a.creneauId, a);
    }

    const rowsByJour = new Map<string, Array<Record<string, unknown>>>();
    for (const seance of seances) {
      if (!seance.jour || !seance.creneauDebut) continue;

      const jour = seance.jour;
      if (!rowsByJour.has(jour)) {
        rowsByJour.set(jour, []);
      }

      let heureDebut = seance.creneauDebut.heureDebut;
      let heureFin = seance.creneauDebut.heureFin;
      if (
        grilleEffective === GrilleAffichage.RAMADAN &&
        seance.creneauDebutId
      ) {
        const affichage = affichageByCreneauId.get(seance.creneauDebutId);
        if (affichage) {
          heureDebut = affichage.heureDebut;
          heureFin = affichage.heureFin;
        }
      }

      const groupes = seance.groupes.map((g) => g.groupeId).join(', ') || '—';
      const enseignantLabel = seance.tag || seance.enseignantId || '—';
      const salleLabel = seance.salleId || '—';
      const heureStr = formatHeure(heureDebut) + ' – ' + formatHeure(heureFin);

      rowsByJour.get(jour)!.push({
        Jour: jour,
        Créneau: heureStr,
        Groupe: groupes,
        Enseignant: enseignantLabel,
        Salle: salleLabel,
        Module: seance.tag || '—',
        ...(seance.creneauDebut.estPause && { Type: 'Pause' }),
      });
    }

    const ordreJours = [
      'LUNDI',
      'MARDI',
      'MERCREDI',
      'JEUDI',
      'VENDREDI',
      'SAMEDI',
    ];
    const joursTries = [...rowsByJour.keys()].sort(
      (a, b) => ordreJours.indexOf(a) - ordreJours.indexOf(b),
    );

    for (let f = 0; f < feuilles.length; f++) {
      const nomFeuille = feuilles[f] || `Feuille${f + 1}`;
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      let ligneCourante = 0;

      // === EN-TÊTE ===
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [['TAKT — Export']],
        { origin: `A${ligneCourante + 1}` },
      );
      ligneCourante++;

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [[`Version : ${version.numero}${pubInfo}`]],
        { origin: `A${ligneCourante + 1}` },
      );
      ligneCourante++;

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [[`Mode : ${modeLibelle} | Grille : ${grilleEffective}`]],
        { origin: `A${ligneCourante + 1}` },
      );
      ligneCourante++;

      if (style.libelle) {
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[`Style : ${style.libelle}`]],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
      }

      if (view.libelle) {
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[`Vue : ${view.libelle}`]],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
      }

      ligneCourante++;

      // === FILIGRANE BROUILLON ===
      if (job.mode === ExportMode.BROUILLON) {
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[`BROUILLON — Document non publié`]],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
      }

      ligneCourante++;

      // === EN-TÊTES DE COLONNES ===
      const headerRow = colonnes.map(
        (c) => c.charAt(0).toUpperCase() + c.slice(1),
      );
      XLSX.utils.sheet_add_aoa(worksheet, [headerRow], {
        origin: `A${ligneCourante + 1}`,
      });
      ligneCourante++;

      // === DONNÉES ===
      for (const jour of joursTries) {
        const rows = rowsByJour.get(jour) ?? [];
        for (const row of rows) {
          const values = colonnes.map((col) => {
            const key = col.charAt(0).toUpperCase() + col.slice(1);
            return row[key] ?? '';
          });
          XLSX.utils.sheet_add_aoa(worksheet, [values], {
            origin: `A${ligneCourante + 1}`,
          });
          ligneCourante++;
        }
      }

      const colWidths = colonnes.map((_, i) => {
        if (i === 0) return LARGEUR_COLONNE_JOUR;
        if (i === 1) return LARGEUR_COLONNE_HEURE;
        return COLONNE_LARGEUR_PAR_DEFAUT;
      });
      worksheet['!cols'] = colWidths as unknown as XLSX.ColInfo[];

      ligneCourante++;

      // === PIED DE PAGE ===
      if (job.avertissementIds.length > 0) {
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[`Avertissements acceptés (${job.avertissementIds.length}) :`]],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [job.avertissementIds],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
      }

      if (job.mode === ExportMode.OFFICIEL) {
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[`Export officiel — Version ${version.numero}${pubInfo}`]],
          { origin: `A${ligneCourante + 1}` },
        );
        ligneCourante++;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, nomFeuille);
    }

    if (workbook.SheetNames.length === 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['TAKT — Export'],
        [`Version : ${version.numero}${pubInfo}`],
        [`Mode : ${modeLibelle} | Grille : ${grilleEffective}`],
        [],
        ['Aucune donnée à exporter'],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    }

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `export-${version.numero}-${dateStr}.xlsx`;

    return { buffer, filename };
  }
}

/**
 * Formate un objet Date en heure HH:MM (UTC).
 */
function formatHeure(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
