import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineIndicatorProps {
  userId: string;
  className?: string;
}

export function OnlineIndicator({ userId, className = "" }: OnlineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadOnlineStatus();

    // Subscribe to realtime presence updates
    const channel = supabase
      .channel(`presence-${userId}`)
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
            setIsOnline(payload.new.is_online && diffSeconds < 20);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadOnlineStatus = async () => {
    const { data } = await supabase
      .from("user_presence")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      const lastSeen = new Date(data.last_seen);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
      setIsOnline(data.is_online && diffSeconds < 20);
    }
  };

  if (!isOnline) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full ${className}`}
      aria-label="Online"
    />
  );
}