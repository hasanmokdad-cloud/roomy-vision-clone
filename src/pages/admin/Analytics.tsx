import { useAnalytics } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function Analytics() {
  const { loading, summary, viewsTrend, favoritesTrend, inquiriesTrend } = useAnalytics();

  if (loading) {
    return <div className="p-8 text-foreground/60">Loading analytics…</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-black gradient-text">Analytics Overview</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6"><p className="text-sm text-foreground/60">Total Views</p><p className="text-3xl font-bold">{summary?.totalViews ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-foreground/60">Total Favorites</p><p className="text-3xl font-bold">{summary?.totalFavorites ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-foreground/60">Total Inquiries</p><p className="text-3xl font-bold">{summary?.totalInquiries ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-foreground/60">Unique Users</p><p className="text-3xl font-bold">{summary?.uniqueUsers ?? 0}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Views (30 days)</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={viewsTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Favorites</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={favoritesTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inquiries</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={inquiriesTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
