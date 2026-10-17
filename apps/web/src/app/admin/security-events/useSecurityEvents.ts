'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSecurityEvents,
  purgeJournals,
  type SecurityEventDto,
  type SecurityEventQuery,
} from '@/lib/api/security';
import { messages } from '@/lib/messages/fr';

export function useSecurityEvents() {
  const queryClient = useQueryClient();

  const [purging, setPurging] = useState(false);
  const [filters, setFilters] = useState<SecurityEventQuery>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allEvents, setAllEvents] = useState<SecurityEventDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data: queryData, isLoading: queryLoading } = useQuery({
    queryKey: ['securityEvents', filters],
    queryFn: async () => {
      const result = await listSecurityEvents({ ...filters, limit: 50 });
      return result;
    },
  });

  // Seed local state from initial query result (runs once)
  if (queryData && allEvents.length === 0) {
    setAllEvents(queryData.data);
    setNextCursor(queryData.nextCursor);
  }

  const events = allEvents;
  const loading = queryLoading && allEvents.length === 0;

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const result = await listSecurityEvents({ ...filters, cursor: nextCursor, limit: 50 });
      setAllEvents((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
    } catch {
      setMessage({ type: 'error', text: messages.errorLoadSecurityEvents });
    }
  };

  async function handlePurge() {
    if (!window.confirm(messages.purgeConfirmMessage)) return;
    setPurging(true);
    setMessage(null);
    try {
      await purgeJournals();
      setMessage({ type: 'success', text: messages.purgeSuccess });
      setAllEvents([]);
      setNextCursor(null);
      queryClient.invalidateQueries({ queryKey: ['securityEvents'] });
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
    loadMore,
    handlePurge,
  };
}
