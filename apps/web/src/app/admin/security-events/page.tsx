'use client';

import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole, isAdmin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSecurityEvents } from './useSecurityEvents';

export default function SecurityEventsPage() {
  const role = getCurrentUserRole();
  const {
    events,
    nextCursor,
    loading,
    purging,
    filters,
    setFilters,
    message,
    loadMore,
    handlePurge,
  } = useSecurityEvents();

  const isLoading = role === undefined || loading;

  return (
    <div className="space-y-6">
      {role === undefined ? (
        <div className="p-4"><p>{messages.loading}</p></div>
      ) : !isAdmin(role) ? (
        <div className="p-4">
          <h1 className="text-lg font-semibold">{messages.error}</h1>
          <p className="text-muted-foreground">{messages.errorForbidden}</p>
        </div>
      ) : isLoading ? (
        <div className="p-4"><p>{messages.loading}</p></div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{messages.journalTitle}</h1>
              <p className="text-muted-foreground">{messages.journalSubtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePurge} disabled={purging} variant="destructive">
                {purging ? 'Purge en cours...' : messages.btnPurge}
              </Button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-900 border border-green-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}>{message.text}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.colEventType}</label>
              <Input
                value={filters.type ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, type: e.target.value || undefined }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.colEventUser}</label>
              <Input
                value={filters.userId ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userId: e.target.value || undefined }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">De</label>
              <Input
                type="datetime-local"
                value={filters.from ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value || undefined }))
                }
              />
            </div>
          </div>

          <div className="-mt-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.colEventDate}</TableHead>
                  <TableHead>{messages.colEventType}</TableHead>
                  <TableHead>{messages.colEventUser}</TableHead>
                  <TableHead>{messages.colEventEmail}</TableHead>
                  <TableHead>{messages.colEventIp}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{new Date(event.at).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>{event.userId ?? '—'}</TableCell>
                    <TableCell>{event.email ?? '—'}</TableCell>
                    <TableCell>{event.ip ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {nextCursor && (
            <Button
              type="button"
              onClick={() => loadMore()}
              disabled={loading}
              className="w-full"
            >
              Charger plus
            </Button>
          )}
        </>
      )}
    </div>
  );
}
