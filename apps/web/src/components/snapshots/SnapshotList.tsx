'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { messages } from '@/lib/messages/fr';
import { findSnapshots, type SnapshotList } from '@/lib/api/snapshots';

export interface SnapshotListProps {
  repartitionId: string;
}

export function SnapshotList({ repartitionId }: SnapshotListProps) {
  const { data, isPending, error } = useQuery<SnapshotList[], Error>({
    queryKey: ['snapshots', 'list', repartitionId],
    queryFn: () => findSnapshots(repartitionId),
    enabled: !!repartitionId,
    staleTime: 30_000,
  });

  if (error) {
    return (
      <div className="p-6 text-destructive text-sm">
        {messages.errorLoadSnapshots}: {error.message}
      </div>
    );
  }

  const snapshots = data ?? [];

  if (isPending) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Chargement de l’historique des snapshots…
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        {messages.noSnapshots}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{messages.snapshots}</h2>
        <p className="text-muted-foreground">{messages.snapshotsSubtitle}</p>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader className="w-1/6">{messages.columnTag}</TableHeader>
              <TableHeader>{messages.columnValidePar}</TableHeader>
              <TableHeader className="w-1/5">{messages.columnValideLe}</TableHeader>
              <TableHeader className="w-1/5">{messages.columnParAdministrateur}</TableHeader>
              <TableHeader className="w-1/6">{messages.columnStatut}</TableHeader>
              <TableHeader className="w-1/5">{messages.columnCreéLe}</TableHeader>
              <TableHeader className="w-1/4 text-right">{messages.buttonVoirDetail}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {snapshots.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium font-mono text-sm">
                  {s.tag}
                </TableCell>
                <TableCell className="text-sm">{s.valideParId}</TableCell>
                <TableCell className="text-sm">{new Date(s.valideLe).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-sm">
                  {s.parAdministrateur
                    ? messages.labelValideParAdministrateur
                    : messages.labelValideParResponsable}
                </TableCell>
                <TableCell className="text-sm font-mono">{s.statut}</TableCell>
                <TableCell className="text-sm">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/repartitions/${repartitionId}/snapshots/${s.id}`}
                    className="text-sm underline underline-offset-4 hover:text-primary"
                  >
                    {messages.buttonVoirDetail}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
