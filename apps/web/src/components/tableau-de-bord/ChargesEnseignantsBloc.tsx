// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des charges enseignants avec alertes (L5-28, Responsable)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import type { ChargeEnseignantAlerte } from '@/lib/api/tableau-de-bord';

interface ChargesEnseignantsBlocProps {
  charges: ChargeEnseignantAlerte[];
}

export function ChargesEnseignantsBloc({ charges }: ChargesEnseignantsBlocProps) {
  if (!charges || charges.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('chargesEnseignantsResponsable')}</CardTitle>
        </CardHeader>
        <CardContent>{t('aucuneChargeEnseignant')}</CardContent>
      </Card>
    );
  }

  const nbAlertes = charges.filter((c) => c.depassement === 'true').length;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="font-semibold">{t('chargesEnseignantsResponsable')}</CardTitle>
        {nbAlertes > 0 ? (
          <Badge variant="destructive">{t('alertesDepassement')}</Badge>
        ) : (
          <Badge variant="secondary">{t('aucuneAlerte')}</Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('enseignant')}</TableHead>
              <TableHead className="text-right">{t('charge')}</TableHead>
              <TableHead className="text-right">{t('seuil')}</TableHead>
              <TableHead className="text-center">{t('statut')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.map((c) => (
              <TableRow key={c.enseignantId}>
                <TableCell className="font-medium">{c.nom}</TableCell>
                <TableCell className="text-right font-mono">{c.charge}</TableCell>
                <TableCell className="text-right font-mono">{c.seuil}</TableCell>
                <TableCell className="text-center">
                  {c.depassement === 'true' ? (
                    <Badge variant="destructive">{t('depasseSeuil')}</Badge>
                  ) : (
                    <Badge variant="default">{t('dansSeuil')}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
