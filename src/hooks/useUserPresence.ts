import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserPresence {
  isOnline: boolean;
  lastSeen: Date | null;
}

export function useUserPresence(userId: string | null): UserPresence {
  const [presence, setPresence] = useState<UserPresence>({
    isOnline: false,
    lastSeen: null,
  });

  useEffect(() => {
    if (!userId) return;

    const loadPresence = async () => {
      const { data } = await supabase
        .from("user_presence")
        .select("is_online, last_seen")
        .eq("user_id", userId)
        .single();

      if (data) {
        const lastSeen = new Date(data.last_seen);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
        setPresence({
          isOnline: data.is_online && diffSeconds < 20,
          lastSeen,
        });
      }
    };

    loadPresence();

    // Subscribe to realtime presence updates
    const channel = supabase
      .channel(`user-presence-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            const lastSeen = new Date(payload.new.last_seen);
            const now = new Date();
            const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
            setPresence({
              isOnline: payload.new.is_online && diffSeconds < 20,
              lastSeen,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return presence;
}
