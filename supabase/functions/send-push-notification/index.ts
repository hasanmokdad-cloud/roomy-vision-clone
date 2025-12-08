import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  actions?: Array<{ action: string; title: string }>;
}

// Rate limiting: 20 requests per minute per IP (burst notifications)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  
  entry.count++;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  // Check rate limit
  if (isRateLimited(clientIP)) {
    console.log(`[send-push-notification] Rate limit exceeded for IP: ${clientIP}`);
    
    // Log rate limit event
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseAdmin.from('security_events').insert({
        event_type: 'rate_limit_exceeded',
        ip_address: clientIP,
        endpoint: 'send-push-notification',
        metadata: { limit: RATE_LIMIT, window_ms: RATE_LIMIT_WINDOW_MS }
      });
    } catch (e) {
      console.error('Failed to log rate limit event:', e);
    }
    
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushPayload = await req.json();
    const { user_id, title, body, url, icon, actions } = payload;

    console.log('[send-push-notification] Sending to user:', user_id);

    // Fetch user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-push-notification] No subscriptions found for user');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-push-notification] Found ${subscriptions.length} subscriptions`);

    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      throw new Error('VAPID keys not configured');
    }

    // Send to all subscriptions
    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth_key
          }
        };

        const notificationPayload = JSON.stringify({
          title,
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          url: url || '/',
          actions: actions || []
        });

        // Use web-push library (would need to add to Deno)
        // For now, we'll use fetch to send directly
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400'
          },
          body: notificationPayload
        });

        if (response.ok) {
          sent++;
          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          console.error('[send-push-notification] Push failed:', response.statusText);
          failed++;
          
          // Remove invalid subscriptions (410 Gone)
          if (response.status === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
        }
      } catch (error: any) {
        console.error('[send-push-notification] Error sending to subscription:', error);
        failed++;
      }
    }

    console.log(`[send-push-notification] Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-push-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
