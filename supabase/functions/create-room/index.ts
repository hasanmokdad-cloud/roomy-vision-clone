import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoomData {
  room_id?: string; // Optional - if provided, will update instead of create
  dorm_id: string;
  name: string;
  type: string;
  bed_type?: string; // Descriptive only - does NOT affect capacity
  price: number;
  deposit?: number;
  price_1_student?: number;
  price_2_students?: number;
  deposit_1_student?: number;
  deposit_2_students?: number;
  capacity?: number;
  capacity_occupied?: number;
  area_m2?: number;
  description?: string;
  images?: string[];
  panorama_urls?: string[];
  video_url?: string;
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
    const isUpdate = !!roomData.room_id;
    
    console.log(isUpdate ? '📝 Updating room:' : '📝 Creating room for dorm:', roomData.room_id || roomData.dorm_id);

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

    console.log('✅ Ownership verified.');

    let resultRoom;
    let operationError;

    if (isUpdate) {
      // UPDATE existing room
      console.log('Updating room:', roomData.room_id);
      
      const { data, error } = await supabaseClient
        .from('rooms')
        .update({
          name: roomData.name,
          type: roomData.type,
          bed_type: roomData.bed_type || 'single',
          price: roomData.price,
          deposit: roomData.deposit || null,
          price_1_student: roomData.price_1_student || null,
          price_2_students: roomData.price_2_students || null,
          deposit_1_student: roomData.deposit_1_student || null,
          deposit_2_students: roomData.deposit_2_students || null,
          capacity: roomData.capacity || null,
          capacity_occupied: roomData.capacity_occupied || 0,
          area_m2: roomData.area_m2 || null,
          description: roomData.description || null,
          images: roomData.images || [],
          panorama_urls: roomData.panorama_urls || [],
          video_url: roomData.video_url || null,
          available: roomData.available,
        })
        .eq('id', roomData.room_id)
        .eq('dorm_id', roomData.dorm_id)
        .select()
        .single();
      
      resultRoom = data;
      operationError = error;
    } else {
      // INSERT new room
      console.log('Creating new room...');
      
      const { data, error } = await supabaseClient
        .from('rooms')
        .insert([{
          dorm_id: roomData.dorm_id,
          name: roomData.name,
          type: roomData.type,
          bed_type: roomData.bed_type || 'single',
          price: roomData.price,
          deposit: roomData.deposit || null,
          price_1_student: roomData.price_1_student || null,
          price_2_students: roomData.price_2_students || null,
          deposit_1_student: roomData.deposit_1_student || null,
          deposit_2_students: roomData.deposit_2_students || null,
          capacity: roomData.capacity || null,
          capacity_occupied: roomData.capacity_occupied || 0,
          area_m2: roomData.area_m2 || null,
          description: roomData.description || null,
          images: roomData.images || [],
          panorama_urls: roomData.panorama_urls || [],
          video_url: roomData.video_url || null,
          available: roomData.available,
        }])
        .select()
        .single();
      
      resultRoom = data;
      operationError = error;
    }

    if (operationError) {
      console.error('❌ Operation error:', operationError);
      throw operationError;
    }

    console.log(`✅ Room ${isUpdate ? 'updated' : 'created'} successfully:`, resultRoom.id);

    // Update dorm's starting price (lowest room price)
    const { data: minPriceData } = await supabaseClient
      .from('rooms')
      .select('price')
      .eq('dorm_id', roomData.dorm_id)
      .order('price', { ascending: true })
      .limit(1)
      .single();

    if (minPriceData) {
      await supabaseClient
        .from('dorms')
        .update({ 
          monthly_price: minPriceData.price,
          price: minPriceData.price 
        })
        .eq('id', roomData.dorm_id);
      
      console.log(`✅ Updated dorm starting price to: $${minPriceData.price}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        room: resultRoom,
        message: `Room ${isUpdate ? 'updated' : 'created'} successfully`
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
