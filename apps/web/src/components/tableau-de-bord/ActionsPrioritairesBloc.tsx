// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des actions prioritaires (L5-27)
// Chaque anomalie mène directement à l'objet à corriger via le lien direct.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import type { ActionPrioritaire } from '@/lib/api/tableau-de-bord';

interface ActionsPrioritairesBlocProps {
  actions: ActionPrioritaire[];
}

export function ActionsPrioritairesBloc({ actions }: ActionsPrioritairesBlocProps) {
  if (!actions || actions.length === 0) {
    return (
      <Card className="mb-4 border-success">
        <CardHeader>
          <CardTitle>{t('actionsPrioritaires')}</CardTitle>
        </CardHeader>
        <CardContent className="text-success">
          {t('aucuneActionPrioritaire')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-destructive">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold text-destructive">
          {t('actionsPrioritaires')}
        </CardTitle>
        <Badge variant="destructive">{actions.length}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <ul className="space-y-2">
          {actions.map((action, index) => (
            <li key={action.code} className="p-3 rounded bg-destructive/5 border border-destructive/20">
              <div className="flex flex-row items-start justify-between mb-1">
                <span className="text-xs font-mono font-medium text-destructive uppercase tracking-wider">
                  {action.code}
                </span>
                <span className="text-xs font-semibold">{index + 1}</span>
              </div>
              <p className="text-sm mb-2">{action.pourquoi}</p>
              <Link
                href={action.lien}
                className="text-sm text-primary hover:underline font-medium"
              >
                {t('allerA')}: {action.lien}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
