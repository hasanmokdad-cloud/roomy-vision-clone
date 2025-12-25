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
  notification_type?: 'tours' | 'messages' | 'reservations' | 'social' | 'promotions' | 'admin';
}

// Rate limiting: 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

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

// Base64URL encoding/decoding utilities
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// Convert raw 65-byte public key to uncompressed format
function rawKeyToUncompressed(rawKey: Uint8Array): Uint8Array {
  if (rawKey.length === 65 && rawKey[0] === 0x04) {
    return rawKey;
  }
  if (rawKey.length === 65) {
    return rawKey;
  }
  throw new Error(`Invalid public key length: ${rawKey.length}`);
}

// Generate VAPID JWT token
async function generateVapidJWT(
  audience: string,
  vapidPrivateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:support@roomylb.com'
  };
  
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import VAPID private key (raw 32-byte format)
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  
  let cryptoKey: CryptoKey;
  try {
    if (privateKeyBytes.length === 32) {
      // Generate a temporary key pair and import with our private key
      const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign']
      );
      
      const exportedPrivate = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
      exportedPrivate.d = base64UrlEncode(privateKeyBytes);
      
      cryptoKey = await crypto.subtle.importKey(
        'jwk',
        exportedPrivate,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    } else {
      // Try PKCS8 format - convert to ArrayBuffer
      cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes.buffer as ArrayBuffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    }
  } catch (e) {
    console.error('[VAPID] Failed to import private key:', e);
    throw new Error('Invalid VAPID private key format');
  }
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert DER signature to raw format (64 bytes: 32 for r, 32 for s)
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER format - parse r and s
    rawSig = new Uint8Array(64);
    let offset = 3;
    const rLen = sigBytes[offset];
    offset++;
    const rStart = rLen === 33 ? offset + 1 : offset;
    rawSig.set(sigBytes.slice(rStart, rStart + 32), 0);
    offset += rLen + 1;
    const sLen = sigBytes[offset];
    offset++;
    const sStart = sLen === 33 ? offset + 1 : offset;
    rawSig.set(sigBytes.slice(sStart, sStart + 32), 32);
  }
  
  const encodedSignature = base64UrlEncode(rawSig);
  return `${unsignedToken}.${encodedSignature}`;
}

// Web Push Content Encryption (aes128gcm)
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Import subscriber's public key
  const subscriberPubKeyBytes = base64UrlDecode(p256dh);
  const subscriberPubKey = await crypto.subtle.importKey(
    'raw',
    rawKeyToUncompressed(subscriberPubKeyBytes).buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPubKey },
    localKeyPair.privateKey,
    256
  );
  
  // Export local public key
  const localPubKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPubKeyRaw);
  
  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Get auth secret
  const authSecret = base64UrlDecode(auth);
  
  // Derive PRK using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // auth_info = "WebPush: info" || 0x00 || ua_public || as_public
  const authInfo = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info'),
    0x00,
    ...subscriberPubKeyBytes,
    ...localPublicKey
  ]);
  
  // Import auth secret for IKM
  const authSecretKey = await crypto.subtle.importKey(
    'raw',
    authSecret.buffer as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  // IKM = HKDF(auth_secret, ecdh_secret, auth_info, 32)
  const ikm = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: authSecret.buffer as ArrayBuffer,
      info: authInfo
    },
    sharedSecretKey,
    256
  );
  
  // Import IKM for key derivation
  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive content encryption key (CEK)
  const cekInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: aes128gcm'),
    0x00
  ]);
  
  const cek = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      info: cekInfo
    },
    ikmKey,
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt']
  );
  
  // Derive nonce
  const nonceInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: nonce'),
    0x00
  ]);
  
  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      info: nonceInfo
    },
    ikmKey,
    96
  );
  const nonce = new Uint8Array(nonceBits);
  
  // Pad the payload (add delimiter 0x02 and optional padding)
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 0x02;
  
  // Encrypt with AES-128-GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cek,
    paddedPayload
  );
  
  // Build aes128gcm header
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  header.set(recordSize, 16);
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);
  
  // Combine header + encrypted content
  const result = new Uint8Array(header.length + encrypted.byteLength);
  result.set(header);
  result.set(new Uint8Array(encrypted), header.length);
  
  return { encrypted: result, salt, localPublicKey };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  if (isRateLimited(clientIP)) {
    console.log(`[send-push-notification] Rate limit exceeded for IP: ${clientIP}`);
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
    const { user_id, title, body, url, icon, actions, notification_type } = payload;

    console.log('[send-push-notification] Sending to user:', user_id, 'type:', notification_type);

    // Check user's notification preferences if notification_type is provided
    if (notification_type) {
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

      if (!prefsError && prefs) {
        // Check if push is enabled and specific notification type is allowed
        if (!prefs.push_enabled) {
          console.log('[send-push-notification] Push notifications disabled for user');
          return new Response(
            JSON.stringify({ success: true, sent: 0, message: 'Push disabled by user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Map notification_type to preference field
        const prefMap: Record<string, keyof typeof prefs> = {
          'tours': 'notify_tours',
          'messages': 'notify_messages',
          'reservations': 'notify_reservations',
          'social': 'notify_social',
          'promotions': 'notify_promotions',
          'admin': 'push_enabled' // Admin notifications always go through if push is enabled
        };

        const prefKey = prefMap[notification_type];
        if (prefKey && prefs[prefKey] === false) {
          console.log(`[send-push-notification] ${notification_type} notifications disabled for user`);
          return new Response(
            JSON.stringify({ success: true, sent: 0, message: `${notification_type} notifications disabled` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

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
      console.error('[send-push-notification] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        const notificationPayload = JSON.stringify({
          title,
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          url: url || '/',
          actions: actions || []
        });

        // Encrypt the payload
        const { encrypted } = await encryptPayload(
          notificationPayload,
          subscription.p256dh,
          subscription.auth_key
        );

        // Generate VAPID authorization
        const endpointUrl = new URL(subscription.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
        const jwt = await generateVapidJWT(audience, VAPID_PRIVATE_KEY);

        // Build headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Content-Length': encrypted.length.toString(),
          'TTL': '86400',
          'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`
        };

        // Send the push notification
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers,
          body: encrypted.buffer as ArrayBuffer
        });

        if (response.ok || response.status === 201) {
          sent++;
          console.log(`[send-push-notification] Successfully sent to subscription ${subscription.id}`);
          
          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          const errorText = await response.text();
          console.error(`[send-push-notification] Push failed: ${response.status} - ${errorText}`);
          failed++;
          
          // Remove invalid subscriptions
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log('[send-push-notification] Removed invalid subscription:', subscription.id);
          }
        }
      } catch (error: unknown) {
        console.error('[send-push-notification] Error sending to subscription:', error);
        failed++;
      }
    }

    console.log(`[send-push-notification] Results - Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-push-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
