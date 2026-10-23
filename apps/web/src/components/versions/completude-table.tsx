'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
import { Eye, CheckCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { messages } from '@/lib/messages/fr';
import { type CompletudeResponse } from '@/lib/api/versions';

interface CompletudeTableProps {
  data: CompletudeResponse | undefined;
  isLoading: boolean;
  error: unknown;
  versionId: string;
}

function EcartBadge({ ecart }: { ecart: number }) {
  if (ecart === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3 text-green-600" aria-hidden="true" />
        <span className="text-green-700 dark:text-green-400 font-mono">0</span>
      </Badge>
    );
  }
  if (ecart > 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
        <span className="text-red-700 dark:text-red-400 font-mono">−{ecart}</span>
        <span className="text-xs text-red-600 dark:text-red-500">{messages.ecartNegatif}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <PlusCircle className="h-3 w-3 text-amber-600" aria-hidden="true" />
      <span className="text-amber-700 dark:text-amber-400 font-mono">+{Math.abs(ecart)}</span>
      <span className="text-xs text-amber-600 dark:text-amber-500">{messages.ecartPositif}</span>
    </Badge>
  );
}

function CouvertureCell({ value }: { value: number }) {
  const pct = Math.round(value);
  if (pct === 100) {
    return (
      <Badge variant="secondary" className="gap-1 font-mono">
        <CheckCircle className="h-3 w-3 text-green-600" aria-hidden="true" />
        <span className="text-green-700 dark:text-green-400">{pct}%</span>
      </Badge>
    );
  }
  if (pct >= 80) {
    return <Badge variant="secondary" className="font-mono text-amber-700 dark:text-amber-400">{pct}%</Badge>;
  }
  return <Badge variant="destructive" className="font-mono">{pct}%</Badge>;
}

export function CompletudeTable({ data, isLoading, error, versionId }: CompletudeTableProps) {
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <CardContent>{messages.loading}</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <CardContent className="text-destructive">{messages.errorGeneric}</CardContent>
      </Card>
    );
  }

  if (!data || data.parAffectation.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent className="text-muted-foreground">{messages.aucuneDonneeCouverture}</CardContent>
      </Card>
    );
  }

  const rows = useMemo(() => data.parAffectation, [data]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{messages.totalAttendu}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold font-mono">{data.attenduTotal} min</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{messages.totalPlace}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">
            {data.placeTotal} min
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{messages.totalEcart}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold font-mono text-destructive">
            {data.ecartTotal > 0 ? '−' : ''}{data.ecartTotal} min
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{messages.couvertureTotale}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold font-mono">
            <CouvertureCell value={data.couvertureTotale} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{messages.couvertureExacte}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            <Badge variant={data.couvertureExacte ? 'default' : 'destructive'}>
              {data.couvertureExacte ? messages.couvertureExacteOui : messages.couvertureExacteNon}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{messages.couverture}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{messages.colonneAffectation}</TableHead>
                  <TableHead className="text-right">{messages.colonneAttendu}</TableHead>
                  <TableHead className="text-right">{messages.colonnePlace}</TableHead>
                  <TableHead className="text-right">{messages.colonneEcart}</TableHead>
                  <TableHead className="text-right">{messages.colonneCouverture}</TableHead>
                  <TableHead className="text-right w-32">{messages.colonneActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const pct = row.attendu > 0 ? Math.round((row.place / row.attendu) * 100) : 100;
                  return (
                    <TableRow key={row.affectationKey}>
                      <TableCell className="font-medium font-mono text-sm max-w-xs truncate" title={row.affectationKey}>
                        {row.affectationKey}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.attendu} min</TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                        {row.place} min
                      </TableCell>
                      <TableCell className="text-right">
                        <EcartBadge ecart={row.ecart} />
                      </TableCell>
                      <TableCell className="text-right">
                        <CouvertureCell value={pct} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={'/versions/' + versionId + '/grille?affectationKey=' + encodeURIComponent(row.affectationKey)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {messages.btnVoirSeances}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
