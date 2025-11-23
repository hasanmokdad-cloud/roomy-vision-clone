import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoomData {
  dorm_id: string;
  name: string;
  type: string;
  price: number;
  deposit?: number;
  capacity?: number;
  area_m2?: number;
  description?: string;
  images?: string[];
  panorama_urls?: string[];
  available: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Parse the request body
    const roomData: RoomData = await req.json();
    
    console.log('📝 Creating room for dorm:', roomData.dorm_id);

    // Get the owner record for this user
    const { data: ownerRecord, error: ownerError } = await supabaseClient
      .from('owners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (ownerError || !ownerRecord) {
      throw new Error('Owner record not found for this user');
    }

    console.log('✅ Owner record found:', ownerRecord.id);

    // Verify the owner owns this dorm
    const { data: dormRecord, error: dormError } = await supabaseClient
      .from('dorms')
      .select('id, owner_id')
      .eq('id', roomData.dorm_id)
      .single();

    if (dormError || !dormRecord) {
      throw new Error('Dorm not found');
    }

    if (dormRecord.owner_id !== ownerRecord.id) {
      throw new Error('You do not own this dorm');
    }

    console.log('✅ Ownership verified. Creating room...');

    // Insert the room using service role (bypasses RLS)
    const { data: newRoom, error: insertError } = await supabaseClient
      .from('rooms')
      .insert([{
        dorm_id: roomData.dorm_id,
        name: roomData.name,
        type: roomData.type,
        price: roomData.price,
        deposit: roomData.deposit || null,
        capacity: roomData.capacity || null,
        area_m2: roomData.area_m2 || null,
        description: roomData.description || null,
        images: roomData.images || [],
        panorama_urls: roomData.panorama_urls || [],
        available: roomData.available,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Room created successfully:', newRoom.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        room: newRoom,
        message: 'Room created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
