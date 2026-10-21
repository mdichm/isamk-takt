'use client';

import { useState } from 'react';
import { useDemandes, useTraiterDemande } from '@/hooks/use-demandes';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { messages } from '@/lib/messages/fr';
import type { DemandeStatut, DemandeType } from '@/lib/api/demandes';

type DemandesTableProps = {
  canCreate?: boolean;
  canTraiter?: boolean;
};

const STATUT_BADGE: Record<DemandeStatut, string> = {
  OUVERTE: 'bg-blue-50 text-blue-700 border-blue-200',
  TRAITEE: 'bg-green-50 text-green-700 border-green-200',
  REFUSEE: 'bg-red-50 text-red-700 border-red-200',
};

export function DemandesTable({ canCreate = false, canTraiter = false }: DemandesTableProps) {
  const [query, setQuery] = useState<{ page: number; limit: number; type?: DemandeType; statut?: DemandeStatut; search?: string }>({
    page: 1,
    limit: 10,
  });
  const { data, isPending, isError } = useDemandes({
    page: query.page,
    limit: query.limit,
    type: query.type,
    statut: query.statut,
    search: query.search,
  });
  const traiterMutation = useTraiterDemande();
  const router = useRouter();
  const pathname = usePathname();

  const handleTraiter = (id: string) => {
    router.push(`${pathname}/${id}`);
  };

  if (isError) {
    return <div className="text-destructive">{messages.errorLoadDemandes}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">{messages.etat}</Label>
          <Select
            value={(query.statut ?? '') as DemandeStatut | ''}
            onValueChange={(v) => setQuery({ ...query, statut: (v as DemandeStatut) || undefined, page: 1 })}
          >
            <SelectTrigger className="w-48"><SelectValue placeholder={messages.tous} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{messages.tous}</SelectItem>
              <SelectItem value="OUVERTE">{messages.statutOuverte}</SelectItem>
              <SelectItem value="TRAITEE">{messages.statutTraitee}</SelectItem>
              <SelectItem value="REFUSEE">{messages.statutRefusee}</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-sm font-medium">{messages.labelType}</Label>
          <Select
            value={(query.type ?? '') as DemandeType | ''}
            onValueChange={(v) => setQuery({ ...query, type: (v as DemandeType) || undefined, page: 1 })}
          >
            <SelectTrigger className="w-48"><SelectValue placeholder={messages.tous} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{messages.tous}</SelectItem>
              <SelectItem value="ANOMALIE">{messages.typeAnomalie}</SelectItem>
              <SelectItem value="MODIFICATION">{messages.typeModification}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={messages.searchPlaceholder}
            value={query.search ?? ''}
            onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
            className="w-64"
          />
          {canCreate && (
            <Button onClick={() => router.push('/demandes/nouvelle')}>
              {messages.createDemande}
            </Button>
          )}
        </div>
      </div>

      {!data ? (
        <div className="text-muted-foreground">{messages.loading}</div>
      ) : data.data.length === 0 ? (
        <div className="text-muted-foreground">{messages.noDemandes}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">{messages.columnStatut}</TableHead>
                <TableHead>{messages.columnType}</TableHead>
                <TableHead>{messages.columnCible}</TableHead>
                <TableHead>{messages.columnMotif}</TableHead>
                <TableHead>{messages.columnAuteur}</TableHead>
                <TableHead>{messages.columnDate}</TableHead>
                <TableHead className="text-right">{messages.columnActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((demande) => (
                <TableRow key={demande.id}>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_BADGE[demande.statut]}>
                      {demande.statut === 'OUVERTE' ? messages.statutOuverte : demande.statut === 'TRAITEE' ? messages.statutTraitee : messages.statutRefusee}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {demande.type === 'ANOMALIE' ? messages.typeAnomalie : messages.typeModification}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                    {JSON.stringify(demande.cible)}
                  </TableCell>
                  <TableCell className="line-clamp-1 max-w-xs truncate">{demande.motif}</TableCell>
                  <TableCell className="text-xs">{demande.auteurId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => router.push(`${pathname}/${demande.id}`)}
                      disabled={traiterMutation.isPending}
                    >
                      {messages.btnVoir}
                    </Button>
                    {canTraiter && demande.statut === 'OUVERTE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTraiter(demande.id)}
                        disabled={traiterMutation.isPending}
                      >
                        {messages.btnTraiter}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {messages.resultats} {data.data.length} / {data.total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={query.page === 1 || isPending}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}
              >
                {messages.pagePrecedente}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={query.page >= data.totalPages || isPending}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}
              >
                {messages.pageSuivante}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}