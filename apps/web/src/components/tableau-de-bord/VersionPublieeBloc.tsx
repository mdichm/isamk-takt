// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc de la version publiée (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import type { VersionPubliee } from '@/lib/api/tableau-de-bord';

interface VersionPublieeBlocProps {
  versionPubliee: VersionPubliee | null;
}

export function VersionPublieeBloc({ versionPubliee }: VersionPublieeBlocProps) {
  if (!versionPubliee) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('versionPubliee')}</CardTitle>
        </CardHeader>
        <CardContent>{t('aucuneVersionPubliee')}</CardContent>
      </Card>
    );
  }

  const { provenance } = versionPubliee;

  return (
    <Card className="mb-4 border-success">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('versionPubliee')}</CardTitle>
        <Badge variant="default">{versionPubliee.numero}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium text-foreground/60">{t('statut')}</dt>
          <dd className="font-mono">{versionPubliee.statut}</dd>
          <dt className="font-medium text-foreground/60">{t('versionFETTableauDeBord')}</dt>
          <dd className="font-mono">{provenance.versionFET ?? t('nonRenseigne')}</dd>
          <dt className="font-medium text-foreground/60">{t('datePublication')}</dt>
          <dd className="font-mono text-xs">
            {provenance.at ? new Date(provenance.at).toLocaleString('fr-FR') : t('nonRenseigne')}
          </dd>
        </dl>
        {provenance.generationId && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-foreground/60">{t('genereeDepuis')}</p>
            <p className="font-mono text-sm">{provenance.generationId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
