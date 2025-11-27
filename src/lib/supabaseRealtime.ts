import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeTo(
  table: string, 
  callback: (payload: any) => void,
  filter?: { column: string; value: any }
): RealtimeChannel {
  // Use stable channel name based on table and filter to prevent WebSocket conflicts
  const channelId = filter 
    ? `${table}-${filter.column}-${filter.value}` 
    : `${table}-updates`;
  
  let channel = supabase
    .channel(channelId)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      },
      callback
    );
  
  return channel.subscribe();
}

export function unsubscribeFrom(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
