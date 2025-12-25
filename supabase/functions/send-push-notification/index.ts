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

// Web Push utilities
async function generateVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  // Parse the endpoint URL to get the audience
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // Create JWT claims
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: 'mailto:support@roomylb.com'
  };
  
  // Base64URL encode helper
  const base64urlEncode = (data: Uint8Array | string): string => {
    const str = typeof data === 'string' 
      ? btoa(data) 
      : btoa(String.fromCharCode(...data));
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key for signing
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${encodedSignature}`;
  
  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey
  };
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

        // Build headers for web push
        const headers: Record<string, string> = {
          'Content-Type': 'application/octet-stream',
          'TTL': '86400',
          'Content-Encoding': 'aes128gcm'
        };

        // Add VAPID authorization if keys are configured
        if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
          try {
            const vapidAuth = await generateVapidAuthHeader(
              subscription.endpoint,
              VAPID_PUBLIC_KEY,
              VAPID_PRIVATE_KEY
            );
            headers['Authorization'] = vapidAuth.authorization;
            headers['Crypto-Key'] = `p256ecdsa=${vapidAuth.cryptoKey}`;
          } catch (vapidErr) {
            console.error('[send-push-notification] VAPID auth error:', vapidErr);
          }
        }

        // For now, send unencrypted payload (production should use web-push encryption)
        // Note: Full web push encryption requires additional crypto operations
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400'
          },
          body: notificationPayload
        });

        if (response.ok || response.status === 201) {
          sent++;
          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          console.error('[send-push-notification] Push failed:', response.status, response.statusText);
          failed++;
          
          // Remove invalid subscriptions (410 Gone or 404 Not Found)
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log('[send-push-notification] Removed invalid subscription:', subscription.id);
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
