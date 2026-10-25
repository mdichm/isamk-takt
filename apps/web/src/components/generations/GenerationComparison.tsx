'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompareGenerations } from '@/hooks/use-generations';
import { GenerationStatusBadge } from './GenerationStatusBadge';
import { messages } from '@/lib/messages/fr';
import { t } from '@/lib/i18n';
import {
  type GenerationStatut,
  type GenerationSummary,
  type CompareResponse,
} from '@/lib/api/generations';

interface GenerationComparisonProps {
  generations: GenerationSummary[];
}

export function GenerationComparison({
  generations,
}: GenerationComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);
  const canCompare = selectedIds.length >= 2 && selectedIds.length <= 4;

  const { data: compareData, isPending } = useCompareGenerations(selectedIds);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">{t('comparaison')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('comparerGenerations')}
        </p>
      </div>

      <div className="border rounded-md p-4 bg-muted/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-10" />
              <TableHeader>{t('colDate')}</TableHeader>
              <TableHeader>{t('etat')}</TableHeader>
              <TableHeader className="w-20">{t('scoreGlobal')}</TableHeader>
              <TableHeader className="w-20">{t('classement')}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generations.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="w-10">
                  <input
                    type="checkbox"
                    checked={isSelected(g.id)}
                    onChange={() => toggleSelection(g.id)}
                    disabled={
                      !canCompare &&
                      !isSelected(g.id) &&
                      selectedIds.length >= 4
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </TableCell>
                <TableCell>
                  {new Date(g.createdAt!).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <GenerationStatusBadge statut={g.statut as GenerationStatut} />
                </TableCell>
                <TableCell>
                  {g.classee ? g.score?.toFixed(1) : t('nonClassee')}
                </TableCell>
                <TableCell>{g.classement ?? t('nonClassee')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={() => setSelectedIds([])}
            size="sm"
            variant="outline"
            disabled={selectedIds.length === 0}
          >
            {t('annuler')}
          </Button>
          <Button
            onClick={() => {}}
            disabled={!canCompare}
            className="ml-auto"
          >
            {t('btnComparer')}
          </Button>
        </div>
      </div>

      {compareData && !isPending && (
        <div className="border rounded-md p-4 bg-muted/50">
          <h4 className="text-xs font-semibold mb-3">
            {t('resultatComparaison')}
          </h4>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader>{t('indicateur')}</TableHeader>
                {compareData.generations.map((g) => (
                  <TableHeader key={g.id}>{g.versionNom}</TableHeader>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {compareData.diff.seancesDifferentes.map((cle) => (
                <TableRow key={cle}>
                  <TableCell className="font-mono text-xs">
                    {cle}
                  </TableCell>
                  {compareData.generations.map(() => (
                    <TableCell key={cle} className="text-sm text-muted-foreground">
                      {'—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {compareData.diff.changements.map((c) => (
                <TableRow key={c.cle}>
                  <TableCell className="font-mono text-xs">
                    {c.cle}
                  </TableCell>
                  {compareData.generations.map(() => (
                    <TableCell key={c.cle} className="text-sm text-muted-foreground">
                      {'—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(compareData.diff.conflits.conflitsApparus.length > 0 ||
            compareData.diff.conflits.conflitsDisparus.length > 0) && (
            <div className="mt-4">
              <h5 className="text-xs font-semibold text-destructive mb-2">
                {t('conflits')}
              </h5>
              {compareData.diff.conflits.conflitsApparus.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-destructive">
                    {t('conflitsApparus')}:
                  </span>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {compareData.diff.conflits.conflitsApparus.map((sig) => (
                      <li key={sig}>{sig}</li>
                    ))}
                  </ul>
                </div>
              )}
              {compareData.diff.conflits.conflitsDisparus.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-success">
                    {t('conflitsDisparus')}:
                  </span>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {compareData.diff.conflits.conflitsDisparus.map((sig) => (
                      <li key={sig}>{sig}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            {compareData.diff.verrous.verrousRespectes.some((v) => !v) ? (
              <div>
                <h5 className="text-xs font-semibold text-destructive mb-2">
                  {t('verrous')}
                </h5>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {compareData.generations
                    .filter(
                      (_, i) =>
                        !compareData.diff.verrous.verrousRespectes[i],
                    )
                    .map((g) => (
                      <li key={g.id}>
                        {g.versionNom} — {t('verrousNonRespectes')}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-success">
                {t('verrousRespectesTous')}
              </div>
            )}
          </div>

          {compareData.diff.seancesDifferentes.length === 0 &&
            compareData.diff.changements.length === 0 &&
            compareData.diff.conflits.conflitsApparus.length === 0 &&
            compareData.diff.conflits.conflitsDisparus.length === 0 &&
            compareData.diff.verrous.verrousRespectes.every((v) => v) && (
              <div className="mt-4 text-sm text-success">
                {t('aucuneDifference')}
              </div>
            )}
        </div>
      )}

      {isPending && !compareData && (
        <div className="p-4 text-muted-foreground text-center">
          {t('chargement')}
        </div>
      )}
    </div>
  );
}
