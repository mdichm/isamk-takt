import { Suspense } from 'react';
import { messages } from '@/lib/messages/fr';
import { ContraintesPageClient } from '@/components/contraintes/contraintes-page-client';

export default function ContraintesPage({
  searchParams,
}: {
  searchParams: { semestreId?: string };
}) {
  const semestreId = searchParams.semestreId ?? undefined;

  return (
    <Suspense fallback={<div>{messages.loading}</div>}>
      <ContraintesPageClient semestreId={semestreId} />
    </Suspense>
  );
}