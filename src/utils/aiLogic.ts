import { questions } from "@/data/questions";

export const buildAiPrompt = (answers: Record<string, any>) => {
  const compiled = questions
    .map(q => `${q.text}: ${answers[q.id] ?? "N/A"}`)
    .join("\n");
  return `You are Roomy AI, an assistant that matches Lebanese university students to compatible dorms and roommates.
Use this information to suggest 3 suitable dorms and, if possible, ideal roommate profiles.\n\n${compiled}`;
};

export function generateReasonText(matchData: any): string {
  const reasons: string[] = [];
  
  if (matchData.monthly_price) {
    reasons.push(`Affordable at $${matchData.monthly_price}/month`);
  }
  
  if (matchData.university) {
    reasons.push(`Near ${matchData.university}`);
  }
  
  if (matchData.area) {
    reasons.push(`Located in ${matchData.area}`);
  }
  
  if (matchData.services_amenities) {
    reasons.push(`Great amenities`);
  }
  
  return reasons.length > 0 
    ? reasons.slice(0, 2).join(" • ") 
    : "Verified dorm with excellent facilities";
}
