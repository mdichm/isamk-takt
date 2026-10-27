// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - En-tête du tableau de bord (L5-27)
// Contexte : année et semestre actifs

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import type { Contexte } from '@/lib/api/tableau-de-bord';

interface TableauDeBordHeaderProps {
  contexte: Contexte;
}

export function TableauDeBordHeader({ contexte }: TableauDeBordHeaderProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-lg font-semibold">
          {t('tableauDeBord')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium text-foreground/60">{t('annee')}</dt>
          <dd className="font-mono">{contexte.annee}</dd>
          <dt className="font-medium text-foreground/60">{t('semestre')}</dt>
          <dd className="font-mono">{contexte.semestre}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
