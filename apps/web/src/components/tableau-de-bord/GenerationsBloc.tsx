// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Bloc des générations (L5-27)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import type { GenerationResume } from '@/lib/api/tableau-de-bord';

interface GenerationsBlocProps {
  generations: GenerationResume;
}

const STATUT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'> = {
  REUSSIE: 'default',
  REUSSIE_AVERTISSEMENTS: 'secondary',
  ECHEC: 'destructive',
  EN_COURS: 'outline',
  ANNULEE: 'ghost',
};

export function GenerationsBloc({ generations }: GenerationsBlocProps) {
  const enCours = generations.enCours ?? [];
  const recentes = generations.recentes ?? [];

  if (enCours.length === 0 && recentes.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('generations')}</CardTitle>
        </CardHeader>
        <CardContent>{t('aucuneGenerationTableauDeBord')}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle>{t('generations')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="my-3" />
        {enCours.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-foreground/60 mb-2">
              {t('generationsEnCours')}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('id')}</TableHead>
                  <TableHead className="text-center">{t('statut')}</TableHead>
                  <TableHead className="text-right">{t('progression')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enCours.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.id}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={STATUT_VARIANT[g.statut] ?? 'outline'}>
                        {g.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {g.progres}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {recentes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground/60 mb-2">
              {t('generationsRecentes')}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('id')}</TableHead>
                  <TableHead className="text-center">{t('statut')}</TableHead>
                  <TableHead className="text-right">{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.id}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={STATUT_VARIANT[g.statut] ?? 'secondary'}>
                        {g.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {new Date(g.at).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
