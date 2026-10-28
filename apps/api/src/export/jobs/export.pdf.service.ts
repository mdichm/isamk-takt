// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de génération PDF pour les jobs d'export (L6-07)
// Rendu HTML → PDF via Playwright/Chromium (décision ADR-S2).
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ExportFormat,
  ExportMode,
  GrilleAffichage,
  VersionStatut,
} from '@takt/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

interface ExportJobData {
  exportJobId: string;
  format: string;
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

export interface GeneratePdfInput {
  job: ExportJobData;
  version: VersionWithRelations;
  style: StyleWithConfig;
  view: ViewWithConfig;
  seances: SeanceWithCreneau[];
  creneauxAffichage: CreneauAffichageWithCreneau[];
}

export interface GeneratePdfResult {
  buffer: Buffer;
  filename: string;
}

// Tokens d'impression monochrome (design tokens export.print_monochrome)
const INK_PRIMARY = '#000000';
const INK_SECONDARY = '#333333';
const INK_MUTED = '#666666';
const BORDER_COLOR = '#808080';

// Tokens du filigrane BROUILLON (design tokens draft_watermark)
const WATERMARK_TEXT = 'BROUILLON';
const WATERMARK_COLOR = '#29363C';
const WATERMARK_OPACITY = 0.08;
const WATERMARK_ANGLE = -45;

function formatHeure(date: Date | null): string {
  if (!date) return '—';
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function dateStrCompact(date: Date | null): string {
  if (!date) return '—';
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

@Injectable()
export class ExportPdfService {
  private readonly logger = new Logger(ExportPdfService.name);
  private readonly fontsCss: string;

  constructor(private readonly prisma: PrismaService) {
    this.fontsCss = this.buildFontsCss();
  }

  /** Génère les règles @font-face en embarquant les polices auto-hébergées (base64). */
  private buildFontsCss(): string {
    const fontsDir = join(process.cwd(), 'packages/design-tokens/src/fonts');
    const fontFamilies: Record<string, string[]> = {
      Inter: ['Inter-Regular.ttf', 'Inter-Medium.ttf', 'Inter-SemiBold.ttf'],
      Sora: ['Sora-SemiBold.ttf', 'Sora-Bold.ttf'],
      'Black Ops One': ['BlackOpsOne-Regular.ttf'],
    };
    const faces: string[] = [];
    for (const [family, files] of Object.entries(fontFamilies)) {
      for (const file of files) {
        const dir = family.toLowerCase().replace(/\s+/g, '-');
        const filePath = join(fontsDir, dir, file);
        let base64 = '';
        try {
          base64 = readFileSync(filePath).toString('base64');
        } catch {
          // Police absente : on saute, le navigateur fallback sur une police système.
          continue;
        }
        const format = file.endsWith('.ttf') ? 'truetype' : 'opentype';
        faces.push(
          `@font-face { font-family: '${family}'; src: url('data:font/${format};base64,${base64}') format('${format}'); font-weight: normal; font-style: normal; }`,
        );
      }
    }
    return faces.join('\n');
  }

  /** Point d'entrée appelé par le worker : recharge le job et génère le PDF. */
  async generatePdfForJob(
    exportJobId: string,
  ): Promise<GeneratePdfResult> {
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
        style: { select: { id: true, code: true, libelle: true, config: true } },
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
      config: job.style.config as Record<string, unknown>,
    };
    const view: ViewWithConfig = {
      id: job.view.id,
      code: job.view.code,
      libelle: job.view.libelle,
      vue: job.view.vue,
      format: job.view.format,
      config: job.view.config as Record<string, unknown>,
    };

    const seances = await this.prisma.seance.findMany({
      where: { versionId: version.id, statut: 'PLACEE' },
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
    });

    let creneauxAffichage: CreneauAffichageWithCreneau[] = [];
    if (job.grille === 'RAMADAN') {
      const ca = await this.prisma.creneauAffichage.findMany({
        where: { versionId: version.id, grille: 'RAMADAN' },
        include: {
          creneau: { select: { id: true, jour: true, ordre: true } },
        },
      });
      creneauxAffichage = ca.map((c) => ({
        id: c.id,
        creneauId: c.creneauId,
        grille: c.grille,
        heureDebut: c.heureDebut,
        heureFin: c.heureFin,
        creneau: {
          id: c.creneau.id,
          jour: c.creneau.jour,
          ordre: c.creneau.ordre,
        },
      }));
    }

    const seancesMapped: SeanceWithCreneau[] = seances.map((s) => ({
      id: s.id,
      jour: s.jour,
      creneauDebutId: s.creneauDebutId,
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
      enseignantId: s.enseignantId,
      salleId: s.salleId,
      tag: s.tag,
      groupes: s.groupes.map((g) => ({ groupeId: g.groupeId })),
    }));

    return this.generatePdf({
      job: {
        exportJobId: job.id,
        format: job.format,
        mode: job.mode,
        grille: job.grille,
        avertissementIds: job.avertissementIds,
        numeroVersion: version.numero,
        publieLe: version.publieLe ? version.publieLe.toISOString() : null,
      },
      version,
      style,
      view,
      seances: seancesMapped,
      creneauxAffichage,
    });
  }

  /** Génère le PDF à partir des données d'entrée (HTML → Playwright/Chromium). */
  async generatePdf(input: GeneratePdfInput): Promise<GeneratePdfResult> {
    const { job, version, style, view, seances, creneauxAffichage } = input;

    const styleConfig = (style.config ?? {}) as Record<string, unknown>;
    const viewConfig = (view.config ?? {}) as Record<string, unknown>;
    const format = (styleConfig.format ?? 'A4') as 'A4' | 'A3';
    const orientation = (styleConfig.orientation ?? 'portrait') as
      | 'portrait'
      | 'landscape';
    const colonnes = (viewConfig.colonnes ?? [
      'Jour',
      'Créneau',
      'Groupe',
      'Enseignant',
      'Salle',
      'Module',
    ]) as string[];

    const isBrouillon = job.mode === ExportMode.BROUILLON;
    const pubInfo = version.publieLe
      ? `, publiée le ${dateStrCompact(version.publieLe)}`
      : '';
    const modeLibelle =
      job.mode === ExportMode.OFFICIEL ? 'OFFICIEL' : 'BROUILLON';
    const avertInfo = job.avertissementIds.length > 0
      ? `, ${job.avertissementIds.length} avertissement(s) accepté(s)`
      : '';

    const dateStr = dateStrCompact(new Date());
    const filename = `export-${version.numero}-${dateStr}.pdf`;

    const html = this.buildHtml({
      job,
      version,
      style,
      view,
      seances,
      creneauxAffichage,
      format,
      orientation,
      colonnes,
      isBrouillon,
      modeLibelle,
      pubInfo,
      avertInfo,
      dateStr,
    });

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      const buffer = await page.pdf({
        format,
        landscape: orientation === 'landscape',
        printBackground: true,
        margin: { top: '20mm', right: '14mm', bottom: '20mm', left: '14mm' },
      });
      return { buffer, filename };
    } finally {
      await browser.close();
    }
  }

  /** Construit le document HTML complet (en-tête, filigrane, grille, pied de page). */
  private buildHtml(params: {
    job: ExportJobData;
    version: VersionWithRelations;
    style: StyleWithConfig;
    view: ViewWithConfig;
    seances: SeanceWithCreneau[];
    creneauxAffichage: CreneauAffichageWithCreneau[];
    format: 'A4' | 'A3';
    orientation: 'portrait' | 'landscape';
    colonnes: string[];
    isBrouillon: boolean;
    modeLibelle: string;
    pubInfo: string;
    avertInfo: string;
    dateStr: string;
  }): string {
    const {
      job,
      version,
      view,
      seances,
      creneauxAffichage,
      format,
      orientation,
      colonnes,
      isBrouillon,
      modeLibelle,
      pubInfo,
      avertInfo,
      dateStr: _dateStr,
    } = params;

    const isMonochrome = true;
    const primary = isMonochrome ? INK_PRIMARY : '#000000';
    const secondary = isMonochrome ? INK_SECONDARY : '#000000';
    const muted = isMonochrome ? INK_MUTED : '#666666';
    const border = isMonochrome ? BORDER_COLOR : '#808080';

    const css = `
      @page {
        size: ${format} ${orientation};
        margin: 22mm 14mm 22mm 14mm;
        @top-left {
          content: "TAKT — Export";
          font-family: 'Inter', sans-serif;
          font-size: 8pt;
          color: ${muted};
        }
        @top-right {
          content: "Version ${version.numero}${pubInfo}";
          font-family: 'Inter', sans-serif;
          font-size: 8pt;
          color: ${muted};
        }
        @bottom-left {
          content: "${isBrouillon ? 'BROUILLON — Document non publié' : 'Export officiel'}";
          font-family: 'Inter', sans-serif;
          font-size: 8pt;
          color: ${muted};
        }
        @bottom-right {
          content: "Page " counter(page) " de " counter(pages);
          font-family: 'Inter', sans-serif;
          font-size: 8pt;
          color: ${muted};
        }
      }
      ${this.fontsCss}
      * { box-sizing: border-box; }
      body {
        font-family: 'Inter', sans-serif;
        font-size: 9.5pt;
        color: ${primary};
        margin: 0;
        line-height: 1.4;
      }
      .page { position: relative; min-height: 100%; }
      .watermark {
        position: fixed;
        inset: 0;
        z-index: 10000;
        pointer-events: none;
        overflow: hidden;
        opacity: ${WATERMARK_OPACITY};
        background: repeating-linear-gradient(
          ${WATERMARK_ANGLE}deg,
          transparent 0,
          transparent 90px,
          rgba(${hexToRgb(WATERMARK_COLOR)}) 90px,
          rgba(${hexToRgb(WATERMARK_COLOR)}) 100px
        );
      }
      .watermark-text {
        position: absolute;
        color: rgba(${hexToRgb(WATERMARK_COLOR)}, ${WATERMARK_OPACITY});
        font-family: 'Black Ops One', 'Sora', 'Inter', sans-serif;
        font-size: 56px;
        font-weight: bold;
        transform: rotate(${WATERMARK_ANGLE}deg);
        white-space: nowrap;
      }
      header {
        position: fixed;
        top: 14mm;
        left: 14mm;
        right: 14mm;
        z-index: 10001;
        border-bottom: 2px solid ${primary};
        padding-bottom: 4mm;
        margin-bottom: 8mm;
      }
      header .takt {
        font-family: 'Black Ops One', 'Sora', sans-serif;
        font-size: 16pt;
        color: ${primary};
        letter-spacing: 2px;
      }
      header .meta {
        font-size: 8pt;
        color: ${muted};
        margin-top: 2mm;
      }
      .content { margin-top: 22mm; }
      h1 {
        font-family: 'Sora', 'Inter', sans-serif;
        font-size: 13pt;
        color: ${primary};
        margin: 0 0 3mm 0;
      }
      .subtitle {
        font-size: 8.5pt;
        color: ${secondary};
        margin-bottom: 5mm;
      }
      table.grille {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
      }
      table.grille th, table.grille td {
        border: 1px solid ${border};
        padding: 3px 5px;
        text-align: left;
        vertical-align: top;
      }
      table.grille th {
        background: #f5f5f5;
        color: ${primary};
        font-family: 'Sora', 'Inter', sans-serif;
        font-weight: bold;
        font-size: 8pt;
      }
      table.grille td.jour {
        font-weight: bold;
        color: ${primary};
        background: #fafafa;
      }
      .jour-break { page-break-inside: avoid; margin-bottom: 6mm; }
      .creneau-row td { border-top: 1px solid ${border}; }
      .seance-cell { font-size: 8pt; }
      .tag { font-family: 'Sora', 'Inter', sans-serif; font-weight: bold; color: ${primary}; }
      footer {
        position: fixed;
        bottom: 14mm;
        left: 14mm;
        right: 14mm;
        z-index: 10001;
        border-top: 1px solid ${border};
        padding-top: 3mm;
        font-size: 7.5pt;
        color: ${muted};
      }
      footer .avertissements { margin-top: 2mm; font-size: 7pt; }
      .monochrome-note {
        font-size: 7pt;
        color: ${muted};
        font-style: italic;
      }
    `;

    // Position des libellés "BROUILLON" répétés (grille 3x3)
    const watermarkTexts = [];
    const positions = [
      '15% 20%', '50% 20%', '85% 20%',
      '15% 50%', '50% 50%', '85% 50%',
      '15% 80%', '50% 80%', '85% 80%',
    ];
    for (const pos of positions) {
      watermarkTexts.push(
        `<div class="watermark-text" style="top:${pos.split(' ')[1]}; left:${pos.split(' ')[0]};">${WATERMARK_TEXT}</div>`,
      );
    }

    // Construction des lignes de grille
    const lignes: string[] = [];
    const seancesByJour = new Map<string, SeanceWithCreneau[]>();
    for (const s of seances) {
      const j = s.jour ?? 'NON_PLACEE';
      const arr = seancesByJour.get(j) ?? [];
      arr.push(s);
      seancesByJour.set(j, arr);
    }

    // Créneaux affichage indexés par creneauId (pour grille RAMADAN)
    const creneauAffichageById = new Map<string, CreneauAffichageWithCreneau>();
    for (const ca of creneauxAffichage) {
      creneauAffichageById.set(ca.creneauId, ca);
    }

    for (const jour of JOURS_ORDRE) {
      const jourSeances = seancesByJour.get(jour);
      if (!jourSeances || jourSeances.length === 0) continue;

      // Grouper par créneau
      const byCreneau = new Map<string | null, SeanceWithCreneau[]>();
      for (const s of jourSeances) {
        const key = s.creneauDebutId ?? 'hors-creneau';
        const arr = byCreneau.get(key) ?? [];
        arr.push(s);
        byCreneau.set(key, arr);
      }

      // Trier les créneaux par ordre
      const ordreOf = (key: string | null): number => {
        if (key === 'hors-creneau' || key === null) return 999;
        const ca = creneauAffichageById.get(key);
        if (ca) return ca.creneau.ordre;
        const s = jourSeances.find((se) => se.creneauDebutId === key);
        return s?.creneauDebut?.ordre ?? 999;
      };
      const sortedCreneaux = Array.from(byCreneau.entries()).sort(
        ([keyA], [keyB]) => ordreOf(keyA) - ordreOf(keyB),
      );

      lignes.push(`<div class="jour-break">`);
      lignes.push(`<div class="jour-header">${jour}</div>`);
      lignes.push(`<table class="grille">`);
      lignes.push(`<thead><tr>`);
      for (const col of colonnes) {
        lignes.push(`<th>${escapeHtml(col)}</th>`);
      }
      lignes.push(`</tr></thead>`);
      lignes.push(`<tbody>`);

      for (const [, creneauSeances] of sortedCreneaux) {
        // Déterminer l'horaire du créneau
        let creneauLabel = '';
        for (const s of creneauSeances) {
          if (s.creneauDebut) {
            const ca = creneauAffichageById.get(s.creneauDebutId!);
            const hd = ca ? ca.heureDebut : s.creneauDebut.heureDebut;
            const hf = ca ? ca.heureFin : s.creneauDebut.heureFin;
            creneauLabel = `${formatHeure(hd)}–${formatHeure(hf)}`;
            break;
          }
        }

        for (let i = 0; i < creneauSeances.length; i++) {
          const s = creneauSeances[i];
          lignes.push(`<tr class="creneau-row">`);
          for (const col of colonnes) {
            const colLower = col.toLowerCase();
            let value = '';
            if (colLower === 'jour') {
              value = jour;
            } else if (colLower === 'créneau' || colLower === 'creneau') {
              value = i === 0 ? creneauLabel : '';
            } else if (colLower === 'groupe') {
              value = s.groupes.map((g) => g.groupeId).join(', ');
            } else if (colLower === 'enseignant') {
              value = s.enseignantId ?? '—';
            } else if (colLower === 'salle') {
              value = s.salleId ?? '—';
            } else if (colLower === 'module') {
              value = s.tag ? `<span class="tag">${escapeHtml(s.tag)}</span>` : '—';
            } else {
              value = '—';
            }
            lignes.push(`<td class="seance-cell">${value}</td>`);
          }
          lignes.push(`</tr>`);
        }
      }

      lignes.push(`</tbody></table></div>`);
    }

    const avertissementsHtml = job.avertissementIds.length > 0
      ? `<div class="avertissements"><strong>Avertissements acceptés :</strong> ${job.avertissementIds.join(', ')}</div>`
      : '';

    const officialHtml = job.mode === ExportMode.OFFICIEL
      ? `<div class="official"><strong>Export officiel — Version ${version.numero}${pubInfo}</strong></div>`
      : '';

    const monochromeNote = isMonochrome
      ? `<p class="monochrome-note">Impression monochrome (encres #000/#333/#666, bordures #808080). États rendus par libellé et icône.</p>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>TAKT — Export ${version.numero}</title>
<style>${css}</style>
</head>
<body>
  <div class="page">
    ${isBrouillon ? `<div class="watermark">${watermarkTexts.join('')}</div>` : ''}
    <header>
      <div class="takt">TAKT</div>
      <div class="meta">
        Export ${modeLibelle} &bull; Version ${version.numero}${pubInfo} &bull; Grille ${job.grille} &bull; Vue ${view.libelle || view.code}${avertInfo}
      </div>
    </header>
    <div class="content">
      <h1>TAKT — Emploi du temps</h1>
      <div class="subtitle">
        Version ${version.numero}${pubInfo} &bull; Mode ${modeLibelle} &bull; Grille ${job.grille} &bull; Généré le ${new Date().toISOString().slice(0,10).replace(/-/g,'/')}
      </div>
      ${lignes.join('')}
      ${monochromeNote}
    </div>
    <footer>
      <div>
        TAKT — ISAMK &bull; Export ${modeLibelle} &bull; ${isBrouillon ? 'Document non publié — BROUILLON' : 'Version publiée'}
      </div>
      ${avertissementsHtml}
      ${officialHtml}
    </footer>
  </div>
</body>
</html>`;
  }
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
