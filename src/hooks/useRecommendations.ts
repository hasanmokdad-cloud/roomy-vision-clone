import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rankDorms } from "@/ai-engine/recommendationModel";

export function useRecommendations(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Load profile
      let user: any = {};
      if (userId) {
        const { data: student } = await supabase
          .from("students")
          .select("budget, preferred_university, favorite_areas, preferred_room_types, preferred_amenities, ai_confidence_score")
          .eq("user_id", userId)
          .maybeSingle();
        user = student ?? {};
      }

      // Load dorms
      const { data: dorms } = await supabase
        .from("dorms_public")
        .select("id, dorm_name, monthly_price, university, area, room_types, amenities, verification_status")
        .eq("verification_status", "Verified");

      // Load engagement signals (lightweight example view)
      const { data: signals } = await supabase
        .from("dorm_engagement_view")
        .select("dorm_id, views, favorites, inquiries");

      const signalsMap: Record<string, any> = {};
      (signals ?? []).forEach((s: any) => (signalsMap[s.dorm_id] = s));

      const ranked = rankDorms(dorms ?? [], user, signalsMap).slice(0, 8);
      setRecommendations(ranked);
      setLoading(false);
    })();
  }, [userId]);

  return { loading, recommendations };
}
