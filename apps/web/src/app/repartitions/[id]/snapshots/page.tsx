'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use, useState } from 'react';
import { SnapshotList } from '@/components/snapshots/SnapshotList';
import { messages } from '@/lib/messages/fr';

export default function RepartitionSnapshotsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  // En Next.js 15+, `params` est une Promise : elle doit être déballée via `use()`.
  const { id } = use(params);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{messages.snapshots}</h1>
        <p className="text-muted-foreground mb-6">
          {messages.snapshotsSubtitle}
        </p>
        <SnapshotList repartitionId={id} />
      </div>
    </QueryClientProvider>
  );
}
