'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';
import { useProfils, useSetDefaultProfil } from '@/hooks/use-profils';

interface ProfilsTableProps {
  semestreId: string;
  onRefresh: () => void;
}

export function ProfilsTable({ semestreId, onRefresh }: ProfilsTableProps) {
  const { data, isPending, error } = useProfils(semestreId);
  const setDefaultMut = useSetDefaultProfil(semestreId);

  const profils = data ?? [];
  const defaultProfil = profils.find((p) => p.estParDefaut);

  const handleSetDefault = async (id: string) => {
    await setDefaultMut.mutateAsync({ profilId: id });
    onRefresh();
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        {messages.errorLoadProfils}
      </div>
    );
  }

  if (isPending && !data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {messages.loading}
      </div>
    );
  }

  if (profils.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">{messages.profilsVide}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader className="w-1/3">{messages.columnName}</TableHeader>
            <TableHeader className="text-center w-1/6">{messages.numeroVersion}</TableHeader>
            <TableHeader className="text-center w-1/6">{messages.estParDefaut}</TableHeader>
            <TableHeader className="text-right w-1/4">{messages.columnActions}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {profils.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.nom}
              </TableCell>
              <TableCell className="text-center">
                {p.numero}
              </TableCell>
              <TableCell className="text-center">
                {p.estParDefaut ? (
                  <Badge variant="secondary">{messages.estParDefaut}</Badge>
                ) : (
                  <Badge variant="outline">—</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  {!p.estParDefaut && defaultProfil ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(p.id)}
                      disabled={setDefaultMut.isPending}
                    >
                      {messages.definirParDefaut}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    {messages.btnVoirDetail}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    {messages.edit}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => {}}>
                    {messages.btnSupprimer}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}