import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function to mark all undelivered messages as delivered for a user
 * Called by service workers and background sync to enable delivery receipts
 * even when the user's app/tab is not open
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[mark-messages-delivered] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[mark-messages-delivered] Processing for user:', user.id);

    // Get all conversations for this user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (convError) {
      console.error('[mark-messages-delivered] Error fetching conversations:', convError);
      return new Response(
        JSON.stringify({ success: false, error: convError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversations || conversations.length === 0) {
      console.log('[mark-messages-delivered] No conversations found');
      return new Response(
        JSON.stringify({ success: true, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const conversationIds = conversations.map(c => c.id);

    // Update all undelivered messages where this user is the receiver
    const { data: updatedMessages, error: updateError } = await supabase
      .from('messages')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .is('delivered_at', null)
      .eq('status', 'sent')
      .select('id');

    if (updateError) {
      console.error('[mark-messages-delivered] Error updating messages:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const count = updatedMessages?.length || 0;
    console.log('[mark-messages-delivered] Marked', count, 'messages as delivered');

    return new Response(
      JSON.stringify({ success: true, updated: count }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[mark-messages-delivered] Error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
