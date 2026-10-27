// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des répartitions par département (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import type { Repartition } from '@/lib/api/tableau-de-bord';

interface RepartitionsBlocProps {
  repartitions: Repartition[];
}

const STATUT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  VALIDEE: 'default',
  BROUILLON: 'secondary',
  ROUVERTE: 'destructive',
};

export function RepartitionsBloc({ repartitions }: RepartitionsBlocProps) {
  if (!repartitions || repartitions.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('repartitionsTableauDeBord')}</CardTitle>
        </CardHeader>
        <CardContent>{t('aucuneRepartition')}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle>{t('repartitions')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('departement')}</TableHead>
              <TableHead>{t('statut')}</TableHead>
              <TableHead className="text-right">{t('avancement')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repartitions.map((r) => (
              <TableRow key={r.departementCode}>
                <TableCell className="font-medium">{r.departementCode}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={STATUT_VARIANT[r.statut] ?? 'secondary'}>
                    {r.statut}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{r.avancement}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
