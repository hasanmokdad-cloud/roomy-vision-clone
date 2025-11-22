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
  ai_confidence_score?: number;
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

      // Load current user's profile
      const { data: myProfile } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!myProfile) {
        setLoading(false);
        return;
      }

      // Load all other students
      const { data: allStudents } = await supabase
        .from("students")
        .select("user_id, full_name, profile_photo_url, university, age, gender, budget, preferred_university, favorite_areas, preferred_room_types, preferred_amenities, ai_confidence_score")
        .neq("user_id", userId);

      if (!allStudents) {
        setLoading(false);
        return;
      }

      // Compute similarity scores
      const scoredMatches = allStudents.map(student => ({
        ...student,
        matchScore: computeSimilarity(myProfile, student),
        matchReasons: generateMatchReasons(myProfile, student)
      }));

      // Sort by score and take top 10
      const topMatches = scoredMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      setMatches(topMatches);
      setLoading(false);
    };

    fetchMatches();
  }, [userId]);

  return { loading, matches };
}
