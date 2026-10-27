// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page Charges de l'espace Direction (L5-29)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import {
  fetchDirectionCharges,
  type PaginatedCharges,
} from '@/lib/api/direction';
import Link from 'next/link';

const ROLE_DIRECTION = 'DIRECTION';

export default function ChargesPage() {
  const { role } = useAuth();

  if (role !== ROLE_DIRECTION) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('charges')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery<PaginatedCharges, Error>({
    queryKey: ['direction-charges'],
    queryFn: () => fetchDirectionCharges(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('charges')}</h1>
        <p className="text-muted-foreground">{t('chargement')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('charges')}</h1>
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
          <h1 className="text-2xl font-bold">{t('charges')}</h1>
          <p className="text-muted-foreground">{t('chargesDescription')}</p>
        </div>
        <Link href="/direction" className="text-sm text-primary hover:underline">
          ← {t('retourAccueil')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded bg-muted/50 border text-muted-foreground text-sm">
          {t('aucuneChargeEnseignant')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm font-semibold text-muted-foreground">
                <th className="p-3">{t('enseignant')}</th>
                <th className="p-3">{t('charge')}</th>
                <th className="p-3">{t('seuil')}</th>
                <th className="p-3">{t('ecart')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.enseignantId} className="border-b hover:bg-muted/50">
                  <td className="p-3">{c.enseignantId}</td>
                  <td className="p-3">{c.volumeBrut}</td>
                  <td className="p-3">{c.chargeReference}</td>
                  <td className="p-3">{c.ecart}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
