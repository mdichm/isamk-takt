// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des changements / départements impactés (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import type { Changements } from '@/lib/api/tableau-de-bord';

interface ChangementsBlocProps {
  changements: Changements | null;
}

export function ChangementsBloc({ changements }: ChangementsBlocProps) {
  if (!changements || changements.departements.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('changements')}</CardTitle>
        </CardHeader>
        <CardContent>{t('aucunChangement')}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('changements')}</CardTitle>
        <span className="text-xs font-mono text-foreground/60">
          {changements.totalImpactes}
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <ul className="space-y-1 text-sm">
          {changements.departements.map((d) => (
            <li key={d.code} className="flex items-center justify-between">
              <span className="font-medium">{d.libelle}</span>
              <span className="font-mono text-foreground/60">{d.impactes}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
