// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc Direction : version publiée et exports (L5-28, Direction)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import type { DirectionView } from '@/lib/api/tableau-de-bord';

interface DirectionBlocProps {
  direction: DirectionView;
}

export function DirectionBloc({ direction }: DirectionBlocProps) {
  const exportsActive = direction.exports === 'true';

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t('espaceDirection')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border">
            <span className="font-medium">{t('versionPublieeDirection')}</span>
            <span className="font-mono font-medium">{direction.versionPubliee || t('nonRenseigne')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border">
            <span className="font-medium">{t('exportsDirection')}</span>
            <Badge variant={exportsActive ? 'default' : 'secondary'}>
              {exportsActive ? t('actif') : t('inactif')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
