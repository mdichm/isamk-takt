'use client';

import { useState } from 'react';
import { useUsers, useToggleUserActive } from '@/hooks/use-users';
import { useToast } from '@/components/ui/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { messages } from '@/lib/messages/fr';
import { UserDto, UserQuery } from '@/lib/api/users';

const ROLE_OPTIONS = [
  { value: 'ADMINISTRATEUR', label: messages.roleAdmin },
  { value: 'GESTIONNAIRE', label: messages.roleManager },
  { value: 'RESPONSABLE_DEPARTEMENT', label: messages.roleDepartmentHead },
  { value: 'ENSEIGNANT', label: messages.roleTeacher },
  { value: 'DIRECTION', label: messages.roleDirection },
  { value: 'ETUDIANT', label: messages.roleStudent },
];

function primaryRole(u: UserDto): string {
  return u.roles?.[0]?.role ?? '—';
}

export function UsersTable() {
  const [query, setQuery] = useState<UserQuery>({ page: 1, limit: 10 });
  const { data, isPending, error } = useUsers(query);
  const toggleMutation = useToggleUserActive();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: (error as Error).message || messages.errorFetchUsers,
      variant: 'destructive',
    });
  }

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleToggle = (u: UserDto) =>
    toggleMutation.mutate({ id: u.id, isActive: !u.actif });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{messages.users}</h1>
        <p className="text-muted-foreground">
          Gestion des comptes, rôles, portées et activation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{messages.search}</Label>
          <Input
            value={query.search ?? ''}
            onChange={(e) =>
              setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))
            }
            placeholder={messages.search}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{messages.role}</Label>
          <Select
            value={query.role ?? ''}
            onValueChange={(v) =>
              setQuery((q) => ({ ...q, role: v || undefined, page: 1 }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{messages.columnStatus}</Label>
          <Select
            value={query.actif === true ? 'true' : query.actif === false ? 'false' : ''}
            onValueChange={(v) =>
              setQuery((q) => ({
                ...q,
                actif: v === '' ? undefined : v === 'true',
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="true">{messages.active}</SelectItem>
              <SelectItem value="false">{messages.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{messages.columnName}</TableHead>
              <TableHead>{messages.columnEmail}</TableHead>
              <TableHead>{messages.columnRole}</TableHead>
              <TableHead>{messages.columnDepartment}</TableHead>
              <TableHead>{messages.columnStatus}</TableHead>
              <TableHead className="text-right">{messages.columnActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {messages.noUsers}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.nom} {u.prenom}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{primaryRole(u)}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.roles?.[0]?.departementCode ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.actif ? 'default' : 'destructive'}>
                      {u.actif ? messages.active : messages.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleToggle(u)}
                      variant="outline"
                    >
                      {u.actif ? messages.btnDeactivate : messages.btnActivate}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={(query.page ?? 1) === 1 || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}
            >Précédent</Button>
            <span className="text-xs text-muted-foreground">
              {query.page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={(query.page ?? 1) >= totalPages || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
            >Suivant</Button>
          </div>
        </div>
      )}
    </div>
  );
}
