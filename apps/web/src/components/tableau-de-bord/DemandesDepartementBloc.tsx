// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des demandes ouvertes du département (L5-28, Responsable)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';

interface DemandesDepartementBlocProps {
  demandes: string[];
}

export function DemandesDepartementBloc({ demandes }: DemandesDepartementBlocProps) {
  if (!demandes || demandes.length === 0) {
    return (
      <Card className="mb-4 border-success">
        <CardHeader>
          <CardTitle>{t('demandesDepartement')}</CardTitle>
        </CardHeader>
        <CardContent className="text-success">
          {t('aucuneDemandeOuverte')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-warning">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('demandesDepartement')}</CardTitle>
        <Badge variant="secondary">{demandes.length}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <ul className="space-y-1 text-sm">
          {demandes.map((d, index) => (
            <li key={index} className="flex items-center justify-between p-2 rounded bg-warning/10">
              <span className="font-medium">{d}</span>
              <Badge variant="outline">{t('aTraiter')}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
