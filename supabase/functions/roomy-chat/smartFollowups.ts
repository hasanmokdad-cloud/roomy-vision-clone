/**
 * PHASE 7B: Generate smart, context-sensitive follow-up actions
 */

interface FollowUpAction {
  label: string;
  query: string;
}

export function generateSmartFollowups(
  filters: any,
  studentProfile: any,
  dorms: any[],
  roommates: any[],
  isRoommateQuery: boolean
): FollowUpAction[] {
  const followups: FollowUpAction[] = [];
  
  // After dorm suggestions
  if (!isRoommateQuery && dorms && dorms.length > 0) {
    const firstDorm = dorms[0];
    
    // If student needs roommate, suggest finding one for this dorm
    if (studentProfile?.needs_roommate_new_dorm) {
      followups.push({
        label: 'Find roommates for this dorm',
        query: `Find compatible roommates in ${firstDorm.dorm_name || firstDorm.area}`
      });
    }
    
    // Suggest similar dorms in same area
    if (firstDorm.area) {
      followups.push({
        label: `Show more dorms in ${firstDorm.area}`,
        query: `Show more dorms like ${firstDorm.dorm_name} in ${firstDorm.area}`
      });
    }
    
    // If dorm is over budget, suggest cheaper
    const overBudgetDorms = dorms.filter((d: any) => 
      studentProfile?.budget && d.monthly_price > studentProfile.budget
    );
    
    if (overBudgetDorms.length > 0) {
      followups.push({
        label: 'Show cheaper options',
        query: `Find dorms under $${studentProfile.budget}`
      });
    } else if (studentProfile?.budget) {
      // Suggest exploring slightly more expensive options
      followups.push({
        label: 'Explore premium options',
        query: `Show me dorms up to $${Math.floor(studentProfile.budget * 1.15)}`
      });
    }
  }
  
  // After roommate suggestions
  if (isRoommateQuery && roommates && roommates.length > 0) {
    // Filter by budget
    followups.push({
      label: 'Filter by budget',
      query: `Find roommates with similar budget to mine`
    });
    
    // Find dorms together
    followups.push({
      label: 'Find dorms together',
      query: `Find dorms for me and a roommate`
    });
    
    // If personality test not completed, suggest it
    if (!studentProfile?.personality_test_completed) {
      followups.push({
        label: 'Get better matches',
        query: 'How do I complete my personality test for better roommate matches?'
      });
    }
  }
  
  // Generic helpful follow-ups if no specific context
  if (followups.length === 0) {
    if (studentProfile?.preferred_university) {
      followups.push({
        label: `Show dorms near ${studentProfile.preferred_university}`,
        query: `Find dorms near ${studentProfile.preferred_university}`
      });
    }
    
    if (studentProfile?.budget) {
      followups.push({
        label: 'Find within my budget',
        query: `Show dorms under $${studentProfile.budget}`
      });
    }
    
    // Suggest personality test if not completed
    if (!studentProfile?.personality_test_completed) {
      followups.push({
        label: 'Take personality test',
        query: 'How do I complete my personality test?'
      });
    }
  }
  
  // Limit to top 3 follow-ups
  return followups.slice(0, 3);
}

/**
 * Find similar available dorms when original is full (PHASE 7B)
 */
export async function findSimilarAvailableDorms(
  supabase: any,
  fullDorm: any,
  studentProfile: any
): Promise<any[]> {
  console.log(`[roomy-chat] Finding alternatives to full dorm: ${fullDorm.dorm_name}`);
  
  let query = supabase
    .from('dorms')
    .select('*')
    .eq('verification_status', 'Verified')
    .eq('available', true)
    .neq('id', fullDorm.id);
  
  // Same area
  if (fullDorm.area) {
    query = query.eq('area', fullDorm.area);
  }
  
  // Similar price range (+/- 15%)
  if (fullDorm.monthly_price) {
    const minPrice = Math.floor(fullDorm.monthly_price * 0.85);
    const maxPrice = Math.floor(fullDorm.monthly_price * 1.15);
    query = query.gte('monthly_price', minPrice).lte('monthly_price', maxPrice);
  }
  
  // Gender compatibility
  if (studentProfile?.gender) {
    const genderLower = studentProfile.gender.toLowerCase();
    if (genderLower === 'male') {
      query = query.or('gender_preference.is.null,gender_preference.in.(male,mixed,any,Male,Mixed,Any)');
    } else if (genderLower === 'female') {
      query = query.or('gender_preference.is.null,gender_preference.in.(female,mixed,any,Female,Mixed,Any)');
    }
  }
  
  const { data, error } = await query.limit(3);
  
  if (error) {
    console.error('[roomy-chat] Error finding similar dorms:', error);
    return [];
  }
  
  // Calculate available spots for each
  const dormsWithSpots = await Promise.all((data || []).map(async (dorm: any) => {
    const { data: rooms } = await supabase
      .from('rooms')
      .select('capacity, capacity_occupied')
      .eq('dorm_id', dorm.id)
      .eq('available', true);
    
    const availableSpots = (rooms || []).reduce((sum: number, room: any) => 
      sum + (room.capacity - (room.capacity_occupied || 0)), 0
    );
    
    return {
      ...dorm,
      availableSpots
    };
  }));
  
  return dormsWithSpots.filter(d => d.availableSpots > 0);
}
