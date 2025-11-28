// Big Five Personality Test Questions

export interface PersonalityQuestion {
  id: string;
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  text: string;
  reverse: boolean; // If true, score needs to be inverted
}

export const personalityQuestions: PersonalityQuestion[] = [
  // Openness to Experience (3 questions)
  { 
    id: 'O1', 
    trait: 'openness', 
    text: 'I enjoy trying new experiences and exploring new ideas', 
    reverse: false 
  },
  { 
    id: 'O2', 
    trait: 'openness', 
    text: 'I prefer routine and familiarity over variety', 
    reverse: true 
  },
  { 
    id: 'O3', 
    trait: 'openness', 
    text: 'I am curious about many different things', 
    reverse: false 
  },
  
  // Conscientiousness (3 questions)
  { 
    id: 'C1', 
    trait: 'conscientiousness', 
    text: 'I am always prepared and well-organized', 
    reverse: false 
  },
  { 
    id: 'C2', 
    trait: 'conscientiousness', 
    text: 'I often leave my things in a mess', 
    reverse: true 
  },
  { 
    id: 'C3', 
    trait: 'conscientiousness', 
    text: 'I pay close attention to details', 
    reverse: false 
  },
  
  // Extraversion (3 questions)
  { 
    id: 'E1', 
    trait: 'extraversion', 
    text: 'I feel energized when around other people', 
    reverse: false 
  },
  { 
    id: 'E2', 
    trait: 'extraversion', 
    text: 'I prefer spending time alone rather than in groups', 
    reverse: true 
  },
  { 
    id: 'E3', 
    trait: 'extraversion', 
    text: 'I am usually the life of the party', 
    reverse: false 
  },
  
  // Agreeableness (3 questions)
  { 
    id: 'A1', 
    trait: 'agreeableness', 
    text: 'I am genuinely interested in other people\'s problems and feelings', 
    reverse: false 
  },
  { 
    id: 'A2', 
    trait: 'agreeableness', 
    text: 'I often get into arguments with others', 
    reverse: true 
  },
  { 
    id: 'A3', 
    trait: 'agreeableness', 
    text: 'I am helpful and enjoy cooperating with others', 
    reverse: false 
  },
  
  // Neuroticism / Emotional Stability (3 questions)
  { 
    id: 'N1', 
    trait: 'neuroticism', 
    text: 'I get stressed out easily', 
    reverse: false 
  },
  { 
    id: 'N2', 
    trait: 'neuroticism', 
    text: 'I remain calm and composed under pressure', 
    reverse: true 
  },
  { 
    id: 'N3', 
    trait: 'neuroticism', 
    text: 'My mood tends to change frequently', 
    reverse: false 
  },
];
