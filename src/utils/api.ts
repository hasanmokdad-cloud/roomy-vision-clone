import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all verified dorms from Supabase
 */
export async function fetchDorms() {
  try {
    const { data, error } = await supabase
      .from("dorms")
      .select("*")
      .eq("verification_status", "Verified")
      .order("monthly_price", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching dorms:", err);
    return [];
  }
}

/**
 * Create or update a user profile in Supabase
 */
export async function saveUserProfile(profileData: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("students")
      .upsert({
        user_id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error saving profile:", err);
    return null;
  }
}

/**
 * Calls the Roomy AI Supabase Edge Function to get an AI-generated reply.
 * Used by both AiChat.tsx and AiMatch.tsx.
 */
export async function fetchAiCompletion(
  message: string, 
  userId?: string,
  sessionId?: string
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("roomy-chat", {
      body: {
        message: message,
        userId: userId,
        sessionId: sessionId
      }
    });

    if (error) {
      console.error("AI request failed:", error);
      return "Error: AI service unavailable.";
    }

    return data?.response ?? "No response from AI.";
  } catch (err) {
    console.error("Error fetching AI completion:", err);
    return "Error: Unable to connect to AI service.";
  }
}

/**
 * Save AI questionnaire responses
 */
export async function saveAiResponses(userId: string, responses: Record<string, any>) {
  try {
    const { error } = await supabase
      .from("students_ai_responses")
      .insert({
        user_id: userId,
        responses: responses,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving AI responses:", err);
    return false;
  }
}
