// Comprehensive Compatibility Questions Data

export interface CompatibilityQuestion {
  id: number;
  text: string;
  category: 'lifestyle' | 'study_work' | 'personality' | 'similarity' | 'advanced';
  subcategory: string;
  weight: number;
  isAdvanced: boolean;
  displayOrder: number;
}

export const compatibilityQuestions: CompatibilityQuestion[] = [
  // Section A: Lifestyle Compatibility (10 questions)
  {
    id: 1,
    text: 'I am generally a clean and organized person',
    category: 'lifestyle',
    subcategory: 'cleanliness',
    weight: 1.5,
    isAdvanced: false,
    displayOrder: 1
  },
  {
    id: 2,
    text: 'I wash dishes and clean shared areas without reminders',
    category: 'lifestyle',
    subcategory: 'cleanliness',
    weight: 1.5,
    isAdvanced: false,
    displayOrder: 2
  },
  {
    id: 3,
    text: "I don't mind if my roommate is less clean than me",
    category: 'lifestyle',
    subcategory: 'cleanliness',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 3
  },
  {
    id: 4,
    text: 'I prefer a quiet environment most of the time',
    category: 'lifestyle',
    subcategory: 'noise',
    weight: 1.4,
    isAdvanced: false,
    displayOrder: 4
  },
  {
    id: 5,
    text: 'I am okay with noise (music, calls, etc.) during the day',
    category: 'lifestyle',
    subcategory: 'noise',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 5
  },
  {
    id: 6,
    text: 'I wake up early (before 9 AM)',
    category: 'lifestyle',
    subcategory: 'schedule',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 6
  },
  {
    id: 7,
    text: 'I stay up late (after 12 AM)',
    category: 'lifestyle',
    subcategory: 'schedule',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 7
  },
  {
    id: 8,
    text: 'I prefer hosting guests frequently',
    category: 'lifestyle',
    subcategory: 'social',
    weight: 1.1,
    isAdvanced: false,
    displayOrder: 8
  },
  {
    id: 9,
    text: 'I am comfortable if my roommate has guests',
    category: 'lifestyle',
    subcategory: 'social',
    weight: 1.1,
    isAdvanced: false,
    displayOrder: 9
  },
  {
    id: 10,
    text: 'I am comfortable sharing my belongings',
    category: 'lifestyle',
    subcategory: 'sharing',
    weight: 1.0,
    isAdvanced: false,
    displayOrder: 10
  },

  // Section B: Study & Work Style (4 questions)
  {
    id: 11,
    text: 'I study or work from my room regularly',
    category: 'study_work',
    subcategory: 'work_habits',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 11
  },
  {
    id: 12,
    text: 'I need silence when studying/working',
    category: 'study_work',
    subcategory: 'environment',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 12
  },
  {
    id: 13,
    text: "I don't mind different study schedules",
    category: 'study_work',
    subcategory: 'flexibility',
    weight: 1.1,
    isAdvanced: false,
    displayOrder: 13
  },
  {
    id: 14,
    text: 'I am okay with remote-class/call activity in the room',
    category: 'study_work',
    subcategory: 'environment',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 14
  },

  // Section C: Personality Traits (8 questions)
  {
    id: 15,
    text: 'I consider myself an extrovert',
    category: 'personality',
    subcategory: 'extraversion',
    weight: 1.0,
    isAdvanced: false,
    displayOrder: 15
  },
  {
    id: 16,
    text: 'I enjoy spending time alone',
    category: 'personality',
    subcategory: 'introversion',
    weight: 1.0,
    isAdvanced: false,
    displayOrder: 16
  },
  {
    id: 17,
    text: 'I get stressed/anxious easily',
    category: 'personality',
    subcategory: 'neuroticism',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 17
  },
  {
    id: 18,
    text: 'I handle conflicts calmly',
    category: 'personality',
    subcategory: 'agreeableness',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 18
  },
  {
    id: 19,
    text: 'I am open to new experiences',
    category: 'personality',
    subcategory: 'openness',
    weight: 1.0,
    isAdvanced: false,
    displayOrder: 19
  },
  {
    id: 20,
    text: 'I prefer a structured routine',
    category: 'personality',
    subcategory: 'conscientiousness',
    weight: 1.1,
    isAdvanced: false,
    displayOrder: 20
  },
  {
    id: 21,
    text: 'I adapt easily to changes',
    category: 'personality',
    subcategory: 'flexibility',
    weight: 1.1,
    isAdvanced: false,
    displayOrder: 21
  },
  {
    id: 22,
    text: 'I avoid drama and confrontations',
    category: 'personality',
    subcategory: 'agreeableness',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 22
  },

  // Section D: Roommate Similarity Preference (3 questions)
  {
    id: 23,
    text: 'I prefer a roommate who is similar to me',
    category: 'similarity',
    subcategory: 'preference',
    weight: 1.4,
    isAdvanced: false,
    displayOrder: 23
  },
  {
    id: 24,
    text: 'I am okay living with someone who is different',
    category: 'similarity',
    subcategory: 'tolerance',
    weight: 1.2,
    isAdvanced: false,
    displayOrder: 24
  },
  {
    id: 25,
    text: 'I would like a sociable/friendly roommate',
    category: 'similarity',
    subcategory: 'social',
    weight: 1.3,
    isAdvanced: false,
    displayOrder: 25
  },

  // Advanced Section (10 questions)
  {
    id: 26,
    text: 'I smoke / I am okay with a roommate who smokes',
    category: 'advanced',
    subcategory: 'substance',
    weight: 1.5,
    isAdvanced: true,
    displayOrder: 26
  },
  {
    id: 27,
    text: 'I drink alcohol / I am okay with a roommate who drinks',
    category: 'advanced',
    subcategory: 'substance',
    weight: 1.3,
    isAdvanced: true,
    displayOrder: 27
  },
  {
    id: 28,
    text: 'I am comfortable with roommates of different religions/cultures',
    category: 'advanced',
    subcategory: 'diversity',
    weight: 1.0,
    isAdvanced: true,
    displayOrder: 28
  },
  {
    id: 29,
    text: "I am okay with roommates' overnight guests",
    category: 'advanced',
    subcategory: 'privacy',
    weight: 1.2,
    isAdvanced: true,
    displayOrder: 29
  },
  {
    id: 30,
    text: 'I am okay sharing food and groceries',
    category: 'advanced',
    subcategory: 'sharing',
    weight: 1.0,
    isAdvanced: true,
    displayOrder: 30
  },
  {
    id: 31,
    text: 'I prefer warm rooms (AC/heater usage preference)',
    category: 'advanced',
    subcategory: 'temperature',
    weight: 0.8,
    isAdvanced: true,
    displayOrder: 31
  },
  {
    id: 32,
    text: 'I am comfortable living around pets',
    category: 'advanced',
    subcategory: 'pets',
    weight: 1.0,
    isAdvanced: true,
    displayOrder: 32
  },
  {
    id: 33,
    text: 'I am sensitive to scents (perfume, incense, etc.)',
    category: 'advanced',
    subcategory: 'environment',
    weight: 0.9,
    isAdvanced: true,
    displayOrder: 33
  },
  {
    id: 34,
    text: 'I prefer the room temperature to be cold',
    category: 'advanced',
    subcategory: 'temperature',
    weight: 0.8,
    isAdvanced: true,
    displayOrder: 34
  },
  {
    id: 35,
    text: 'I prefer the lights off at night',
    category: 'advanced',
    subcategory: 'sleep',
    weight: 1.0,
    isAdvanced: true,
    displayOrder: 35
  }
];

export const questionsByCategory = {
  lifestyle: compatibilityQuestions.filter(q => q.category === 'lifestyle' && !q.isAdvanced),
  study_work: compatibilityQuestions.filter(q => q.category === 'study_work' && !q.isAdvanced),
  personality: compatibilityQuestions.filter(q => q.category === 'personality' && !q.isAdvanced),
  similarity: compatibilityQuestions.filter(q => q.category === 'similarity' && !q.isAdvanced),
  advanced: compatibilityQuestions.filter(q => q.isAdvanced)
};

export const categoryLabels = {
  lifestyle: 'Lifestyle Compatibility',
  study_work: 'Study & Work Style',
  personality: 'Personality Traits',
  similarity: 'Roommate Similarity Preference',
  advanced: 'Advanced Compatibility'
};

export const categoryDescriptions = {
  lifestyle: 'How you live day-to-day - cleanliness, noise, schedule, and social habits',
  study_work: 'Your study and work environment preferences',
  personality: 'Core personality traits that affect how you interact with others',
  similarity: 'Whether you prefer similar or different roommates',
  advanced: 'Additional lifestyle factors for more detailed matching'
};
