/**
 * Generate human-readable explanations for AI matches (Phase 12)
 */

export function generateMatchExplanations(
  match: any,
  student: any,
  tier: 'basic' | 'advanced' | 'vip',
  usePersonality: boolean
): string[] {
  const explanations: string[] = [];

  if (match.type === 'dorm') {
    // Dorm match explanations
    if (match.monthly_price && student.budget) {
      const diff = student.budget - match.monthly_price;
      if (diff >= 0 && diff < 100) {
        explanations.push(`Perfect budget fit at $${match.monthly_price}/month`);
      } else if (diff >= 100) {
        explanations.push(`Budget-friendly at $${match.monthly_price}/month (${Math.round((diff / student.budget) * 100)}% under budget)`);
      } else if (match.monthly_price <= student.budget) {
        explanations.push(`Within your $${student.budget}/month budget`);
      }
    }

    if (match.university && student.preferred_university) {
      if (match.university.toLowerCase().includes(student.preferred_university.toLowerCase())) {
        explanations.push(`Near ${student.preferred_university}`);
      }
    }

    if (match.area) {
      if (student.favorite_areas && student.favorite_areas.some((area: string) => 
        match.area.toLowerCase().includes(area.toLowerCase())
      )) {
        explanations.push(`Located in your preferred area: ${match.area}`);
      } else {
        explanations.push(`Located in ${match.area}`);
      }
    }

    if (match.gender_preference) {
      const genderPolicy = match.gender_preference.toLowerCase();
      if (genderPolicy === 'mixed' || genderPolicy === 'any') {
        explanations.push('Mixed-gender dorm compatible with your profile');
      } else if (student.gender && genderPolicy.includes(student.gender.toLowerCase())) {
        explanations.push(`${student.gender}-friendly accommodation`);
      }
    }

    // Room availability
    if (match.availableRooms && match.availableRooms.length > 0) {
      const totalSpots = match.availableRooms.reduce((sum: number, room: any) => 
        sum + (room.capacity - room.capacity_occupied), 0
      );
      if (totalSpots > 0) {
        explanations.push(`${totalSpots} available spot${totalSpots > 1 ? 's' : ''} currently`);
      }
    }

    // Amenities match
    if (match.amenities && student.preferred_amenities && student.preferred_amenities.length > 0) {
      const matchedAmenities = match.amenities.filter((a: string) =>
        student.preferred_amenities.some((pa: string) => 
          a.toLowerCase().includes(pa.toLowerCase())
        )
      );
      if (matchedAmenities.length > 0) {
        explanations.push(`Includes ${matchedAmenities.slice(0, 2).join(' & ')}`);
      }
    }

  } else if (match.type === 'roommate') {
    // Roommate match explanations
    
    // University match
    if (match.university && student.preferred_university && 
        match.university === student.preferred_university) {
      explanations.push(`Both study at ${match.university}`);
    }

    // Budget similarity
    if (match.budget && student.budget) {
      const diff = Math.abs(match.budget - student.budget);
      if (diff < 100) {
        explanations.push(`Similar budget ($${match.budget}/month)`);
      }
    }

    // Area preference
    if (match.preferred_housing_area && student.favorite_areas) {
      const areaMatch = student.favorite_areas.some((area: string) =>
        match.preferred_housing_area.toLowerCase().includes(area.toLowerCase())
      );
      if (areaMatch) {
        explanations.push(`Prefers ${match.preferred_housing_area} area like you`);
      }
    }

    // Current dorm capacity (if student has current place)
    if (student.current_dorm_id && student.current_room_id && match.current_room) {
      const available = match.current_room.capacity - match.current_room.capacity_occupied;
      if (available > 0) {
        explanations.push(`Can join your dorm (${available} spot${available > 1 ? 's' : ''} available in Room ${match.current_room.name})`);
      } else {
        explanations.push('Room currently full - can find new shared dorm together');
      }
    }

    // Personality traits (only for Advanced/VIP tiers)
    if (tier !== 'basic' && usePersonality && match.subScores?.personality_breakdown) {
      const breakdown = match.subScores.personality_breakdown;
      
      if (breakdown.sleep_schedule && breakdown.sleep_schedule > 0.75) {
        explanations.push('Similar sleep schedules');
      }
      
      if (breakdown.cleanliness && breakdown.cleanliness > 0.75) {
        explanations.push('Both prefer clean living spaces');
      }
      
      if (breakdown.noise_compatibility && breakdown.noise_compatibility > 0.75) {
        explanations.push('Compatible noise tolerance levels');
      }
      
      if (breakdown.social_style && breakdown.social_style > 0.75) {
        explanations.push('Similar social preferences');
      }
    } else if (tier === 'basic') {
      // Basic tier - only show non-personality reasons
      if (match.gender && student.gender && match.gender === student.gender) {
        explanations.push(`Same gender (${match.gender})`);
      }
    }

    // Lifestyle basics (available to all tiers)
    if (match.subScores?.lifestyle_score && match.subScores.lifestyle_score > 70) {
      explanations.push('Compatible lifestyle habits');
    }

    if (match.subScores?.study_focus_score && match.subScores.study_focus_score > 70) {
      explanations.push('Similar study schedules');
    }
  }

  // Ensure we have at least 2 explanations
  if (explanations.length === 0) {
    if (match.type === 'dorm') {
      explanations.push('Verified listing with great facilities');
      explanations.push('Highly rated by AI matching engine');
    } else {
      explanations.push('Compatible profile based on preferences');
      explanations.push('Vetted by AI matching system');
    }
  } else if (explanations.length === 1) {
    explanations.push('Recommended by Roomy AI');
  }

  // Return top 3-4 explanations
  return explanations.slice(0, 4);
}
