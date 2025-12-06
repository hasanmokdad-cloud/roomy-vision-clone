import { useAnalytics } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function Analytics() {
  const navigate = useNavigate();
  const { loading, summary, viewsTrend, favoritesTrend, inquiriesTrend } = useAnalytics();

  if (loading) {
    return <AdminLayout><div className="p-8 text-foreground/60">Loading analytics…</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
        <h1 className="text-4xl font-black gradient-text">Analytics Overview</h1>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6"><p className="text-sm text-foreground/60">Total Views</p><p className="text-3xl font-bold">{summary?.totalViews ?? 0}</p></Card>
          <Card className="p-6"><p className="text-sm text-foreground/60">Total Favorites</p><p className="text-3xl font-bold">{summary?.totalFavorites ?? 0}</p></Card>
          <Card className="p-6"><p className="text-sm text-foreground/60">Total Inquiries</p><p className="text-3xl font-bold">{summary?.totalInquiries ?? 0}</p></Card>
          <Card className="p-6"><p className="text-sm text-foreground/60">Unique Users</p><p className="text-3xl font-bold">{summary?.uniqueUsers ?? 0}</p></Card>
        </div>
        <Card className="p-6"><h2 className="text-xl font-semibold mb-4">Views (30 days)</h2><div className="h-64"><ResponsiveContainer><LineChart data={viewsTrend}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" dot={false} /></LineChart></ResponsiveContainer></div></Card>
      </div>
    </AdminLayout>
  );
}