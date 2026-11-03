'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRepartitions } from '@/hooks/use-repartitions';
import { useDepartements, useAnnees, useSemestres } from '@/hooks/use-structure';
import { t } from '@/lib/i18n';
import type { RepartitionStatut } from '@/lib/api/repartitions';

const PAGE_SIZE = 12;

/** Libellés métier des statuts de répartition (jamais de code technique). */
const STATUT_LABELS: Record<RepartitionStatut, string> = {
  BROUILLON: t('statusDraft'),
  VALIDEE: t('statusValidated'),
  ROUVERTE: t('statusReopened'),
};

const STATUT_VARIANTS: Record<RepartitionStatut, 'secondary' | 'default' | 'outline'> = {
  BROUILLON: 'secondary',
  VALIDEE: 'default',
  ROUVERTE: 'outline',
};

export function RepartitionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<RepartitionStatut | ''>('');
  const [departementId, setDepartementId] = useState('');
  const [semestreId, setSemestreId] = useState('');

  const { data, isPending, error } = useRepartitions({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    statut: statut || undefined,
    departementId: departementId || undefined,
    semestreId: semestreId || undefined,
  });

  const { data: annees } = useAnnees({ limit: 100 });
  const anneeActive = annees?.find((a) => a.statut === 'ACTIVE') ?? annees?.[0];
  // Les départements sont rattachés à une année : on Restreint la liste à l'année active
  // pour éviter des libellés dupliqués (un même code par année).
  const { data: departements } = useDepartements({
    limit: 100,
    anneeId: anneeActive?.id,
    enabled: !!anneeActive,
  });
  const { data: semestres } = useSemestres({ anneeId: anneeActive?.id });

  const repartitions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  /** Réinitialise la pagination : tout changement de filtre ramène à la page 1. */
  const resetPage = () => setPage(1);

  const handleStatutChange = (value: string | null) => {
    setStatut((value ?? '') as RepartitionStatut | '');
    resetPage();
  };

  const handleDepartementChange = (value: string | null) => {
    setDepartementId(value ?? '');
    resetPage();
  };

  const handleSemestreChange = (value: string | null) => {
    setSemestreId(value ?? '');
    resetPage();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="repartitions-search" className="text-xs font-medium">
            {t('repartitionsSearch')}
          </Label>
          <Input
            id="repartitions-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder={t('repartitionsSearchPlaceholder')}
            className="w-72"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{t('departement')}</Label>
          <Select value={departementId} onValueChange={handleDepartementChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('repartitionsAllDepartements')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('repartitionsAllDepartements')}</SelectItem>
              {departements?.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{t('semestre')}</Label>
          <Select value={semestreId} onValueChange={handleSemestreChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('repartitionsAllSemestres')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('repartitionsAllSemestres')}</SelectItem>
              {semestres?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  S{s.numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{t('statut')}</Label>
          <Select value={statut} onValueChange={handleStatutChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('repartitionsAllStatuts')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('repartitionsAllStatuts')}</SelectItem>
              <SelectItem value="BROUILLON">{STATUT_LABELS.BROUILLON}</SelectItem>
              <SelectItem value="VALIDEE">{STATUT_LABELS.VALIDEE}</SelectItem>
              <SelectItem value="ROUVERTE">{STATUT_LABELS.ROUVERTE}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('repartitionsError')}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('repartitionsColumnLibelle')}</TableHead>
              <TableHead>{t('departement')}</TableHead>
              <TableHead>{t('repartitionsColumnSemestre')}</TableHead>
              <TableHead>{t('repartitionsColumnStatut')}</TableHead>
              <TableHead className="text-right">
                {t('repartitionsColumnActions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('chargement')}
                </TableCell>
              </TableRow>
            ) : repartitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('repartitionsEmpty')}
                </TableCell>
              </TableRow>
            ) : (
              repartitions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.libelle ?? r.departementCode ?? '—'}
                  </TableCell>
                  <TableCell>
                    {r.departementLibelle ?? r.departementCode ?? '—'}
                  </TableCell>
                  <TableCell>
                    {r.semestreNumero ? `S${r.semestreNumero}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUT_VARIANTS[r.statut]}>
                      {STATUT_LABELS[r.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/repartitions/${r.id}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      {t('repartitionsViewAffectations')}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t('repartitionsTotal').replace('{count}', String(total))}
          {totalPages > 0 && (
            <>
              {' — '}
              {t('pageNumber')
                .replace('{page}', String(page))
                .replace('{total}', String(totalPages))}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label={t('pagePrecedente')}
          >
            {t('pagePrecedente')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label={t('pageSuivante')}
          >
            {t('pageSuivante')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RepartitionsTable;