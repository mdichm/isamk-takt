// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des validations en attente (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';

interface ValidationsEnAttenteBlocProps {
  validations: string[];
}

export function ValidationsEnAttenteBloc({ validations }: ValidationsEnAttenteBlocProps) {
  if (!validations || validations.length === 0) {
    return (
      <Card className="mb-4 border-success">
        <CardHeader>
          <CardTitle>{t('validationsEnAttente')}</CardTitle>
        </CardHeader>
        <CardContent className="text-success">
          {t('aucuneValidationEnAttente')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-warning">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('validationsEnAttente')}</CardTitle>
        <Badge variant="secondary">{validations.length}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <ul className="space-y-1 text-sm">
          {validations.map((v, index) => (
            <li key={index} className="flex items-center justify-between p-2 rounded bg-warning/10">
              <span className="font-medium">{v}</span>
              <Badge variant="outline">{t('aTraiter')}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
