'use client';

import { useQuery } from '@tanstack/react-query';
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
import { messages } from '@/lib/messages/fr';
import { findSnapshot, type SnapshotDetail } from '@/lib/api/snapshots';

export interface SnapshotDetailProps {
  repartitionId: string;
  snapshotId: string;
}

export function SnapshotDetail({
  repartitionId,
  snapshotId,
}: SnapshotDetailProps) {
  const { data, isPending, error } = useQuery<SnapshotDetail, Error>({
    queryKey: ['snapshots', 'detail', repartitionId, snapshotId],
    queryFn: () => findSnapshot(repartitionId, snapshotId),
    enabled: !!repartitionId && !!snapshotId,
    staleTime: 30_000,
  });

  if (error) {
    return (
      <div className="p-6 text-destructive text-sm">
        {messages.errorLoadSnapshot}: {error.message}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Chargement du snapshot…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Snapshot introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.snapshotDetails}</h1>
          <p className="text-muted-foreground">
            {messages.snapshotLectureSeule}
          </p>
        </div>
        <Badge variant={data.parAdministrateur ? 'destructive' : 'secondary'}>
          {data.parAdministrateur
            ? messages.labelValideParAdministrateur
            : messages.labelValideParResponsable}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Tag
          </div>
          <div className="font-mono">{data.tag}</div>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Validé par
          </div>
          <div>{data.valideParId}</div>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Date de validation
          </div>
          <div>{new Date(data.valideLe).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Statut
          </div>
          <div className="font-mono">{data.statut}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affectations figées</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{messages.columnEnseignant}</TableHeader>
                <TableHeader>{messages.columnModule}</TableHeader>
                <TableHeader>{messages.columnTypeEnseignement}</TableHeader>
                <TableHeader className="text-right">
                  {messages.columnVolumeHebdo}
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.affectations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Aucune affectation figée.
                  </TableCell>
                </TableRow>
              ) : (
                data.affectations.map((a) => (
                  <TableRow key={a.enseignantId + '-' + a.moduleId}>
                    <TableCell className="text-sm">{a.enseignantId}</TableCell>
                    <TableCell className="text-sm">{a.moduleId}</TableCell>
                    <TableCell className="text-sm">{a.typeEnseignementId}</TableCell>
                    <TableCell className="text-sm text-right">
                      {a.volumeHebdoMinutes} min
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charges figées par enseignant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{messages.columnEnseignant}</TableHeader>
                <TableHeader className="text-right">
                  {messages.columnVolumeBrut}
                </TableHeader>
                <TableHeader className="text-right">
                  {messages.columnChargeCalculee}
                </TableHeader>
                <TableHeader className="text-right">{messages.columnEcart}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Aucune charge figée.
                  </TableCell>
                </TableRow>
              ) : (
                data.charges.map((c) => (
                  <TableRow key={c.enseignantId}>
                    <TableCell className="text-sm">{c.enseignantId}</TableCell>
                    <TableCell className="text-sm text-right">
                      {c.volumeBrut} min
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {c.chargeCalculee} min
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {c.ecart} min
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}