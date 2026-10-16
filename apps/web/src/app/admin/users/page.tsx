'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersTable } from '@/components/admin/users-table';
import { UserFormDialog } from '@/components/admin/user-form-dialog';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole, isAdmin } from '@/lib/auth';

const queryClient = new QueryClient();

export default function AdminUsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{messages.users}</h1>
            <p className="text-muted-foreground">
              Gestion des comptes, rôles, portées et activation des utilisateurs.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} className="mr-2" />
            {messages.create} {messages.userSingular ?? 'utilisateur'}
          </Button>
        </div>

        <UsersTable />

        <UserFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => {
            // Le UsersTable se rechargera via React Query invalidation
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
