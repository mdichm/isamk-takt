// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de stockage de fichiers (FileStore)
// Stocke les fichiers dans le volume /filestore avec empreinte SHA-256.
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilestoreService {
  private readonly logger = new Logger(FilestoreService.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('app.filestore.path', '/filestore');
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Stocke un fichier et retourne sa clé de stockage, son empreinte SHA-256 et sa taille.
   */
  storeFile(buffer: Buffer, originalName: string): { storageKey: string; sha256: string; size: number } {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new BadRequestException('Le fichier à stocker est vide ou invalide.');
    }

    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const safeName = originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const storageKey = `${sha256.slice(0, 16)}/${Date.now()}-${safeName}`;
    const filePath = join(this.basePath, storageKey);

    const dir = join(this.basePath, sha256.slice(0, 16));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, buffer);

    this.logger.log(`Fichier stocké : ${storageKey} (${buffer.length} octets, SHA-256: ${sha256})`);

    return { storageKey, sha256, size: buffer.length };
  }

  /**
   * Lit un fichier stocké par sa clé de stockage.
   */
  getFile(storageKey: string): Buffer {
    const filePath = join(this.basePath, storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Fichier introuvable : ${storageKey}`);
    }
    return readFileSync(filePath);
  }

  /**
   * Vérifie si un fichier existe.
   */
  fileExists(storageKey: string): boolean {
    return existsSync(join(this.basePath, storageKey));
  }
}