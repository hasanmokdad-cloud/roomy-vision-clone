import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DormData {
  Dorm: string;
  "Monthly Price (prices are per student, not per room)": string;
  Deposit: string;
  City: string;
  Shuttle: string;
  Address: string;
  "Room Type": string;
  Capacity: string;
  "Phone Number": string;
  "Services & Amenities": string;
  "Walking distance": string;
}

interface RoomType {
  type: string;
  price: number;
  capacity: number;
  amenities?: string[];
}

function parsePrice(priceStr: string): number {
  // Extract first dollar amount from string like "S: $350" or "$300"
  const match = priceStr.match(/\$\s*(\d+)/);
  return match ? parseInt(match[1]) : 350;
}

function parsePrices(priceStr: string): RoomType[] {
  const roomTypes: RoomType[] = [];
  
  // Handle various price formats like:
  // "S: $350, D: $500"
  // "SS: $505, SD: $380, HSS: $550"
  const priceSegments = priceStr.split(',').map(s => s.trim());
  
  for (const segment of priceSegments) {
    // Extract room type code and price
    const match = segment.match(/([A-Z]+):\s*\$\s*(\d+)/);
    if (match) {
      const typeCode = match[1];
      const price = parseInt(match[2]);
      
      // Map type codes to readable room types
      let roomType = 'Room';
      let capacity = 1;
      
      if (typeCode.includes('S') && !typeCode.includes('D')) {
        roomType = typeCode.includes('H') ? 'High Standard Single' : 
                   typeCode.includes('L') ? 'Large Single' :
                   typeCode.includes('M') ? 'Medium Single' :
                   'Single Room';
        capacity = 1;
      } else if (typeCode.includes('D')) {
        roomType = typeCode.includes('H') ? 'High Standard Double' : 
                   typeCode.includes('L') ? 'Large Double' :
                   typeCode.includes('M') ? 'Medium Double' :
                   'Double Room';
        capacity = 2;
      } else if (typeCode.includes('T')) {
        roomType = typeCode.includes('L') ? 'Large Triple' :
                   typeCode.includes('M') ? 'Medium Triple' :
                   'Triple Room';
        capacity = 3;
      } else if (typeCode.includes('Q')) {
        roomType = 'Quad Room';
        capacity = 4;
      } else if (typeCode.includes('A')) {
        roomType = typeCode.includes('L') ? 'Large Apartment' : 
                   typeCode.includes('S') ? 'Small Apartment' :
                   'Apartment';
        capacity = 2;
      }
      
      roomTypes.push({ type: roomType, price, capacity });
    }
  }
  
  // If no room types parsed, return a default
  if (roomTypes.length === 0) {
    const defaultPrice = parsePrice(priceStr);
    roomTypes.push({ type: 'Single Room', price: defaultPrice, capacity: 1 });
  }
  
  return roomTypes;
}

function extractUniversity(address: string): string {
  if (address.includes('LAU')) return 'LAU (Byblos)';
  if (address.includes('AUB')) return 'AUB';
  if (address.includes('USEK')) return 'USEK';
  if (address.includes('USJ')) return 'USJ';
  if (address.includes('Balamand')) return 'Balamand';
  return 'LAU (Byblos)'; // default
}

function generateDescription(name: string, city: string, roomTypes: string): string {
  const templates = [
    `Modern and comfortable ${roomTypes.toLowerCase()} located in ${city}, perfect for students.`,
    `${name} offers quality student accommodation in ${city} with great amenities.`,
    `Cozy and well-equipped dorm in ${city}, ideal for university students.`,
    `Premium student living at ${name} in ${city} with excellent facilities.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateCoverImage(): string {
  const imageIds = [
    'dorm', 'student-room', 'apartment', 'bedroom', 'student-housing',
    'modern-room', 'cozy-bedroom', 'studio-apartment'
  ];
  const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
  return `https://source.unsplash.com/800x600/?${randomId},interior`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw Excel data from the request
    const { dormsData } = await req.json();
    
    if (!dormsData || !Array.isArray(dormsData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format. Expected dormsData array.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${dormsData.length} dorms for import...`);

    const dormsToInsert = [];
    const errors = [];

    for (const row of dormsData as DormData[]) {
      try {
        // Parse room types and prices
        const roomTypes = parsePrices(row["Monthly Price (prices are per student, not per room)"]);
        const minPrice = Math.min(...roomTypes.map(rt => rt.price));
        const roomTypeNames = roomTypes.map(rt => rt.type).join(', ');
        
        // Extract area from city
        const area = row.City || 'Byblos';
        
        // Parse shuttle
        const shuttle = row.Shuttle?.toLowerCase() === 'yes';
        
        // Extract university
        const university = extractUniversity(row.Address);
        
        // Clean amenities
        const amenities = row["Services & Amenities"]
          ?.split(',')
          .map(a => a.trim())
          .filter(a => a.length > 0) || [];
        
        // Generate description
        const description = generateDescription(row.Dorm, area, roomTypeNames);
        
        // Generate cover image
        const coverImage = generateCoverImage();
        
        const dormData = {
          name: row.Dorm,
          dorm_name: row.Dorm,
          location: row.Address,
          address: row.Address,
          area: area,
          price: minPrice,
          monthly_price: minPrice,
          phone_number: row["Phone Number"] || null,
          services_amenities: row["Services & Amenities"] || 'WiFi, Electricity, Water, Laundry',
          room_types: roomTypeNames,
          room_types_json: roomTypes,
          shuttle: shuttle,
          university: university,
          verification_status: 'Verified',
          cover_image: coverImage,
          image_url: coverImage,
          description: description,
          amenities: amenities.slice(0, 5), // Take first 5 amenities
          available: true,
          capacity: Math.max(...roomTypes.map(rt => rt.capacity)),
          type: roomTypes.length > 1 ? 'Mixed' : roomTypes[0].type,
        };
        
        dormsToInsert.push(dormData);
      } catch (error) {
        console.error(`Error processing dorm ${row.Dorm}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ dorm: row.Dorm, error: errorMsg });
      }
    }

    // Batch insert in chunks of 25
    const chunkSize = 25;
    let insertedCount = 0;
    
    for (let i = 0; i < dormsToInsert.length; i += chunkSize) {
      const chunk = dormsToInsert.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from('dorms')
        .insert(chunk)
        .select('id, name');
      
      if (error) {
        console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error);
        errors.push({ chunk: i / chunkSize + 1, error: error.message });
      } else {
        insertedCount += data?.length || 0;
        console.log(`Inserted chunk ${i / chunkSize + 1}: ${data?.length} dorms`);
      }
    }

    // Get final count
    const { count } = await supabase
      .from('dorms')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedCount} dorms`,
        totalInDatabase: count,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
