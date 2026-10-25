// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du spike d'export PDF/Excel (L6-01, S2)
import { describe, it, expect } from 'vitest';
import { ExportSpikeService } from './export-spike.service.js';
import { ExportFormat, ExportMode, ExportSpikeDto } from './dto/export-spike.dto.js';

describe('ExportSpikeService', () => {
  let service: ExportSpikeService;

  beforeEach(() => {
    service = new ExportSpikeService();
  });

  it('devrait générer un fichier XLSX et retourner des métriques', async () => {
    const dto: ExportSpikeDto = { format: ExportFormat.XLSX, pages: 100, mode: ExportMode.BROUILLON, monochrome: true };
    const result = await service.render(dto);

    expect(result.format).toBe(ExportFormat.XLSX);
    expect(result.renderMs).toBeGreaterThanOrEqual(0);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.pages).toBe(100);
    expect(result.monochromeVerified).toBe(true);
    expect(result.library).toContain('xlsx');
    expect(result.filePath).toContain('.xlsx');
  });

  it('devrait générer un fichier PDF et retourner des métriques', async () => {
    const dto: ExportSpikeDto = { format: ExportFormat.PDF, pages: 100, mode: ExportMode.OFFICIEL, monochrome: true };
    const result = await service.render(dto);

    expect(result.format).toBe(ExportFormat.PDF);
    expect(result.renderMs).toBeGreaterThanOrEqual(0);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.pages).toBe(100);
    expect(result.monochromeVerified).toBe(true);
    expect(result.filePath).toContain('.pdf');
  });

  it('devrait utiliser 100 pages par défaut', async () => {
    const dto: ExportSpikeDto = { format: ExportFormat.XLSX };
    const result = await service.render(dto);

    expect(result.pages).toBe(100);
  });

  it('devrait rejeter un format non supporté', async () => {
    const dto: ExportSpikeDto = { format: 'csv' as ExportFormat };
    await expect(service.render(dto)).rejects.toThrow(/non supporté/);
  });

  it('devrait accepter le mode brouillon par défaut', async () => {
    const dto: ExportSpikeDto = { format: ExportFormat.XLSX, pages: 10 };
    const result = await service.render(dto);

    expect(result.monochromeVerified).toBe(true);
    expect(result.pages).toBe(10);
  });
});
