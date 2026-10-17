'use client';

import { useState, useEffect } from 'react';
import {
  listSecurityEvents,
  purgeJournals,
  type SecurityEventDto,
  type SecurityEventQuery,
} from '@/lib/api/security';
import { messages } from '@/lib/messages/fr';

export function useSecurityEvents() {
  const [events, setEvents] = useState<SecurityEventDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [filters, setFilters] = useState<SecurityEventQuery>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadEvents(cursor?: string) {
    try {
      setLoading(true);
      const result = await listSecurityEvents({ ...filters, cursor, limit: 50 });
      setEvents((prev) => (cursor ? [...prev, ...result.data] : result.data));
      setNextCursor(result.nextCursor);
    } catch {
      setMessage({ type: 'error', text: messages.errorLoadSecurityEvents });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [filters]);

  async function handlePurge() {
    if (!window.confirm(messages.purgeConfirmMessage)) return;
    setPurging(true);
    setMessage(null);
    try {
      await purgeJournals();
      setMessage({ type: 'success', text: messages.purgeSuccess });
      setEvents([]);
      setNextCursor(null);
      await loadEvents();
    } catch {
      setMessage({ type: 'error', text: messages.purgeError });
    } finally {
      setPurging(false);
    }
  }

  return {
    events,
    nextCursor,
    loading,
    purging,
    filters,
    setFilters,
    message,
    loadEvents,
    handlePurge,
  };
}