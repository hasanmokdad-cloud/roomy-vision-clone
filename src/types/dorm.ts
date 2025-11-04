/**
 * Dorm type definitions - Public vs Full access
 */

// Public view - no sensitive contact info
export interface DormPublic {
  id: string;
  name: string | null;
  dorm_name: string | null;
  location: string;
  area: string | null;
  university: string | null;
  verification_status: string | null;
  cover_image: string | null;
  image_url: string | null;
  price: number;
  monthly_price: number | null;
  room_types: string | null;
  room_types_json: any;
  capacity: number | null;
  amenities: string[] | null;
  gender_preference: string | null;
  shuttle: boolean | null;
  available: boolean | null;
  created_at: string;
  updated_at: string;
  type: string | null;
  description: string | null;
  address: string | null;
}

// Full dorm access - includes sensitive contact info (for authenticated owners/admins)
export interface DormFull extends DormPublic {
  email: string | null;
  phone_number: string | null;
  website: string | null;
  owner_id: string | null;
}
