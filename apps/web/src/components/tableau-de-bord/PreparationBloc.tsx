// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc de préparation (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import type { PreparationResume } from '@/lib/api/tableau-de-bord';

interface PreparationBlocProps {
  preparation: PreparationResume;
}

export function PreparationBloc({ preparation }: PreparationBlocProps) {
  const peutGenerer = preparation.peutGenerer;
  const totalAlerte = preparation.nbBloquants + preparation.nbAvertissements;

  return (
    <Card className={`mb-4 border-${peutGenerer ? 'success' : 'destructive'}`}>
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('preparation')}</CardTitle>
        <Badge variant={peutGenerer ? 'default' : 'destructive'}>
          {peutGenerer ? t('pretAGenerer') : t('blocagesPreparation')}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium text-foreground/60">{t('bloquants')}</dt>
          <dd className={`font-mono ${preparation.nbBloquants > 0 ? 'text-destructive' : ''}`}>
            {preparation.nbBloquants}
          </dd>
          <dt className="font-medium text-foreground/60">{t('avertissements')}</dt>
          <dd className={`font-mono ${preparation.nbAvertissements > 0 ? 'text-warning' : ''}`}>
            {preparation.nbAvertissements}
          </dd>
          <dt className="font-medium text-foreground/60">{t('informations')}</dt>
          <dd className="font-mono">{preparation.nbInfos}</dd>
        </dl>
        {totalAlerte > 0 && (
          <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-foreground/60">
            {t('verifierControles').replace('{count}', String(totalAlerte))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
