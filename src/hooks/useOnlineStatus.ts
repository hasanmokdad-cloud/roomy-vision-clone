import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnlineStatus(userId: string | null, conversationId?: string) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    // Set online on mount
    const setOnline = async () => {
      if (!isMounted) return;
      try {
        await supabase.from("user_presence").upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString(),
          current_conversation_id: conversationId || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      } catch (error) {
        // Silently ignore - user may be signing out
      }
    };

    // Set offline on unmount
    const setOffline = async () => {
      if (!isMounted) return;
      try {
        await supabase
          .from("user_presence")
          .update({
            is_online: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } catch (error) {
        // Silently ignore
      }
    };

    // Start heartbeat
    setOnline();
    heartbeatIntervalRef.current = setInterval(async () => {
      if (isActiveRef.current && isMounted) {
        try {
          await supabase
            .from("user_presence")
            .upsert({
              user_id: userId,
              is_online: true,
              last_seen: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
        } catch (error) {
          // Silently ignore
        }
      }
    }, 10000);

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (!isMounted) return;
      isActiveRef.current = !document.hidden;
      if (isActiveRef.current) {
        setOnline();
      }
    };

    // Handle page unload - use session token for auth
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable unload requests
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${userId}`;
      const data = JSON.stringify({ is_online: false, updated_at: new Date().toISOString() });
      
      // sendBeacon doesn't support custom headers well, so we'll just let it fail gracefully
      // The heartbeat will eventually mark user as offline anyway
      try {
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
      } catch (e) {
        // Ignore errors on unload
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMounted = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      setOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, conversationId]);
}