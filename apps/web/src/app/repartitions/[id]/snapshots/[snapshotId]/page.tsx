'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use, useState } from 'react';
import { SnapshotDetail } from '@/components/snapshots/SnapshotDetail';

export default function RepartitionSnapshotDetailPage({
  params,
}: { params: Promise<{ id: string; snapshotId: string }> }) {
  // En Next.js 15+, `params` est une Promise : elle doit être déballée via `use()`.
  const { id, snapshotId } = use(params);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <SnapshotDetail
          repartitionId={id}
          snapshotId={snapshotId}
        />
      </div>
    </QueryClientProvider>
  );
}
