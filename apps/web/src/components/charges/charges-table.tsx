'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCharges } from '@/hooks/use-charges';
import { useDepartements } from '@/hooks/use-structure';
import { messages } from '@/lib/messages/fr';
import type { ChargesQuery } from '@/lib/api/charges';

export function ChargesTable() {
  const [query, setQuery] = useState<ChargesQuery>({
    page: 1,
    limit: 12,
  });
  const [departementId, setDepartementId] = useState<string>('');

  const { data, isPending, error } = useCharges({
    ...query,
    departementId: departementId || undefined,
  });
  const { data: departements } = useDepartements({ limit: 100 });

  const charges = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDepartementChange = (value: string | null) => {
    const id = value ?? '';
    setDepartementId(id);
    setQuery({ ...query, page: 1, departementId: id || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.charges}</h1>
          <p className="text-muted-foreground">{messages.chargesSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.department}</Label>
          <Select
            value={departementId}
            onValueChange={handleDepartementChange}
          >
            <SelectTrigger className="w-48"><SelectValue placeholder={messages.tous} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{messages.tous}</SelectItem>
              {departements?.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.enseignants}</Label>
          <Input
            value={query.enseignantId ?? ''}
            onChange={(e) =>
              setQuery({ ...query, page: 1, enseignantId: e.target.value || undefined })
            }
            placeholder={messages.searchPlaceholder}
            className="w-48"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {messages.errorLoadCharges}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader>{messages.labelVolumeBrut}</TableHeader>
              <TableHeader>{messages.labelChargePonderee}</TableHeader>
              <TableHeader>{messages.labelCalculPartiel}</TableHeader>
              <TableHeader>{messages.labelDepassePlafond}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {messages.noCharges}
                </TableCell>
              </TableRow>
            ) : (
              charges.map((c) => (
                <TableRow key={`${c.dimension}-${c.id}`}>
                  <TableCell className="font-medium">{c.libelle}</TableCell>
                  <TableCell>{c.volumeBrut.toFixed(2)}</TableCell>
                  <TableCell>{c.chargePonderee.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={c.calculPartiel ? 'outline' : 'secondary'}>
                      {c.calculPartiel ? messages.labelCalculPartiel : messages.labelChargePonderee}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => {}}>
                      {messages.btnVoirDetail}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={(query.page ?? 1) === 1 || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}
            >
              {messages.pagePrecedente}
            </Button>
            <span className="text-xs text-muted-foreground">
              {query.page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={(query.page ?? 1) >= totalPages || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
            >
              {messages.pageSuivante}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}