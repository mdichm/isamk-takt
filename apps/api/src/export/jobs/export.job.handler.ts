// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Worker pg-boss des jobs d'export (L6-04)
// Souscrit à la file 'export' et traite le rendu (stub : rendu réel délégué à L6-06/L6-07).
import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { PgBoss } from 'pg-boss';
import type { PgBoss as PgBossClass } from 'pg-boss';
import type { Job as PgBossJob } from 'pg-boss';
import { ExportService } from '../export.service.js';
import { FilestoreService } from '../../filestore/filestore.service.js';
import { ExportXlsxService } from './export.xlsx.service.js';
import { ExportPdfService } from './export.pdf.service.js';

interface ExportJobData {
  exportJobId: string;
  format: string;
  mode: string;
  grille: string;
  avertissementIds: string[];
  numeroVersion: string;
  publieLe: string | null;
}

@Injectable()
export class ExportJobHandler implements OnModuleInit {
  private readonly logger = new Logger(ExportJobHandler.name);
  private currentJobData: ExportJobData | null = null;

  constructor(
    @Inject('BOSS') private readonly boss: any,
    private readonly exportService: ExportService,
    private readonly filestore: FilestoreService,
    private readonly xlsxService: ExportXlsxService,
    private readonly pdfService: ExportPdfService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.boss.subscribe('export', async (job: any) => {
      this.currentJobData = job.data as ExportJobData;
      const { exportJobId } = job.data as ExportJobData;
      try {
        await this.processJob(exportJobId);
      } catch (error) {
        await this.exportService.fail(
          exportJobId,
          error instanceof Error ? error.message : String(error),
        );
      }
    });
    this.logger.log('Worker export souscrit sur la file pg-boss');
  }

  private async processJob(exportJobId: string): Promise<void> {
    try {
      const job = this.currentJobData;
      if (!job) {
        throw new Error(`Données de job manquantes pour ${exportJobId}`);
      }

      // Branching format : XLSX (L6-06) / PDF (L6-07) vs placeholder texte (L6-04/L6-05)
      if (job.format === 'XLSX') {
        await this.processXlsxJob(exportJobId);
        return;
      }

      if (job.format === 'PDF') {
        await this.processPdfJob(exportJobId);
        return;
      }

      // Stub L6-04/L6-05 : génère un fichier placeholder enrichi des métadonnées d'export.
      // Le rendu réel (PDF via Playwright, XLSX via ExcelJS) est délégué à L6-06 et L6-07.
      const modeLibelle =
        job.mode === 'OFFICIEL' ? 'OFFICIEL' : 'BROUILLON';
      const pubInfo = job.publieLe
        ? `, publiée le ${job.publieLe}`
        : '';
      const avertInfo = job.avertissementIds.length > 0
        ? `, ${job.avertissementIds.length} avertissement(s) accepté(s)`
        : '';
      const content = `TAKT — Export placeholder (job ${exportJobId})\nMode : ${modeLibelle}\nVersion : ${job.numeroVersion}${pubInfo}\nGrille : ${job.grille}${avertInfo}\nGénéré par le worker L6-05.\nRendu réel : voir L6-06 (XLSX) et L6-07 (PDF).\n`;
      const buffer = Buffer.from(content, 'utf-8');

      const { storageKey, sha256 } = this.filestore.storeFile(
        buffer,
        `export-${exportJobId}.txt`,
      );

      await this.exportService.complete(exportJobId, storageKey, sha256);
      this.logger.log(`ExportJob traité : id=${exportJobId} storageKey=${storageKey}`);
    } catch (error) {
      await this.exportService.fail(
        exportJobId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async processXlsxJob(exportJobId: string): Promise<void> {
    try {
      const { buffer, filename } = await this.xlsxService.generateXlsxForJob(
        exportJobId,
      );

      const { storageKey, sha256 } = this.filestore.storeFile(
        buffer,
        filename,
      );

      await this.exportService.complete(exportJobId, storageKey, sha256);
      this.logger.log(
        `ExportJob XLSX traité : id=${exportJobId} storageKey=${storageKey} file=${filename}`,
      );
    } catch (error) {
      await this.exportService.fail(
        exportJobId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async processPdfJob(exportJobId: string): Promise<void> {
    try {
      const { buffer, filename } = await this.pdfService.generatePdfForJob(
        exportJobId,
      );

      const { storageKey, sha256 } = this.filestore.storeFile(
        buffer,
        filename,
      );

      await this.exportService.complete(exportJobId, storageKey, sha256);
      this.logger.log(
        `ExportJob PDF traité : id=${exportJobId} storageKey=${storageKey} file=${filename}`,
      );
    } catch (error) {
      await this.exportService.fail(
        exportJobId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
