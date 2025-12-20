/**
 * Calculate profile completion score based on filled fields
 * Returns a percentage (0-100)
 */
export function calculateProfileCompletion(data: {
  full_name?: string;
  age?: number;
  gender?: string;
  governorate?: string;
  university?: string;
  major?: string;
  year_of_study?: number;
  accommodation_status?: string;
  current_dorm_id?: string;
  current_room_id?: string;
  budget?: number;
  room_type?: string;
  city?: string;
  preferred_housing_area?: string;
  profile_photo_url?: string;
  phone_number?: string;
}): number {
  let score = 0;
  const weights = {
    // Personal info (25%)
    full_name: 10,
    gender: 10,
    age: 5,
    
    // Academic info (25%)
    university: 15,
    major: 5,
    year_of_study: 5,
    
    // Accommodation status (15%)
    accommodation_status: 15,
    
    // Housing details (20%) - conditional
    housing_details: 20,
    
    // Optional extras (15%)
    profile_photo_url: 10,
    phone_number: 5,
  };

  // Personal info
  if (data.full_name?.trim()) score += weights.full_name;
  if (data.gender) score += weights.gender;
  if (data.age && data.age > 0) score += weights.age;

  // Academic info
  if (data.university) score += weights.university;
  if (data.major?.trim()) score += weights.major;
  if (data.year_of_study && data.year_of_study > 0) score += weights.year_of_study;

  // Accommodation status
  if (data.accommodation_status) {
    score += weights.accommodation_status;
    
    // Housing details based on status
    if (data.accommodation_status === 'have_dorm') {
      // For have_dorm, they need to have selected dorm and room
      if (data.current_dorm_id && data.current_room_id) {
        score += weights.housing_details;
      }
    } else if (data.accommodation_status === 'need_dorm') {
      // For need_dorm, they need budget, room_type, and city
      let housingScore = 0;
      if (data.budget && data.budget > 0) housingScore += 7;
      if (data.room_type) housingScore += 7;
      if (data.city) housingScore += 6;
      score += housingScore;
    }
  }

  // Optional extras
  if (data.profile_photo_url?.trim()) score += weights.profile_photo_url;
  if (data.phone_number?.trim()) score += weights.phone_number;

  // Ensure score is between 0 and 100
  return Math.min(100, Math.max(0, score));
}
