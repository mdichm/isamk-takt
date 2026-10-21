'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SnapshotDetail } from '@/components/snapshots/SnapshotDetail';

export default function RepartitionSnapshotDetailPage({
  params,
}: { params: { id: string; snapshotId: string } }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <SnapshotDetail
          repartitionId={params.id}
          snapshotId={params.snapshotId}
        />
      </div>
    </QueryClientProvider>
  );
}
