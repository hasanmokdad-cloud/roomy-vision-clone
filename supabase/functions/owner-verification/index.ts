import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[owner-verification] Request received');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[owner-verification] No authorization header');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[owner-verification] Unauthorized:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[owner-verification] User authenticated:', user.id);

    // Check if requester is admin using security definer function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
      check_user_id: user.id
    });

    if (adminError || !isAdmin) {
      console.error('[owner-verification] Not admin:', adminError);
      throw new Error('Insufficient permissions - admin role required');
    }

    console.log('[owner-verification] Admin verified');

    const { dorm_id, new_status } = await req.json();
    console.log('[owner-verification] Request body:', { dorm_id, new_status });

    if (!dorm_id || !new_status) {
      throw new Error('dorm_id and new_status are required');
    }

    if (!['Verified', 'Pending', 'Rejected'].includes(new_status)) {
      throw new Error('Invalid status. Must be Verified, Pending, or Rejected');
    }

    // Update dorm verification status
    const { error: updateError } = await supabase
      .from('dorms')
      .update({ verification_status: new_status })
      .eq('id', dorm_id);

    if (updateError) {
      console.error('[owner-verification] Update error:', updateError);
      throw updateError;
    }

    console.log('[owner-verification] Dorm updated successfully');

    // Log the action
    await supabase.from('system_logs').insert({
      user_id: user.id,
      action: `DORM_VERIFICATION_${new_status.toUpperCase()}`,
      table_affected: 'dorms',
      record_id: dorm_id,
      details: { dorm_id, new_status, verified_by: user.id }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Dorm ${new_status === 'Verified' ? 'verified' : new_status === 'Rejected' ? 'rejected' : 'set to pending'}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[owner-verification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
