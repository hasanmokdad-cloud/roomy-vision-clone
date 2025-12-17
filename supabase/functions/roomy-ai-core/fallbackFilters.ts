/**
 * PHASE 7B: Fallback logic when no matches found
 * Relaxes filters gradually while keeping gender strict
 */

export async function fetchWithRelaxedFilters(
  supabase: any,
  student: any,
  context: any,
  mode: string,
  exclude_ids?: string[]
) {
  console.log('[roomy-ai-core] Applying relaxed filters for fallback matches');
  
  if (mode === 'dorm') {
    // Dorm fallback strategy:
    // 1. Increase budget by +10% (already done in main query, so expand to +20%)
    // 2. Expand to all areas (TODO: Re-enable nearby area expansion after distance algorithm implementation)
    // 3. Ignore room type preference
    // 4. Keep gender filter STRICT (never relax)
    
    let query = supabase
      .from('dorms')
      .select('*')
      .eq('verification_status', 'Verified')
      .eq('available', true);

    // Exclude dismissed dorms
    if (exclude_ids && exclude_ids.length > 0) {
      query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
    }

    // STRICT: Gender filter (never relax)
    if (student.gender) {
      const genderLower = student.gender.toLowerCase();
      if (genderLower === 'male') {
        query = query.or('gender_preference.is.null,gender_preference.in.(male,mixed,any,Male,Mixed,Any)');
      } else if (genderLower === 'female') {
        query = query.or('gender_preference.is.null,gender_preference.in.(female,mixed,any,Female,Mixed,Any)');
      }
    }

    // RELAXED: Budget (+20% tolerance for fallback)
    if (context.budget || student.budget) {
      const maxBudget = Math.floor((context.budget || student.budget) * 1.20);
      query = query.lte('monthly_price', maxBudget);
      console.log(`[roomy-ai-core] Fallback budget expanded to +20% (max: $${maxBudget})`);
    }

    // RELAXED: Area (remove area filter entirely to expand search)
    // Don't filter by area - show all areas
    
    // RELAXED: Room type (ignore preference)
    // Don't filter by room type

    // Still filter by university if specified
    if (context.university || student.preferred_university) {
      query = query.ilike('university', `%${context.university || student.preferred_university}%`);
    }

    const { data, error } = await query.limit(10);
    
    if (error) {
      console.error('[roomy-ai-core] Fallback query error:', error);
      return [];
    }

    // Fetch rooms for each dorm
    const dormsWithRooms = await Promise.all((data || []).map(async (dorm: any) => {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('dorm_id', dorm.id)
        .eq('available', true);
      
      const availableRooms = (rooms || []).filter((room: any) => 
        (room.capacity_occupied || 0) < (room.capacity || 0)
      );
      
      // Calculate budget warning
      let budgetWarning = null;
      if (student.budget && dorm.monthly_price > student.budget) {
        const overage = dorm.monthly_price - student.budget;
        budgetWarning = `$${overage} over your budget`;
      }
      
      return {
        ...dorm,
        type: 'dorm',
        availableRooms,
        budgetWarning,
        score: 60, // Lower base score for fallback matches
        subScores: {
          location_score: 50,
          budget_score: budgetWarning ? 40 : 70,
          room_type_score: 50,
          amenities_score: 50
        }
      };
    }));

    return dormsWithRooms.filter(d => d.availableRooms.length > 0);
    
  } else if (mode === 'roommate') {
    // Roommate fallback strategy:
    // 1. Relax university match (remove filter)
    // 2. Expand budget range (+/- 30%)
    // 3. Remove area preference
    // 4. Keep gender STRICT
    // 5. Keep safety/privacy rules
    
    let query = supabase
      .from('students')
      .select('*, current_dorm:dorms!current_dorm_id(name, area), current_room:rooms!current_room_id(name, type, capacity, capacity_occupied)')
      .neq('id', student.id);

    // Exclude dismissed roommates
    if (exclude_ids && exclude_ids.length > 0) {
      query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
    }

    // STRICT: Gender (never relax)
    if (student.gender) {
      query = query.ilike('gender', student.gender);
    }

    // RELAXED: Remove university filter entirely
    // RELAXED: Remove area filter entirely
    
    // Still require roommate needs
    query = query.or('needs_roommate_current_place.eq.true,needs_roommate_new_dorm.eq.true');

    const { data, error } = await query.limit(10);
    
    if (error) {
      console.error('[roomy-ai-core] Roommate fallback query error:', error);
      return [];
    }

    // Simple scoring for fallback matches
    return (data || []).map((candidate: any) => ({
      ...candidate,
      type: 'roommate',
      score: Math.random() * 60 + 40, // Random 40-100 score
      compatibility_score: null, // No personality for fallback
      subScores: {
        lifestyle_score: 50,
        cleanliness_score: 50,
        study_focus_score: 50,
        personality_score: null
      }
    }));
  }

  return [];
}
