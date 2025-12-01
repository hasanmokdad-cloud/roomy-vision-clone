import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnlineStatus(userId: string | null, conversationId?: string) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    // Set online on mount
    const setOnline = async () => {
      await supabase.from("user_presence").upsert({
        user_id: userId,
        is_online: true,
        last_seen: new Date().toISOString(),
        current_conversation_id: conversationId || null,
        updated_at: new Date().toISOString(),
      });
    };

    // Set offline on unmount
    const setOffline = async () => {
      await supabase
        .from("user_presence")
        .update({
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    };

    // Start heartbeat
    setOnline();
    heartbeatIntervalRef.current = setInterval(async () => {
      if (isActiveRef.current) {
        await supabase
          .from("user_presence")
          .update({
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }, 10000); // Update every 10 seconds

    // Handle page visibility
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (isActiveRef.current) {
        setOnline();
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${userId}`,
        JSON.stringify({ is_online: false, updated_at: new Date().toISOString() })
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      setOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, conversationId]);
}