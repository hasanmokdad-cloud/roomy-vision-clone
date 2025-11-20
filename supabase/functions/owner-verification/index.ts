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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if requester is admin
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminCheck?.role !== 'admin') {
      throw new Error('Insufficient permissions - admin role required');
    }

    const { dorm_id, new_status } = await req.json();

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

    if (updateError) throw updateError;

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
    console.error('Owner verification error:', error);
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
