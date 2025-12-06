import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, TrendingUp, Activity, ArrowLeft, Star, MessageSquare, Users, Home } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminAiDiagnostics() {
  const { loading } = useRoleGuard("admin");
  const navigate = useNavigate();
  const [healthMetrics, setHealthMetrics] = useState({ roommate_accuracy: 0, dorm_accuracy: 0, chatbot_precision: 0, total_matches: 0, total_chats: 0, avg_feedback_score: 0 });
  const [matchTrends, setMatchTrends] = useState<any[]>([]);
  const [feedbackDistribution, setFeedbackDistribution] = useState<any[]>([]);

  useEffect(() => { loadDiagnostics(); }, []);

  const loadDiagnostics = async () => {
    const { data: matchLogs } = await supabase.from('ai_match_logs').select('*').order('created_at', { ascending: false }).limit(100);
    const { data: feedbacks } = await supabase.from('ai_feedback').select('*').order('created_at', { ascending: false }).limit(100);
    const { data: events } = await supabase.from('ai_events').select('*').order('created_at', { ascending: false }).limit(100);

    const roommateMatches = matchLogs?.filter(l => l.mode === 'roommate') || [];
    const dormMatches = matchLogs?.filter(l => l.mode === 'dorm') || [];
    const chatEvents = events?.filter(e => e.event_type === 'chat') || [];
    const avgFeedback = feedbacks && feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.helpful_score, 0) / feedbacks.length : 0;

    setHealthMetrics({
      roommate_accuracy: roommateMatches.length > 0 ? (roommateMatches.filter(m => m.result_count > 0).length / roommateMatches.length) * 100 : 0,
      dorm_accuracy: dormMatches.length > 0 ? (dormMatches.filter(m => m.result_count > 0).length / dormMatches.length) * 100 : 0,
      chatbot_precision: avgFeedback > 0 ? (avgFeedback / 5) * 100 : 0,
      total_matches: matchLogs?.length || 0,
      total_chats: chatEvents.length,
      avg_feedback_score: avgFeedback,
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - (6 - i)); return date.toISOString().split('T')[0]; });
    const trends = last7Days.map(date => {
      const dayLogs = matchLogs?.filter(l => l.created_at?.startsWith(date)) || [];
      return { date: date.split('-')[2] + '/' + date.split('-')[1], dorm: dayLogs.filter(l => l.mode === 'dorm').length, roommate: dayLogs.filter(l => l.mode === 'roommate').length };
    });
    setMatchTrends(trends);

    const distribution = [1, 2, 3, 4, 5].map(score => ({ score: `${score} ⭐`, count: feedbacks?.filter(f => f.helpful_score === score).length || 0 }));
    setFeedbackDistribution(distribution);
  };

  if (loading) return <AdminLayout><div className="min-h-screen flex items-center justify-center"><p className="text-foreground/60">Loading diagnostics...</p></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2"><ArrowLeft className="w-4 h-4" />Back to Dashboard</Button>
        <h1 className="text-xl font-bold gradient-text">AI Diagnostics</h1>

        <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" />AI Health Report</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10"><Brain className="w-8 h-8 mx-auto mb-2 text-violet-500" /><p className="text-3xl font-bold">{healthMetrics.roommate_accuracy.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Roommate Match Accuracy</p></div>
              <div className="text-center p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10"><Home className="w-8 h-8 mx-auto mb-2 text-cyan-500" /><p className="text-3xl font-bold">{healthMetrics.dorm_accuracy.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Dorm Match Accuracy</p></div>
              <div className="text-center p-6 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10"><MessageSquare className="w-8 h-8 mx-auto mb-2 text-emerald-500" /><p className="text-3xl font-bold">{healthMetrics.chatbot_precision.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Chatbot Precision</p></div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-foreground">{healthMetrics.total_matches}</p><p className="text-xs text-muted-foreground">Total Matches</p></div>
              <div><p className="text-2xl font-bold text-foreground">{healthMetrics.total_chats}</p><p className="text-xs text-muted-foreground">Chat Sessions</p></div>
              <div><p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">{healthMetrics.avg_feedback_score.toFixed(1)} <Star className="w-4 h-4 text-yellow-500" /></p><p className="text-xs text-muted-foreground">Avg Feedback</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" />Match Trends (Last 7 Days)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={matchTrends}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" stroke="hsl(var(--foreground))" /><YAxis stroke="hsl(var(--foreground))" /><Tooltip /><Legend /><Line type="monotone" dataKey="dorm" stroke="#8b5cf6" strokeWidth={2} /><Line type="monotone" dataKey="roommate" stroke="#06b6d4" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
          <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Feedback Distribution</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={feedbackDistribution}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="score" stroke="hsl(var(--foreground))" /><YAxis stroke="hsl(var(--foreground))" /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        </div>
      </div>
    </AdminLayout>
  );
}