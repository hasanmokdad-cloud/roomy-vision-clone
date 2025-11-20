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

    const { target_user_id, elevate } = await req.json();

    if (!target_user_id) {
      throw new Error('target_user_id is required');
    }

    if (elevate) {
      // Add admin role
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: target_user_id,
          role: 'admin'
        }, {
          onConflict: 'user_id,role'
        });

      if (upsertError) throw upsertError;

      // Log the action
      await supabase.from('system_logs').insert({
        user_id: user.id,
        action: 'ELEVATE_TO_ADMIN',
        table_affected: 'user_roles',
        record_id: target_user_id,
        details: { target_user_id, elevated_by: user.id }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'User elevated to admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Remove admin role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', target_user_id)
        .eq('role', 'admin');

      if (deleteError) throw deleteError;

      // Log the action
      await supabase.from('system_logs').insert({
        user_id: user.id,
        action: 'REMOVE_ADMIN',
        table_affected: 'user_roles',
        record_id: target_user_id,
        details: { target_user_id, removed_by: user.id }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Admin privileges removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Admin elevation error:', error);
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
