import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export function subscribeTo(
  table: string, 
  callback: (payload: any) => void,
  filter?: { column: string; value: any },
  event: RealtimeEvent = '*'
): RealtimeChannel {
  // Use stable channel name based on table, filter, and event to prevent WebSocket conflicts
  const channelId = filter 
    ? `${table}-${filter.column}-${filter.value}-${event}` 
    : `${table}-${event}-updates`;
  
  const filterString = filter ? `${filter.column}=eq.${filter.value}` : undefined;
  
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes' as const,
      {
        event: event,
        schema: 'public',
        table: table,
        ...(filterString && { filter: filterString })
      } as any,
      callback
    );
  
  return channel.subscribe();
}

export function unsubscribeFrom(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
