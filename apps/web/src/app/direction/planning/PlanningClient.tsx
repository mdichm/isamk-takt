// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Composant client interactif de la page Planning Direction (L5-29)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import {
  fetchDirectionSeances,
  type DirectionSeance,
} from '@/lib/api/direction';
import { Button } from '@/components/ui/button';

const ROLE_DIRECTION = 'DIRECTION';

interface PlanningClientProps {
  initialVersionId: string | null;
  versions: Array<{ id: string; numero: string; statut: string }>;
}

export function PlanningClient({
  initialVersionId,
  versions,
}: PlanningClientProps) {
  const { role } = useAuth();
  const router = useRouter();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    initialVersionId,
  );
  const [page, setPage] = useState(1);

  if (role !== ROLE_DIRECTION) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('planningPublieArchivé')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const seancesQuery = useQuery({
    queryKey: ['direction-seances', selectedVersionId, page],
    queryFn: () =>
      selectedVersionId
        ? fetchDirectionSeances(selectedVersionId, { page, limit: 20 })
        : Promise.resolve({
            data: [] as DirectionSeance[],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          }),
    enabled: !!selectedVersionId,
    staleTime: 30_000,
  });

  const error = seancesQuery.error;
  const data = seancesQuery.data;
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('planningPublieArchivé')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('erreurChargementTableauDeBord')}
        </div>
      </div>
    );
  }

  const seances: DirectionSeance[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div>
      {versions.length === 0 && !selectedVersionId && (
        <div className="p-4 rounded bg-muted/50 border text-muted-foreground text-sm">
          {t('aucuneVersionPubliee')}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('selectionnerVersion')}</h2>
        <div className="flex flex-wrap gap-3">
          {versions.map((v) => {
            const isSelected = selectedVersionId === v.id;
            return (
              <Button
                key={v.id}
                onClick={() => {
                  setSelectedVersionId(v.id);
                  setPage(1);
                  router.replace(
                    '/direction/planning?versionId=' +
                      encodeURIComponent(v.id),
                  );
                }}
                variant={isSelected ? 'default' : 'outline'}
              >
                {v.numero} ({v.statut})
              </Button>
            );
          })}
        </div>
      </div>

      {selectedVersionId && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('seancesVersion')}</h2>
            <span className="text-sm text-muted-foreground">
              {total} séance(s) trouvée(s)
            </span>
          </div>

          {seancesQuery.isLoading ? (
            <div className="p-4 text-muted-foreground">{t('chargement')}</div>
          ) : seances.length === 0 ? (
            <div className="p-4 rounded bg-muted/50 border text-muted-foreground text-sm">
              {t('aucuneSeance')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm font-semibold text-muted-foreground">
                    <th className="p-3">{t('jour')}</th>
                    <th className="p-3">{t('creneau')}</th>
                    <th className="p-3">{t('enseignant')}</th>
                    <th className="p-3">{t('salle')}</th>
                    <th className="p-3">{t('groupe')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seances.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{s.jour}</td>
                      <td className="p-3">{String(s.rang)}</td>
                      <td className="p-3">
                        {s.enseignantId ?? t('nonRenseigne')}
                      </td>
                      <td className="p-3">{s.salleId ?? t('nonRenseigne')}</td>
                      <td className="p-3">{s.affectationKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                {t('precedent')}
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                {t('suivant')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
