// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page Audit de l'espace Direction (L5-29)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import {
  fetchDirectionAudit,
  type PaginatedAudit,
} from '@/lib/api/direction';
import Link from 'next/link';

const ROLE_DIRECTION = 'DIRECTION';

export default function AuditPage() {
  const { role } = useAuth();

  if (role !== ROLE_DIRECTION) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('audit')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery<PaginatedAudit, Error>({
    queryKey: ['direction-audit'],
    queryFn: () => fetchDirectionAudit(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('audit')}</h1>
        <p className="text-muted-foreground">{t('chargement')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('audit')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('erreurChargementTableauDeBord')}
        </div>
      </div>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('audit')}</h1>
          <p className="text-muted-foreground">{t('auditDescription')}</p>
        </div>
        <Link href="/direction" className="text-sm text-primary hover:underline">
          ← {t('retourAccueil')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded bg-muted/50 border text-muted-foreground text-sm">
          {t('sansLogs')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm font-semibold text-muted-foreground">
                <th className="p-3">{t('date')}</th>
                <th className="p-3">{t('action')}</th>
                <th className="p-3">{t('objetType')}</th>
                <th className="p-3">{t('utilisateur')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{e.at}</td>
                  <td className="p-3">{e.action}</td>
                  <td className="p-3">{e.objetType}</td>
                  <td className="p-3">{e.userId ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
