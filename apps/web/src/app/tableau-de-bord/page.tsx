// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page du tableau de bord (L5-27 / L5-28)
// Accès : GESTIONNAIRE, ADMINISTRATEUR, RESPONSABLE_DEPARTEMENT, DIRECTION

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/shell/AuthProvider';
import { fetchTableauDeBord, type TableauDeBordResponse } from '@/lib/api/tableau-de-bord';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import { TableauDeBordHeader } from '@/components/tableau-de-bord/TableauDeBordHeader';
import { RepartitionsBloc } from '@/components/tableau-de-bord/RepartitionsBloc';
import { PreparationBloc } from '@/components/tableau-de-bord/PreparationBloc';
import { GenerationsBloc } from '@/components/tableau-de-bord/GenerationsBloc';
import { VersionPublieeBloc } from '@/components/tableau-de-bord/VersionPublieeBloc';
import { ChangementsBloc } from '@/components/tableau-de-bord/ChangementsBloc';
import { ActionsPrioritairesBloc } from '@/components/tableau-de-bord/ActionsPrioritairesBloc';
import { ValidationsEnAttenteBloc } from '@/components/tableau-de-bord/ValidationsEnAttenteBloc';
import { ChargesEnseignantsBloc } from '@/components/tableau-de-bord/ChargesEnseignantsBloc';
import { ValidationsResponsableBloc } from '@/components/tableau-de-bord/ValidationsResponsableBloc';
import { DemandesDepartementBloc } from '@/components/tableau-de-bord/DemandesDepartementBloc';
import { DirectionBloc } from '@/components/tableau-de-bord/DirectionBloc';

// Clés de cache React Query
export const tableauDeBordKeys = {
  all: ['tableau-de-bord'] as const,
  detail: (semestreId?: string) => [...tableauDeBordKeys.all, 'detail', semestreId ?? 'actif'] as const,
};

const ROLES_GESTION = ['GESTIONNAIRE', 'ADMINISTRATEUR'];

export function TableauDeBordPageContent({
  data,
  isLoading,
  error,
}: {
  data: TableauDeBordResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('tableauDeBord')}</h1>
        <p className="text-muted-foreground">{t('chargementTableauDeBord')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('tableauDeBord')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('erreurChargementTableauDeBord')}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('recharger')}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('tableauDeBord')}</h1>
        <p className="text-muted-foreground">{t('aucuneDonnee')}</p>
      </div>
    );
  }

  const estResponsable = data.role === 'RESPONSABLE_DEPARTEMENT';
  const estDirection = data.role === 'DIRECTION';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('tableauDeBord')}</h1>
          <p className="text-muted-foreground">{t('sousTitreTableauDeBord')}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('recharger')}
        </Button>
      </div>

      <TableauDeBordHeader contexte={data.contexte} />

      {/* Blocs Gestionnaire / Administrateur */}
      {!estResponsable && !estDirection && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.repartitions && (
              <RepartitionsBloc repartitions={data.repartitions} />
            )}
            {data.preparation && (
              <PreparationBloc preparation={data.preparation} />
            )}
            {data.generations && (
              <GenerationsBloc generations={data.generations} />
            )}
            {data.versionPubliee !== undefined && (
              <VersionPublieeBloc versionPubliee={data.versionPubliee} />
            )}
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.changements && (
              <ChangementsBloc changements={data.changements} />
            )}
            {data.validationsEnAttente && (
              <ValidationsEnAttenteBloc validations={data.validationsEnAttente} />
            )}
          </div>

          <Separator className="my-6" />

          {data.actionsPrioritaires && (
            <ActionsPrioritairesBloc actions={data.actionsPrioritaires} />
          )}
        </>
      )}

      {/* Blocs Responsable de département */}
      {estResponsable && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.repartitions && (
              <RepartitionsBloc repartitions={data.repartitions} />
            )}
            {data.responsable?.charges && (
              <ChargesEnseignantsBloc charges={data.responsable.charges} />
            )}
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.responsable?.validations && (
              <ValidationsResponsableBloc validations={data.responsable.validations} />
            )}
            {data.responsable?.demandes && (
              <DemandesDepartementBloc demandes={data.responsable.demandes} />
            )}
          </div>
        </>
      )}

      {/* Blocs Direction */}
      {estDirection && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.direction && <DirectionBloc direction={data.direction} />}
          </div>
        </>
      )}
    </div>
  );
}

export default function TableauDeBordPage() {
  const { role } = useAuth();

  const peutVoir =
    ROLES_GESTION.includes(role ?? '') ||
    role === 'RESPONSABLE_DEPARTEMENT' ||
    role === 'DIRECTION';

  if (!peutVoir) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('tableauDeBord')}</h1>
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {t('accesRefuseTableauDeBord')}
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery<TableauDeBordResponse, Error>({
    queryKey: tableauDeBordKeys.detail(undefined),
    queryFn: () => fetchTableauDeBord(undefined, false),
    staleTime: 30_000,
  });

  return <TableauDeBordPageContent data={data} isLoading={isLoading} error={error} />;
}
