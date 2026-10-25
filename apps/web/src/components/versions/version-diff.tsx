'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVersionDiff } from '@/hooks/use-version-diff';
import { messages } from '@/lib/messages/fr';
import type { ChangementSeanceDto, VersionDiffDto } from '@/lib/api/versions';

interface VersionDiffProps {
  versionId: string;
  againstId: string;
}

function typeLabel(type: string): string {
  switch (type) {
    case 'DEPLACE':
      return messages.diffTypeDeplace;
    case 'SALLE_MODIFIEE':
      return messages.diffTypeSalleModifiee;
    case 'ENSEIGNANT_MODIFIE':
      return messages.diffTypeEnseignantModifie;
    case 'STATUT_MODIFIE':
      return messages.diffTypeStatutModifie;
    default:
      return type;
  }
}

export function VersionDiff({
  versionId,
  againstId,
}: VersionDiffProps) {
  const { data: diff, isLoading: loading, error: error } = useVersionDiff(
    versionId,
    againstId,
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">{messages.diffChargement}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">{messages.diffErreur}</p>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          Données de diff indisponibles.
        </p>
      </div>
    );
  }

  const aucuneDifference =
    diff.seancesDifferentes === 0 &&
    diff.seulesAGauche.length === 0 &&
    diff.seulesADroite.length === 0 &&
    diff.conflits.apparus === 0 &&
    diff.conflits.disparus === 0;

  if (aucuneDifference) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {messages.diffResultatComparaison}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              {messages.diffAucuneDifference}
              {' '}
              {diff.versionNumero} vs {diff.againstNumero}.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {messages.diffResultatComparaison}
          </h2>
          <p className="text-sm text-muted-foreground">
            {diff.versionNumero} vs {diff.againstNumero}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{messages.diffResumer}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase">
              {messages.diffSeancesIdentiques}
            </span>
            <span className="text-2xl font-bold">{diff.seancesIdentiques}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase">
              {messages.diffSeancesDifferentes}
            </span>
            <span className="text-2xl font-bold text-destructive">
              {diff.seancesDifferentes}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase">
              {messages.diffConflitsApparus}
            </span>
            <span className="text-2xl font-bold">{diff.conflits.apparus}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase">
              {messages.diffConflitsDisparus}
            </span>
            <span className="text-2xl font-bold">{diff.conflits.disparus}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {messages.diffChangementsSeances}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diff.changements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.diffCleSeance}</TableHead>
                  <TableHead>{messages.diffType}</TableHead>
                  <TableHead>{messages.diffVersionGauche}</TableHead>
                  <TableHead>{messages.diffVersionDroite}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diff.changements.map((c: ChangementSeanceDto) => (
                  <TableRow key={c.cle}>
                    <TableCell className="font-mono text-sm">{c.cle}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">{typeLabel(c.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.gauche.jour ?? '—'} /{' '}
                      {c.gauche.creneauDebutId ?? '—'} /{' '}
                      {c.gauche.salleId ?? '—'} /{' '}
                      {c.gauche.enseignantId ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.droite.jour ?? '—'} /{' '}
                      {c.droite.creneauDebutId ?? '—'} /{' '}
                      {c.droite.salleId ?? '—'} /{' '}
                      {c.droite.enseignantId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              {messages.diffAucunChangement}
            </p>
          )}
        </CardContent>
      </Card>
      {diff.seulesAGauche.length > 0 || diff.seulesADroite.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.diffSeancesUniquement}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-2">
                {messages.diffSeulesAGauche}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {diff.seulesAGauche.map((cle) => (
                  <li key={cle} className="font-mono">{cle}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-2">
                {messages.diffSeulesADroite}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {diff.seulesADroite.map((cle) => (
                  <li key={cle} className="font-mono">{cle}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <div className="flex justify-between text-sm text-muted-foreground">
        <div>
          {messages.diffVerrousGauche}:{' '}
          <span className="font-medium">{diff.verrous.respectesGauche}</span>
        </div>
        <div>
          {messages.diffVerrousDroite}:{' '}
          <span className="font-medium">{diff.verrous.respectesDroite}</span>
        </div>
      </div>
    </div>
  );
}