import { useEffect, useState } from "react";
import { getMetricsSummary, getTrendSeries } from "@/ai-engine/analyticsAPI";

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [viewsTrend, setViewsTrend] = useState<any[]>([]);
  const [favoritesTrend, setFavoritesTrend] = useState<any[]>([]);
  const [inquiriesTrend, setInquiriesTrend] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await getMetricsSummary();
      const vt = await getTrendSeries("views");
      const ft = await getTrendSeries("favorites");
      const it = await getTrendSeries("inquiries");
      setSummary(s);
      setViewsTrend(vt);
      setFavoritesTrend(ft);
      setInquiriesTrend(it);
      setLoading(false);
    })();
  }, []);

  return { loading, summary, viewsTrend, favoritesTrend, inquiriesTrend };
}
