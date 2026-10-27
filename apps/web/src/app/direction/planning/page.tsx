// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page Planning de l'espace Direction (L5-29)
// Consultation des séances des versions publiées / archivées.
// Server Component : récupère les versions côté serveur, délègue l'interactivité à PlanningClient.
import { PlanningClient } from './PlanningClient';
import { fetchDirectionVersions, type DirectionVersion } from '@/lib/api/direction';
import Link from 'next/link';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const versionIdParam = (params.versionId as string | undefined) ?? null;

  const versions: DirectionVersion[] = await fetchDirectionVersions();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('planningPublieArchivé')}</h1>
          <p className="text-muted-foreground">{t('planningDescription')}</p>
        </div>
        <Link href="/direction" className="text-sm text-primary hover:underline">
          ← {t('retourAccueil')}
        </Link>
      </div>

      <PlanningClient
        initialVersionId={versionIdParam}
        versions={versions}
      />
    </div>
  );
}
