import { supabase } from "@/integrations/supabase/client";

export type MetricSummary = {
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
  uniqueUsers: number;
};

export async function logEvent(event: {
  type: "view" | "favorite" | "inquiry" | "chat";
  user_id?: string | null;
  dorm_id?: string | null;
  meta?: Record<string, any>;
}) {
  const { error } = await supabase.from("analytics_events").insert({
    type: event.type,
    user_id: event.user_id ?? null,
    dorm_id: event.dorm_id ?? null,
    meta: event.meta ?? {},
  });
  if (error) console.error("logEvent error:", error);
  return !error;
}

export async function getMetricsSummary(): Promise<MetricSummary> {
  const { data, error } = await supabase.rpc("analytics_summary");
  if (error) {
    console.error("analytics_summary error:", error);
    return { totalViews: 0, totalFavorites: 0, totalInquiries: 0, uniqueUsers: 0 };
  }
  return data as MetricSummary;
}

export async function getOwnerPerformance(ownerId: string) {
  // Aggregated per-dorm performance for an owner
  const { data, error } = await supabase
    .from("owner_performance_view")
    .select("*")
    .eq("owner_id", ownerId);
  if (error) {
    console.error("getOwnerPerformance error:", error);
    return [];
  }
  return data;
}

export async function getTrendSeries(metric: "views" | "favorites" | "inquiries", days = 30) {
  const { data, error } = await supabase.rpc("analytics_timeseries", {
    p_metric: metric,
    p_days: days,
  });
  if (error) {
    console.error("analytics_timeseries error:", error);
    return [];
  }
  return data as { date: string; value: number }[];
}
