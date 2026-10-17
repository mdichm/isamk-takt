'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listSecurityEvents,
  purgeJournals,
  type SecurityEventDto,
  type SecurityEventQuery,
} from '@/lib/api/security';
import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole, isAdmin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SecurityEventsPage() {
  const role = getCurrentUserRole();

  // Tous les hooks doivent être appelés inconditionnellement avant tout early return
  const [events, setEvents] = useState<SecurityEventDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [filters, setFilters] = useState<SecurityEventQuery>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadEvents = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      const result = await listSecurityEvents({ ...filters, cursor, limit: 50 });
      setEvents((prev) => cursor ? [...prev, ...result.data] : result.data);
      setNextCursor(result.nextCursor);
    } catch {
      setMessage({ type: 'error', text: messages.errorLoadSecurityEvents });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onPurge = async () => {
    if (!window.confirm(messages.purgeConfirmMessage)) return;
    setPurging(true);
    setMessage(null);
    try {
      await purgeJournals();
      setMessage({ type: 'success', text: messages.purgeSuccess });
      setEvents([]);
      setNextCursor(null);
      loadEvents();
    } catch {
      setMessage({ type: 'error', text: messages.purgeError });
    } finally {
      setPurging(false);
    }
  };

  if (role === undefined) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  if (!isAdmin(role)) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold">{messages.error}</h1>
        <p className="text-muted-foreground">{messages.errorForbidden}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{messages.journalTitle}</h1>
          <p className="text-muted-foreground">{messages.journalSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onPurge} disabled={purging} variant="destructive">
            {purging ? 'Purge en cours...' : messages.btnPurge}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>{message.text}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.colEventType}</label>
          <Input
            value={filters.type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value || undefined }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.colEventUser}</label>
          <Input
            value={filters.userId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value || undefined }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">De</label>
          <Input
            type="datetime-local"
            value={filters.from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
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
          onClick={() => loadEvents(nextCursor)}
          disabled={loading}
          className="w-full"
        >
          Charger plus
        </Button>
      )}
    </div>
  );
}
