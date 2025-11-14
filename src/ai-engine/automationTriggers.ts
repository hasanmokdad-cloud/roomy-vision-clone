// Rule-based automations: call this after nightly cron or on-demand in admin.
import { getOwnerPerformance } from "./analyticsAPI";

export type TriggerResult = {
  owner_id: string;
  dorm_id: string;
  reason: string;
  recommendedAction: string;
};

export async function evaluateOwnerAlerts(ownerId: string) {
  const perf = await getOwnerPerformance(ownerId);
  const alerts: TriggerResult[] = [];

  perf.forEach((row: any) => {
    // Example rule: views high but inquiries low → suggest improving photos/price
    const views = row.views ?? 0;
    const inquiries = row.inquiries ?? 0;
    if (views >= 50 && inquiries <= 1) {
      alerts.push({
        owner_id: ownerId,
        dorm_id: row.dorm_id,
        reason: "High views but low inquiries in last 7 days",
        recommendedAction: "Update room photos and review pricing; consider adding amenities keywords.",
      });
    }
  });

  return alerts;
}

export async function sendOwnerNotification(ownerId: string, payload: TriggerResult[]) {
  // Call Supabase Edge Function to deliver notifications
  const res = await fetch("/functions/v1/send-owner-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, alerts: payload }),
  });
  return res.ok;
}
