/**
 * Match Label Utilities
 * Provides human-readable labels for match scores
 */

export interface MatchLabel {
  label: string;
  color: string;
  description: string;
}

export const getMatchLabel = (score: number): MatchLabel => {
  if (score >= 90) {
    return {
      label: "Perfect match",
      color: "text-green-500",
      description: "Exceptional compatibility"
    };
  }
  if (score >= 80) {
    return {
      label: "Great match",
      color: "text-green-500",
      description: "Very high compatibility"
    };
  }
  if (score >= 70) {
    return {
      label: "Good match",
      color: "text-yellow-500",
      description: "Strong compatibility"
    };
  }
  if (score >= 60) {
    return {
      label: "Okay match",
      color: "text-orange-500",
      description: "Moderate compatibility"
    };
  }
  return {
    label: "Low compatibility",
    color: "text-red-500",
    description: "Limited compatibility"
  };
};

export const getDormMatchLabel = (score: number): MatchLabel => {
  if (score >= 90) {
    return {
      label: "Perfect dorm match",
      color: "text-green-500",
      description: "Exceeds all your preferences"
    };
  }
  if (score >= 80) {
    return {
      label: "Great dorm match",
      color: "text-green-500",
      description: "Fits most of your preferences"
    };
  }
  if (score >= 70) {
    return {
      label: "Good dorm match",
      color: "text-yellow-500",
      description: "Fits your key preferences"
    };
  }
  return {
    label: "Potential match",
    color: "text-orange-500",
    description: "Some preferences match"
  };
};

export const getBasicTierLabel = (): MatchLabel => {
  return {
    label: "Basic match",
    color: "text-muted-foreground",
    description: "Random match based on basic preferences"
  };
};
