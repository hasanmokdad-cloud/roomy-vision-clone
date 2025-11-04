import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Creating owner record for user:', user.id, user.email);

    // Check if email is from LAU domain
    if (!user.email?.endsWith('@lau.edu')) {
      return new Response(
        JSON.stringify({ error: 'Only LAU domain users can become owners' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if owner record already exists
    const { data: existingOwner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingOwner) {
      console.log('Owner record already exists for user:', user.id);
      return new Response(
        JSON.stringify({ message: 'Owner record already exists', owner_id: existingOwner.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into user_roles table (owner role)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'owner'
      })
      .select()
      .single();

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }

    // Create owner record
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        email: user.email!,
        notify_email: true,
        notify_whatsapp: true
      })
      .select()
      .single();

    if (ownerError) {
      console.error('Error creating owner:', ownerError);
      throw ownerError;
    }

    console.log('Owner record created successfully:', owner.id);

    return new Response(
      JSON.stringify({ success: true, owner_id: owner.id, message: 'Owner record created successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-owner-record:', error);
    
    // Log to security_logs
    try {
      const logClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await logClient.from("security_logs").insert({
        event_type: "owner_registration_error",
        severity: "error",
        message: "Error creating owner record",
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred during registration. Please try again." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
