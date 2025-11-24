import { supabase } from "@/integrations/supabase/client";

export type SupportMeta = {
  first_name: string;
  last_name?: string | null;
  email: string;
  university?: string | null;
};

/**
 * Creates or reuses a support conversation between a student and admins
 * Returns conversation ID or null if failed
 */
export async function createSupportThreadAndMessage({
  senderUserId,
  messageText,
  meta,
}: {
  senderUserId: string;
  messageText: string;
  meta: SupportMeta;
}): Promise<string | null> {
  try {
    // 1. Get sender's student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", senderUserId)
      .maybeSingle();

    if (!student) {
      console.error("[SupportDM] No student record found for user:", senderUserId);
      return null;
    }

    // 2. Check if support conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_id", student.id)
      .eq("conversation_type", "support")
      .is("dorm_id", null)
      .is("owner_id", null)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      console.log("[SupportDM] Reusing existing conversation:", conversationId);
    } else {
      // 3. Create new support conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          student_id: student.id,
          owner_id: null,
          dorm_id: null,
          conversation_type: "support",
        })
        .select("id")
        .single();

      if (convError || !newConv) {
        console.error("[SupportDM] Failed to create conversation:", convError);
        return null;
      }

      conversationId = newConv.id;
      console.log("[SupportDM] Created new conversation:", conversationId);
    }

    // 4. Insert plain message text only
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderUserId,
      body: messageText,
      read: false,
      status: 'sent',
    });

    if (msgError) {
      console.error("[SupportDM] Failed to insert message:", msgError);
      return null;
    }

    console.log("[SupportDM] ✅ Support message sent successfully");
    return conversationId;
  } catch (error) {
    console.error("[SupportDM] Unexpected error:", error);
    return null;
  }
}

/**
 * Helper to find existing support conversation for a student
 */
export async function findExistingSupportConversation(
  studentUserId: string
): Promise<string | null> {
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", studentUserId)
    .maybeSingle();

  if (!student) return null;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_id", student.id)
    .eq("conversation_type", "support")
    .is("owner_id", null)
    .maybeSingle();

  return conv?.id || null;
}
