// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page d'accueil de l'espace Direction (L5-29)
// Lecture seule : plannings publiés/archivés, répartition, charges, contraintes, audit, exports officiels.
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import { fetchDirectionVersions } from '@/lib/api/direction';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ROLE_DIRECTION = 'DIRECTION';

export default function DirectionPage() {
  const { role } = useAuth();

  if (role !== ROLE_DIRECTION) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('espaceDirection')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const { data: versions, isLoading, error } = useQuery({
    queryKey: ['direction-versions'],
    queryFn: fetchDirectionVersions,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('espaceDirection')}</h1>
        <p className="text-muted-foreground">{t('chargement')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('espaceDirection')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('erreurChargementTableauDeBord')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('espaceDirection')}</h1>
          <p className="text-muted-foreground">
            {t('espaceDirectionSousTitre')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-4 rounded border bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="font-semibold mb-2">{t('versionsPubliees')}</h3>
          <p className="text-sm text-muted-foreground">
            {versions?.length ?? 0} version(s) publiée(s) ou archivée(s)
          </p>
        </div>
        <div className="p-4 rounded border bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="font-semibold mb-2">{t('planning')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('planningDescription')}
          </p>
        </div>
        <div className="p-4 rounded border bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="font-semibold mb-2">{t('exportsDirection')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('exportsDirectionDescription')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">{t('versionsPublieesArchivées')}</h2>
        {versions && versions.length > 0 ? (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <span className="font-medium">{v.numero}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {v.statut}
                  </span>
                </div>
                <Link
                  href={`/direction/planning?versionId=${v.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('voirPlanning')}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t('aucuneVersionPubliee')}
          </p>
        )}
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">{t('navigationRapide')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/direction/planning" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('planningPublieArchivé')}
          </Link>
          <Link href="/direction/repartitions" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('repartitions')}
          </Link>
          <Link href="/direction/charges" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('charges')}
          </Link>
          <Link href="/direction/contraintes" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('contraintes')}
          </Link>
          <Link href="/direction/audit" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('audit')}
          </Link>
          <Link href="/direction/exports" className="flex items-center gap-2 px-4 py-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
            {t('exportsDirection')}
          </Link>
        </div>
      </div>
    </div>
  );
}
