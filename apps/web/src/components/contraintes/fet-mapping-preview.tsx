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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { messages } from '@/lib/messages/fr';
import {
  findFetMappingReport,
  type FetMappingReport,
} from '@/lib/api/contraintes';

interface FetMappingPreviewProps {
  semestreId: string;
}

function statutBadge(
  statut: string,
): { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string } {
  switch (statut) {
    case 'TRADUITE':
      return { variant: 'default', label: messages.statutTraduite };
    case 'PARTIELLE':
      return { variant: 'secondary', label: messages.statutPartielle };
    case 'NON_TRADUITE':
      return { variant: 'destructive', label: messages.statutNonTraduite };
    default:
      return { variant: 'outline', label: statut };
  }
}

export function FetMappingPreview({ semestreId }: FetMappingPreviewProps) {
  const { data, isPending, error } = useQuery<FetMappingReport, Error>({
    queryKey: ['contraintes', 'fet-mapping', semestreId],
    queryFn: () => findFetMappingReport(semestreId),
    enabled: !!semestreId,
    staleTime: 30_000,
  });

  if (error) {
    return (
      <Card className="border border-destructive/50 bg-destructive/10">
        <CardContent className="p-4 text-destructive text-sm">
          {messages.errorLoadFetMapping}: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card>
        <CardContent className="p-4 text-muted-foreground text-sm">
          {messages.loadingFetMapping}…
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {messages.fetMappingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-muted-foreground text-sm">
          {messages.noContraintesActives}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {messages.fetMappingTitle}
        </CardTitle>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>
            {messages.statTraduite}:{' '}
            <Badge variant="default">{data.stats.TRADUITE}</Badge>
          </span>
          <span>
            {messages.statPartielle}:{' '}
            <Badge variant="secondary">{data.stats.PARTIELLE}</Badge>
          </span>
          <span>
            {messages.statNonTraduite}:{' '}
            <Badge variant="destructive">{data.stats.NON_TRADUITE}</Badge>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">{messages.colRegle}</TableHead>
              <TableHead className="w-1/6">{messages.colStatut}</TableHead>
              <TableHead>{messages.colRaison}</TableHead>
              <TableHead className="w-1/6">{messages.colControlee}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => {
              const { variant, label } = statutBadge(item.statut);
              return (
                <TableRow key={item.regleCode}>
                  <TableCell className="font-mono text-xs">
                    {item.regleCode}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={variant}>{label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.raison || (
                      item.controleeParApplication
                        ? messages.raisonControleeApplication
                        : messages.raisonTraduitFichier
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.controleeParApplication ? (
                      <Badge variant="secondary">{messages.oui}</Badge>
                    ) : (
                      <Badge variant="outline">{messages.non}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}