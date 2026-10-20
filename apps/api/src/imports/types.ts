// SPDX-License-Identifier: AGPL-3.0-only
// Déclaration globale des types Multer pour Express (pas de @types/multer dans le projet)
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
