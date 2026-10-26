'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VersionBadge } from '@/components/versions/version-badge';
import { VersionActions } from '@/components/versions/version-actions';
import { listAvertissementsConflits } from '@/lib/api/conflits';
import { findVersionById, type Version } from '@/lib/api/versions';
import { getCurrentUserRole, type UserRole } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';

interface VersionPageData {
  version: Version | null;
  role: UserRole | undefined;
  avertissementsNonAcceptes: number | undefined;
  loading: boolean;
  error: string | null;
}

export default function VersionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [data, setData] = useState<VersionPageData>({
    version: null,
    role: undefined,
    avertissementsNonAcceptes: undefined,
    loading: true,
    error: null,
  });

  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          Identifiant de version manquant.
        </p>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setData((d) => ({ ...d, loading: true, error: null }));
      try {
        const [version, role] = await Promise.all([
          findVersionById(id),
          Promise.resolve(getCurrentUserRole()),
        ]);
        const avertissements = await listAvertissementsConflits(id);
        if (!cancelled) {
          setData({
            version,
            role,
            avertissementsNonAcceptes: avertissements.length,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (!cancelled) {
          setData((d) => ({
            ...d,
            loading: false,
            error: 'Impossible de charger la version.',
          }));
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data.loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Chargement de la version…</p>
      </div>
    );
  }

  if (data.error || !data.version) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error ?? 'Erreur'}</h1>
        <p className="mt-2 text-muted-foreground">
          {data.error ?? 'Version introuvable.'}
        </p>
      </div>
    );
  }

  const { version, role, avertissementsNonAcceptes } = data;

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
