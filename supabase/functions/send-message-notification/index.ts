import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessagePayload {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: MessagePayload = await req.json();
    const { sender_id, receiver_id, body, conversation_id } = payload;

    console.log('[send-message-notification] Processing message notification');
    console.log('Sender:', sender_id, 'Receiver:', receiver_id);

    if (!receiver_id || !sender_id) {
      console.log('[send-message-notification] Missing sender or receiver ID');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing sender or receiver ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sender's display name - check students, owners, and admins tables
    let senderName = 'Someone';
    
    // Try students first
    const { data: studentSender } = await supabase
      .from('students')
      .select('full_name')
      .eq('user_id', sender_id)
      .maybeSingle();
    
    if (studentSender?.full_name) {
      senderName = studentSender.full_name;
    } else {
      // Try owners
      const { data: ownerSender } = await supabase
        .from('owners')
        .select('full_name')
        .eq('user_id', sender_id)
        .maybeSingle();
      
      if (ownerSender?.full_name) {
        senderName = ownerSender.full_name;
      } else {
        // Try admins
        const { data: adminSender } = await supabase
          .from('admins')
          .select('full_name')
          .eq('user_id', sender_id)
          .maybeSingle();
        
        if (adminSender?.full_name) {
          senderName = adminSender.full_name;
        }
      }
    }

    // Create preview of message body
    const messagePreview = body ? 
      (body.length > 100 ? body.slice(0, 100) + '...' : body) : 
      'New message';

    // Call send-push-notification with notification_type for preference checking
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: receiver_id,
        title: `Message from ${senderName}`,
        body: messagePreview,
        url: `/messages?conversation=${conversation_id}`,
        icon: '/favicon.ico',
        notification_type: 'messages',
        actions: [
          { action: 'reply', title: 'Reply' },
          { action: 'view', title: 'View' }
        ]
      }
    });

    if (error) {
      console.error('[send-message-notification] Error calling send-push-notification:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also insert into notifications table for in-app notification
    await supabase.from('notifications').insert({
      user_id: receiver_id,
      title: `Message from ${senderName}`,
      message: messagePreview,
      metadata: { conversation_id, sender_id, type: 'message' }
    });

    console.log('[send-message-notification] Push notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, sent: data?.sent || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-message-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
