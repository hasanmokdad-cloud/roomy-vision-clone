import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compatibilityQuestions } from '@/data/compatibilityQuestions';

export interface CompatibilityScores {
  overallScore: number;
  lifestyleScore: number;
  studyScore: number;
  personalityScore: number;
  similarityScore: number;
  advancedScore: number | null;
}

export interface CompatibilityMatch {
  userId: string;
  fullName: string;
  age: number | null;
  university: string | null;
  major: string | null;
  gender: string | null;
  profilePhotoUrl: string | null;
  scores: CompatibilityScores;
  matchReasons: string[];
}

interface ResponseMap {
  [questionId: number]: number;
}

const calculateCategoryScore = (diff: number, weight: number): number => {
  if (weight === 0) return 0;
  return Math.round((1 - diff / weight) * 100);
};

export const computeCompatibility = (
  responses1: ResponseMap,
  responses2: ResponseMap,
  includeAdvanced: boolean = false
): CompatibilityScores => {
  const categoryScores = {
    lifestyle: { diff: 0, weight: 0 },
    study_work: { diff: 0, weight: 0 },
    personality: { diff: 0, weight: 0 },
    similarity: { diff: 0, weight: 0 },
    advanced: { diff: 0, weight: 0 }
  };

  let totalWeightedDiff = 0;
  let totalWeight = 0;

  const questionsToCompare = includeAdvanced 
    ? compatibilityQuestions 
    : compatibilityQuestions.filter(q => !q.isAdvanced);

  for (const question of questionsToCompare) {
    const r1 = responses1[question.id];
    const r2 = responses2[question.id];

    if (r1 === undefined || r2 === undefined) continue;

    // Normalize to 0-1 scale
    const norm1 = (r1 - 1) / 4;
    const norm2 = (r2 - 1) / 4;

    // Compute weighted distance
    const distance = Math.abs(norm1 - norm2);
    const weightedDistance = distance * question.weight;

    categoryScores[question.category].diff += weightedDistance;
    categoryScores[question.category].weight += question.weight;

    totalWeightedDiff += weightedDistance;
    totalWeight += question.weight;
  }

  const overallScore = totalWeight > 0 
    ? Math.round((1 - totalWeightedDiff / totalWeight) * 100) 
    : 0;

  return {
    overallScore,
    lifestyleScore: calculateCategoryScore(
      categoryScores.lifestyle.diff,
      categoryScores.lifestyle.weight
    ),
    studyScore: calculateCategoryScore(
      categoryScores.study_work.diff,
      categoryScores.study_work.weight
    ),
    personalityScore: calculateCategoryScore(
      categoryScores.personality.diff,
      categoryScores.personality.weight
    ),
    similarityScore: calculateCategoryScore(
      categoryScores.similarity.diff,
      categoryScores.similarity.weight
    ),
    advancedScore: includeAdvanced && categoryScores.advanced.weight > 0
      ? calculateCategoryScore(
          categoryScores.advanced.diff,
          categoryScores.advanced.weight
        )
      : null
  };
};

const generateMatchReasons = (
  scores: CompatibilityScores,
  responses1: ResponseMap,
  responses2: ResponseMap
): string[] => {
  const reasons: Array<{ text: string; score: number }> = [];

  // Check cleanliness (questions 1-3)
  const cleanlinessAvg = [1, 2, 3]
    .filter(id => responses1[id] && responses2[id])
    .reduce((sum, id) => {
      return sum + (5 - Math.abs(responses1[id] - responses2[id]));
    }, 0) / 3;
  
  if (cleanlinessAvg >= 4) {
    reasons.push({ text: 'Similar cleanliness standards', score: cleanlinessAvg });
  }

  // Check noise tolerance (questions 4-5)
  const noiseCompatibility = [4, 5]
    .filter(id => responses1[id] && responses2[id])
    .reduce((sum, id) => {
      return sum + (5 - Math.abs(responses1[id] - responses2[id]));
    }, 0) / 2;
  
  if (noiseCompatibility >= 4) {
    reasons.push({ text: 'Compatible noise preferences', score: noiseCompatibility });
  }

  // Check sleep schedule (questions 6-7)
  const scheduleCompatibility = [6, 7]
    .filter(id => responses1[id] && responses2[id])
    .reduce((sum, id) => {
      return sum + (5 - Math.abs(responses1[id] - responses2[id]));
    }, 0) / 2;
  
  if (scheduleCompatibility >= 4) {
    reasons.push({ text: 'Similar sleep schedules', score: scheduleCompatibility });
  }

  // Check social habits (questions 8-9)
  const socialCompatibility = [8, 9]
    .filter(id => responses1[id] && responses2[id])
    .reduce((sum, id) => {
      return sum + (5 - Math.abs(responses1[id] - responses2[id]));
    }, 0) / 2;
  
  if (socialCompatibility >= 4) {
    reasons.push({ text: 'Similar social habits', score: socialCompatibility });
  }

  // Check study environment (questions 11-12)
  const studyCompatibility = [11, 12]
    .filter(id => responses1[id] && responses2[id])
    .reduce((sum, id) => {
      return sum + (5 - Math.abs(responses1[id] - responses2[id]));
    }, 0) / 2;
  
  if (studyCompatibility >= 4) {
    reasons.push({ text: 'Compatible study environments', score: studyCompatibility });
  }

  // Check conflict handling (question 18)
  if (responses1[18] && responses2[18] && Math.abs(responses1[18] - responses2[18]) <= 1) {
    reasons.push({ text: 'Similar conflict resolution styles', score: 5 });
  }

  // High lifestyle score
  if (scores.lifestyleScore >= 85) {
    reasons.push({ text: 'Excellent lifestyle compatibility', score: scores.lifestyleScore / 20 });
  }

  // High personality score
  if (scores.personalityScore >= 85) {
    reasons.push({ text: 'Strong personality match', score: scores.personalityScore / 20 });
  }

  // Sort by score and take top 3
  return reasons
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(r => r.text);
};

export const useCompatibilityMatch = (userId?: string) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<CompatibilityMatch[]>([]);

  useEffect(() => {
    if (userId) {
      findMatches();
    }
  }, [userId]);

  const findMatches = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Get current user's profile and responses
      const { data: currentUser, error: userError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError || !currentUser) {
        console.error('Error fetching current user:', userError);
        setLoading(false);
        return;
      }

      // Check if user completed compatibility test
      if (!currentUser.compatibility_test_completed) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get current user's responses
      const { data: myResponses, error: responsesError } = await supabase
        .from('personality_responses')
        .select('question_id, response')
        .eq('user_id', userId);

      if (responsesError || !myResponses) {
        console.error('Error fetching responses:', responsesError);
        setLoading(false);
        return;
      }

      const myResponseMap: ResponseMap = {};
      myResponses.forEach(r => {
        myResponseMap[r.question_id] = r.response;
      });

      // Determine matching criteria based on user's roommate needs
      const needsRoommate = currentUser.needs_roommate_current_place || 
                           currentUser.needs_roommate_new_dorm;

      if (!needsRoommate) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Find other students who also need roommates and completed the test
      let query = supabase
        .from('students')
        .select('*')
        .neq('user_id', userId)
        .eq('compatibility_test_completed', true);

      // Case 1: User has accommodation, needs roommate for current place
      if (currentUser.needs_roommate_current_place) {
        query = query.or('needs_roommate_current_place.eq.true,accommodation_status.eq.need_dorm');
      }
      // Case 2: User needs dorm + roommate
      else if (currentUser.needs_roommate_new_dorm) {
        query = query.eq('needs_roommate_new_dorm', true);
      }

      const { data: potentialMatches, error: matchError } = await query;

      if (matchError || !potentialMatches) {
        console.error('Error fetching potential matches:', matchError);
        setLoading(false);
        return;
      }

      // Get all their responses
      const userIds = potentialMatches.map(m => m.user_id);
      const { data: allResponses } = await supabase
        .from('personality_responses')
        .select('user_id, question_id, response')
        .in('user_id', userIds);

      // Group responses by user
      const responsesByUser: Record<string, ResponseMap> = {};
      allResponses?.forEach(r => {
        if (!responsesByUser[r.user_id]) {
          responsesByUser[r.user_id] = {};
        }
        responsesByUser[r.user_id][r.question_id] = r.response;
      });

      // Compute compatibility scores
      const scoredMatches: CompatibilityMatch[] = potentialMatches
        .filter(student => responsesByUser[student.user_id]) // Only students with responses
        .map(student => {
          const includeAdvanced = currentUser.advanced_compatibility_enabled && 
                                 student.advanced_compatibility_enabled;
          
          const scores = computeCompatibility(
            myResponseMap,
            responsesByUser[student.user_id],
            includeAdvanced
          );

          const matchReasons = generateMatchReasons(
            scores,
            myResponseMap,
            responsesByUser[student.user_id]
          );

          return {
            userId: student.user_id,
            fullName: student.full_name,
            age: student.age,
            university: student.university,
            major: student.major,
            gender: student.gender,
            profilePhotoUrl: student.profile_photo_url,
            scores,
            matchReasons
          };
        })
        .sort((a, b) => b.scores.overallScore - a.scores.overallScore)
        .slice(0, 20); // Top 20 matches

      setMatches(scoredMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, matches, refetch: findMatches };
};
