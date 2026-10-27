// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page Exports officiels de l'espace Direction (L5-29)
'use client';

export const dynamic = 'force-dynamic';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import { fetchDirectionExports, type DirectionExport } from '@/lib/api/direction';
import Link from 'next/link';

const ROLE_DIRECTION = 'DIRECTION';

export default function ExportsPage() {
  const { role } = useAuth();

  if (role !== ROLE_DIRECTION) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('exportsDirection')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery<DirectionExport[], Error>({
    queryKey: ['direction-exports'],
    queryFn: () => fetchDirectionExports(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('exportsDirection')}</h1>
        <p className="text-muted-foreground">{t('chargement')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('exportsDirection')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('erreurChargementTableauDeBord')}
        </div>
      </div>
    );
  }

  const items = data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('exportsDirection')}</h1>
          <p className="text-muted-foreground">
            {t('exportsDirectionDescription')}
          </p>
        </div>
        <Link href="/direction" className="text-sm text-primary hover:underline">
          ← {t('retourAccueil')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded bg-muted/50 border text-muted-foreground text-sm">
          {t('aucunExport')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((e) => (
            <div key={e.id} className="p-4 rounded border">
              <h3 className="font-semibold mb-1">{e.libelle}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {e.description}
              </p>
              <div className="flex items-center gap-2 text-xs mb-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {e.format}
                </span>
                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  {e.disponible ? t('disponible') : t('indisponible')}
                </span>
              </div>
              <ButtonLink href={`/direction/exports/${e.id}`}>
                {t('telecharger')}
              </ButtonLink>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
