'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VersionBadge } from '@/components/versions/version-badge';
import { VersionActions } from '@/components/versions/version-actions';
import {
  useVersion,
  useVersionAvertissements,
} from '@/hooks/use-version';
import { getCurrentUserRole, type UserRole } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';

export default function VersionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.versionIdentifiantManquant}
        </p>
      </div>
    );
  }

  return <VersionPageContent versionId={id} />;
}

function VersionPageContent({ versionId }: { versionId: string }) {
  const role = getCurrentUserRole() as UserRole | undefined;
  const {
    data: version,
    isLoading,
    error,
  } = useVersion(versionId);
  const { data: avertissementsNonAcceptes } =
    useVersionAvertissements(versionId);

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{messages.chargementVersion}</p>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error ?? 'Erreur'}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.versionChargementImpossible}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            {messages.versionTitre} {version.numero}
          </CardTitle>
          <div className="flex items-center gap-2">
            <VersionBadge statut={version.statut} />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            {messages.versionDerniereModification}:
            {new Date(version.updatedAt).toLocaleString('fr-FR')}
          </p>
          {avertissementsNonAcceptes !== undefined && avertissementsNonAcceptes > 0 && (
            <p className="mt-2 text-sm text-orange-900 dark:text-orange-400 font-medium">
              {messages.versionAvertissementsNonAcceptees}:
              {avertissementsNonAcceptes}
            </p>
          )}
          <div className="mt-6">
            <VersionActions
              version={{ id: version.id, numero: version.numero, statut: version.statut }}
              role={role}
              avertissementsNonAcceptes={avertissementsNonAcceptes}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
