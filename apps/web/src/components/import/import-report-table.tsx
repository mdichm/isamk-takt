// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Rapport de simulation ligne par ligne (L1-27)
'use client';

import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImportFichierItem } from '@/lib/api/import-fichier';
import { ImportActionBadge } from './import-action-badge';
import { messages } from '@/lib/messages/fr';

export type ImportReportTableProps = {
  items: ImportFichierItem[];
};

export function ImportReportTable({ items }: ImportReportTableProps) {
  const hasErreurs = items.some((item) => item.action === 'erreur');
  const hasConflits = items.some((item) => item.action === 'conflit');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{messages.importRapportTitre}</h2>
        {hasErreurs || hasConflits ? (
          <span className="text-sm text-red-700 font-medium">
            {messages.importErreursConflitsDetectes}
          </span>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <TableHeader>
            <TableRow className="border-b text-sm text-muted-foreground">
              <TableHead className="w-20 pb-2 font-medium">{messages.importFichierColLigne}</TableHead>
              <TableHead className="pb-2 font-medium">{messages.importFichierColColonne}</TableHead>
              <TableHead className="pb-2 font-medium">{messages.importFichierColValeur}</TableHead>
              <TableHead className="pb-2 font-medium">{messages.importFichierColAction}</TableHead>
              <TableHead className="pb-2 font-medium w-1/3">{messages.importFichierColMessage}</TableHead>
              <TableHead className="pb-2 font-medium">{messages.importFichierColCorrection}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="border-b text-sm">
                <TableCell className="py-2 font-mono">{item.ligne}</TableCell>
                <TableCell className="py-2">{item.colonne}</TableCell>
                <TableCell className="py-2 font-mono">{item.valeur}</TableCell>
                <TableCell className="py-2">
                  <ImportActionBadge action={item.action} />
                </TableCell>
                <TableCell className="py-2">{item.message}</TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">
                  {item.correctionAttendue ?? messages.importAucuneValeur}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </section>
  );
}
