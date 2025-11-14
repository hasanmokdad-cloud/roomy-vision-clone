// Simple, transparent scoring/ranking for dorm recommendations.
// Combines: price fit, distance/uni match, amenities overlap, engagement signals.

export type Dorm = {
  id: string;
  dorm_name: string;
  monthly_price: number;
  university?: string | null;
  area?: string | null;
  room_types?: string | null;
  amenities?: string[] | null;
  verification_status?: string | null;
};

export type UserProfile = {
  budget?: number;
  preferred_university?: string | null;
  favorite_areas?: string[] | null;
  preferred_room_types?: string[] | null;
  preferred_amenities?: string[] | null;
  ai_confidence_score?: number | null;
};

export type EngagementSignals = {
  views?: number;
  favorites?: number;
  inquiries?: number;
};

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

export function scoreDorm(dorm: Dorm, user: UserProfile, signals: EngagementSignals = {}) {
  let score = 0;

  // 1) Budget fit (weight 0–0.4)
  if (user.budget && dorm.monthly_price > 0) {
    const ratio = dorm.monthly_price / user.budget;
    const fit = clamp(1 - ratio); // cheaper = closer to 1
    score += fit * 40;
  }

  // 2) University proximity (0–0.2)
  if (user.preferred_university && dorm.university) {
    if (dorm.university.toLowerCase().includes(user.preferred_university.toLowerCase())) {
      score += 20;
    }
  }

  // 3) Area preference (0–0.15)
  if (user.favorite_areas?.length && dorm.area) {
    const hit = user.favorite_areas.some(a => dorm.area!.toLowerCase().includes(a.toLowerCase()));
    if (hit) score += 15;
  }

  // 4) Room type (0–0.15)
  if (user.preferred_room_types?.length && dorm.room_types) {
    const hit = user.preferred_room_types.some(t => dorm.room_types!.toLowerCase().includes(t.toLowerCase()));
    if (hit) score += 15;
  }

  // 5) Amenities (0–0.1)
  if (user.preferred_amenities?.length && dorm.amenities?.length) {
    const matches = user.preferred_amenities.filter(a =>
      dorm.amenities!.some(amenity => amenity.toLowerCase().includes(a.toLowerCase()))
    ).length;
    score += clamp(matches / 4) * 10; // normalize by 4
  }

  // 6) Engagement bonus (0–0.1)
  const eng = (signals.favorites ?? 0) * 3 + (signals.inquiries ?? 0) * 2 + (signals.views ?? 0) * 0.2;
  score += clamp(eng / 100) * 10;

  // 7) AI confidence slight boost
  score += ((user.ai_confidence_score ?? 50) / 100) * 5;

  return Math.round(score);
}

export function rankDorms(
  dorms: Dorm[],
  user: UserProfile,
  signalsByDormId: Record<string, EngagementSignals> = {}
) {
  return dorms
    .map(d => ({ ...d, matchScore: scoreDorm(d, user, signalsByDormId[d.id]) }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
