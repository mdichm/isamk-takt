'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GenerationStatusBadge } from './GenerationStatusBadge';
import { GenerationAdoptDialog } from './GenerationAdoptDialog';
import { messages } from '@/lib/messages/fr';
import { t } from '@/lib/i18n';
import { type GenerationStatut, type GenerationSummary } from '@/lib/api/generations';

interface GenerationHistoryListProps {
  generations: GenerationSummary[];
}

export function GenerationHistoryList({
  generations,
}: GenerationHistoryListProps) {
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [selectedForAdoption, setSelectedForAdoption] =
    useState<GenerationSummary | null>(null);

  const adoptable = generations.filter(
    (g) =>
      g.statut === 'SUCCEEDED' || g.statut === 'SUCCEEDED_WITH_WARNINGS',
  );

  if (generations.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        {t('aucuneGeneration')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">{t('generations')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('historiqueGenerations')}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeader className="w-20">{t('colDate')}</TableHeader>
            <TableHeader>{t('colMode')}</TableHeader>
            <TableHeader className="w-24">{t('etat')}</TableHeader>
            <TableHeader className="w-20">{t('scoreGlobal')}</TableHeader>
            <TableHeader className="w-20">{t('colDuree')}</TableHeader>
            <TableHeader className="w-24">{t('colActions')}</TableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations.map((g) => (
            <TableRow key={g.id}>
              <TableCell>
                {new Date(g.createdAt!).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {g.statut === 'MANUELLE' ? t('modeManuelle') : t('modeAutomatique')}
              </TableCell>
              <TableCell>
                <GenerationStatusBadge statut={g.statut as GenerationStatut} />
              </TableCell>
              <TableCell>
                {g.classee ? g.score?.toFixed(1) : t('nonClassee')}
              </TableCell>
              <TableCell>
                {g.durationSeconds != null
                  ? Math.round(g.durationSeconds / 60) + ' min'
                  : '—'}
              </TableCell>
              <TableCell>
                {adoptable.includes(g) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedForAdoption(g);
                      setAdoptOpen(true);
                    }}
                  >
                    {t('btnAdopter')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedForAdoption && (
        <GenerationAdoptDialog
          open={adoptOpen}
          onOpenChange={(open) => {
            setAdoptOpen(open);
            if (!open) setSelectedForAdoption(null);
          }}
          generation={selectedForAdoption}
        />
      )}
    </div>
  );
}
