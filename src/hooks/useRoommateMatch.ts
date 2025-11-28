import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentProfile {
  user_id: string;
  full_name: string;
  profile_photo_url?: string;
  university?: string;
  age?: number;
  gender?: string;
  budget?: number;
  preferred_university?: string;
  favorite_areas?: string[];
  preferred_room_types?: string[];
  preferred_amenities?: string[];
  accommodation_status?: string;
  needs_roommate_current_place?: boolean;
  needs_roommate_new_dorm?: boolean;
  enable_personality_matching?: boolean;
  personality_test_completed?: boolean;
  personality_data?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export const computeSimilarity = (profileA: any, profileB: any): number => {
  let score = 0;
  let maxScore = 0;

  // University match (30 points)
  maxScore += 30;
  if (profileA.university && profileB.university && 
      profileA.university.toLowerCase() === profileB.university.toLowerCase()) {
    score += 30;
  }

  // Preferred university match (20 points)
  maxScore += 20;
  if (profileA.preferred_university && profileB.preferred_university &&
      profileA.preferred_university.toLowerCase() === profileB.preferred_university.toLowerCase()) {
    score += 20;
  }

  // Budget range (20 points - within 20% of each other)
  maxScore += 20;
  if (profileA.budget && profileB.budget) {
    const budgetDiff = Math.abs(profileA.budget - profileB.budget);
    const avgBudget = (profileA.budget + profileB.budget) / 2;
    if (budgetDiff / avgBudget < 0.2) {
      score += 20;
    } else if (budgetDiff / avgBudget < 0.4) {
      score += 10;
    }
  }

  // Age proximity (10 points - within 3 years)
  maxScore += 10;
  if (profileA.age && profileB.age) {
    const ageDiff = Math.abs(profileA.age - profileB.age);
    if (ageDiff <= 3) {
      score += 10;
    } else if (ageDiff <= 5) {
      score += 5;
    }
  }

  // Favorite areas overlap (10 points)
  maxScore += 10;
  if (profileA.favorite_areas?.length && profileB.favorite_areas?.length) {
    const overlap = profileA.favorite_areas.filter((a: string) => 
      profileB.favorite_areas.includes(a)
    ).length;
    score += Math.min(10, overlap * 5);
  }

  // Room type match (10 points)
  maxScore += 10;
  if (profileA.preferred_room_types?.length && profileB.preferred_room_types?.length) {
    const overlap = profileA.preferred_room_types.filter((t: string) =>
      profileB.preferred_room_types.includes(t)
    ).length;
    score += Math.min(10, overlap * 5);
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

// Compute personality compatibility using Big Five traits
export const computePersonalityCompatibility = (profileA: any, profileB: any): number | null => {
  // Only compute if both have personality data
  if (!profileA.enable_personality_matching || !profileB.enable_personality_matching) return null;
  if (!profileA.personality_test_completed || !profileB.personality_test_completed) return null;
  if (!profileA.personality_data || !profileB.personality_data) return null;

  const dataA = profileA.personality_data;
  const dataB = profileB.personality_data;

  // Calculate Euclidean distance and convert to similarity score
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  let sumSquaredDiff = 0;

  traits.forEach(trait => {
    const diff = (dataA[trait] || 50) - (dataB[trait] || 50);
    sumSquaredDiff += diff * diff;
  });

  const maxDistance = Math.sqrt(5 * 100 * 100); // Max possible distance
  const actualDistance = Math.sqrt(sumSquaredDiff);
  const similarity = Math.round((1 - actualDistance / maxDistance) * 100);

  return similarity;
};

function generateMatchReasons(profileA: any, profileB: any): string[] {
  const reasons: string[] = [];

  if (profileA.university === profileB.university) {
    reasons.push(`Same university: ${profileA.university}`);
  }

  if (profileA.budget && profileB.budget) {
    const diff = Math.abs(profileA.budget - profileB.budget);
    if (diff < 100) {
      reasons.push(`Similar budget (~$${profileA.budget}/mo)`);
    }
  }

  if (profileA.age && profileB.age) {
    const ageDiff = Math.abs(profileA.age - profileB.age);
    if (ageDiff <= 2) {
      reasons.push(`Close in age`);
    }
  }

  if (profileA.favorite_areas?.some((a: string) => profileB.favorite_areas?.includes(a))) {
    reasons.push(`Prefer same areas`);
  }

  return reasons.slice(0, 3);
}

export function useRoommateMatch(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);

      try {
        // Load current user's profile
        const { data: myProfile, error: profileError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!myProfile) {
          setMatches([]);
          setLoading(false);
          return;
        }

        // Determine matching case
        const hasAccommodation = myProfile.accommodation_status === 'have_dorm';
        const needsRoommateCurrentPlace = myProfile.needs_roommate_current_place === true;
        const needsDorm = myProfile.accommodation_status === 'need_dorm';
        const needsRoommateNewDorm = myProfile.needs_roommate_new_dorm === true;

        // Load all other students based on matching case
        let query = supabase
          .from("students")
          .select("*")
          .neq("user_id", userId);

        let eligibleStudents: any[] = [];

        if (hasAccommodation && needsRoommateCurrentPlace) {
          // Case 1: Has accommodation, needs roommate for current place
          // Match with students who also need roommate OR are looking for dorms
          const { data: allStudents, error: studentsError } = await query;
          if (studentsError) throw studentsError;
          
          eligibleStudents = (allStudents || []).filter(s => 
            s.needs_roommate_current_place === true || s.accommodation_status === 'need_dorm'
          );
        } else if (needsDorm && needsRoommateNewDorm) {
          // Case 2: Needs dorm + roommate for new dorm
          // Match with students who also need dorm + roommate with compatible preferences
          const { data: allStudents, error: studentsError } = await query;
          if (studentsError) throw studentsError;
          
          eligibleStudents = (allStudents || []).filter(s => 
            s.accommodation_status === 'need_dorm' && s.needs_roommate_new_dorm === true
          );
        } else {
          // Fallback: general matching
          const { data: allStudents, error: studentsError } = await query;
          if (studentsError) throw studentsError;
          eligibleStudents = allStudents || [];
        }

        if (eligibleStudents.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        // Compute similarity scores
        const scoredMatches = eligibleStudents.map(student => {
          const generalScore = computeSimilarity(myProfile, student);
          const personalityScore = computePersonalityCompatibility(myProfile, student);

          // If personality scores available, weight them 60/40
          const finalScore = personalityScore !== null 
            ? Math.round(generalScore * 0.4 + personalityScore * 0.6)
            : generalScore;

          return {
            ...student,
            matchScore: finalScore,
            generalMatchScore: generalScore,
            personalityMatchScore: personalityScore,
            hasPersonalityMatch: personalityScore !== null,
            matchReasons: generateMatchReasons(myProfile, student)
          };
        });

        // Sort by score and take top 10
        const topMatches = scoredMatches
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        setMatches(topMatches);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roommate matches:', error);
        setMatches([]);
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userId]);

  return { loading, matches };
}
