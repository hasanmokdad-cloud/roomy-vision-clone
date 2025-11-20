import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      console.log('❌ Email not verified for user:', user.id);
      return new Response(JSON.stringify({ error: 'Email not verified. Please check your inbox and verify your email before selecting a role.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { role } = await req.json();

    if (!role || !['student', 'owner', 'admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Assigning role "${role}" to user ${user.id}`);

    // Lookup role_id from roles table
    const { data: roleData, error: roleLookupError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .maybeSingle();

    if (roleLookupError || !roleData) {
      console.error('❌ Error looking up role:', roleLookupError);
      return new Response(JSON.stringify({ error: 'Invalid role', details: roleLookupError?.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert role_id into user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role_id: roleData.id,
      }, {
        onConflict: 'user_id',
      });

    if (roleError) {
      console.error('❌ Error inserting role:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to assign role', details: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Role assigned successfully');

    // Create profile based on role
    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        });

      if (studentError) {
        // Check if it's a duplicate key error (profile already exists)
        if (studentError.code === '23505') {
          console.log('ℹ️ Student profile already exists');
        } else {
          console.error('❌ Error creating student profile:', studentError);
          return new Response(JSON.stringify({ error: 'Role assigned but failed to create student profile', details: studentError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.log('✅ Student profile created');
      }
    } else if (role === 'owner') {
      const { error: ownerError } = await supabase
        .from('owners')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        });

      if (ownerError) {
        // Check if it's a duplicate key error (profile already exists)
        if (ownerError.code === '23505') {
          console.log('ℹ️ Owner profile already exists');
        } else {
          console.error('❌ Error creating owner profile:', ownerError);
          return new Response(JSON.stringify({ error: 'Role assigned but failed to create owner profile', details: ownerError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.log('✅ Owner profile created');
      }
    }

    return new Response(JSON.stringify({ success: true, role }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
