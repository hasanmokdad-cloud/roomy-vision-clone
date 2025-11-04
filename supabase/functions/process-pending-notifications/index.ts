import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log("Processing pending notifications...");

  try {
    // Fetch pending notifications (including failed ones with retry count < 3)
    const { data: pendingNotifications, error } = await supabase
      .from("notifications_log")
      .select("*")
      .or("status.eq.pending,and(status.eq.failed,retry_count.lt.3)")
      .order("sent_at", { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`Found ${pendingNotifications?.length || 0} pending notifications`);

    const results = [];

    // Process each notification
    for (const notification of pendingNotifications || []) {
      try {
        // Call the send-owner-notification function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-owner-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ notificationId: notification.id }),
          }
        );

        const result = await response.json();
        
        if (response.ok) {
          console.log(`Successfully sent notification ${notification.id}`);
          results.push({ id: notification.id, status: "sent" });
        } else {
          console.error(`Failed to send notification ${notification.id}:`, result);
          results.push({ id: notification.id, status: "failed", error: result.error });
        }
      } catch (err: any) {
        console.error(`Error processing notification ${notification.id}:`, err);
        results.push({ id: notification.id, status: "error", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing notifications:", error);
    
    // Create client for error logging
    const logClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Log to security_logs
    try {
      await logClient.from("security_logs").insert({
        event_type: "notification_processing_error",
        severity: "error",
        message: "Error in process-pending-notifications",
        details: {
          error: error.message,
          stack: error.stack?.substring(0, 500)
        }
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred while processing notifications." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
