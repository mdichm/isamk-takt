'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CircuitParams } from '@/components/admin/circuit-params';
import { getCurrentUserRole, isAdmin } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';

const queryClient = new QueryClient();

export default function CircuitPage() {
  const role = getCurrentUserRole();

  if (role === undefined) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  if (!isAdmin(role)) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold">{messages.error}</h1>
        <p className="text-muted-foreground">{messages.errorForbidden}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CircuitParams />
    </QueryClientProvider>
  );
}
