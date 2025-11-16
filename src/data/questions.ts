// Lifestyle + personality survey for AI roommate & dorm matching

export type QuestionType = "scale" | "single" | "multi" | "number" | "text";

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
}

export const questions: Question[] = [
  { id: 1, text: "How social do you prefer your living environment to be?", type: "scale", options: ["Very quiet", "Moderate", "Very social"] },
  { id: 2, text: "What is your ideal study environment?", type: "single", options: ["Private desk", "Shared study room", "Café/library nearby"] },
  { id: 3, text: "Do you prefer waking up early or staying up late?", type: "single", options: ["Early bird", "Night owl"] },
  { id: 4, text: "How important is 24/7 electricity for you?", type: "scale", options: ["Not important", "Somewhat important", "Very important"] },
  { id: 5, text: "How often do you host friends or guests?", type: "scale", options: ["Never", "Sometimes", "Often"] },
  { id: 6, text: "Do you prefer a shared or single room?", type: "single", options: ["Shared", "Single"] },
  { id: 7, text: "What is your maximum monthly budget (USD)?", type: "number" },
  { id: 8, text: "How clean and organized do you keep your space?", type: "scale", options: ["Messy", "Average", "Very clean"] },
  { id: 9, text: "How frequently do you cook your own meals?", type: "scale", options: ["Never", "Sometimes", "Daily"] },
  { id: 10, text: "What type of roommate do you get along best with?", type: "multi", options: ["Quiet", "Talkative", "Studious", "Adventurous", "Organized", "Relaxed"] },
  { id: 11, text: "Do you smoke or drink?", type: "single", options: ["Neither", "Smoke", "Drink", "Both"] },
  { id: 12, text: "How important is air conditioning to you?", type: "scale", options: ["Not needed", "Nice to have", "Essential"] },
  { id: 13, text: "Would you rather live near the university or in a city area?", type: "single", options: ["Near campus", "City area"] },
  { id: 14, text: "What is your university year of study?", type: "number" },
  { id: 15, text: "What is your major or field of study?", type: "text" },
  { id: 16, text: "Do you prefer mixed-gender dorms or single-gender dorms?", type: "single", options: ["Mixed", "Male only", "Female only"] },
  { id: 17, text: "How tolerant are you to noise from roommates?", type: "scale", options: ["Not at all", "Somewhat", "Very tolerant"] },
  { id: 18, text: "What do you value most in a dorm?", type: "multi", options: ["Cleanliness", "Social life", "Facilities", "Proximity", "Quiet", "Price"] },
  { id: 19, text: "Do you have any allergies (dust, pets, etc.)?", type: "text" },
  { id: 20, text: "Would you like a dorm with a gym or fitness area?", type: "single", options: ["Yes", "No preference"] },
  { id: 21, text: "How important is internet speed for your studies?", type: "scale", options: ["Low", "Medium", "High"] },
  { id: 22, text: "Describe yourself in three words.", type: "text" },
  { id: 23, text: "How much time do you spend studying daily?", type: "scale", options: ["<1h", "1–3h", "3–5h", "5h+"] },
  { id: 24, text: "How do you prefer to handle conflicts with roommates?", type: "single", options: ["Talk directly", "Avoid", "Seek help from dorm admin"] },
  { id: 25, text: "What is your ideal roommate personality match?", type: "text" },
];

// Helper splits to group questions in the UI
export const profileQuestions = questions.filter(q =>
  [1, 2, 3, 4, 14, 15, 16, 17, 22, 25].includes(q.id)
);

export const preferenceQuestions = questions.filter(q =>
  [5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20, 21, 23, 24].includes(q.id)
);
