import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getTrendSeries } from "@/ai-engine/analyticsAPI";
import { forecast } from "@/ai-engine/trendPredictor";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function Trends() {
  const [trend, setTrend] = useState<{ date: string; value: number }[]>([]);
  const [projection, setProjection] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    (async () => {
      const series = await getTrendSeries("views", 30);
      setTrend(series);
      const pts = series.map((s, i) => ({ x: i + 1, y: s.value }));
      setProjection(forecast(pts, 7));
    })();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-black gradient-text">Demand Trends & Forecast</h1>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Views — last 30 days + 7-day forecast</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart>
              <XAxis dataKey="idx" type="number" domain={[1, 37]} />
              <YAxis />
              <Tooltip />
              <Line name="Actual" type="monotone" dataKey="value" data={trend.map((d, i) => ({ idx: i + 1, value: d.value }))} dot={false} />
              <Line name="Forecast" type="monotone" dataKey="value" data={projection.map(p => ({ idx: p.x, value: p.y }))} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
