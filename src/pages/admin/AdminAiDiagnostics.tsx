import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, TrendingUp, Activity, ArrowLeft, Star, MessageSquare, Users, Home, RefreshCw } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminAiDiagnostics() {
  const { loading: roleLoading } = useRoleGuard("admin");
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({ 
    roommate_accuracy: 0, 
    dorm_accuracy: 0, 
    chatbot_precision: 0, 
    total_matches: 0, 
    total_chats: 0, 
    avg_feedback_score: 0 
  });
  const [matchTrends, setMatchTrends] = useState<any[]>([]);
  const [feedbackDistribution, setFeedbackDistribution] = useState<any[]>([]);

  const loadDiagnostics = useCallback(async () => {
    // Fetch all data in parallel
    const [matchLogsResult, feedbacksResult, eventsResult, chatLogsResult] = await Promise.all([
      supabase.from('ai_match_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('ai_feedback').select('*').order('created_at', { ascending: false }),
      supabase.from('ai_events').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }),
    ]);

    const matchLogs = matchLogsResult.data || [];
    const feedbacks = feedbacksResult.data || [];
    const events = eventsResult.data || [];
    const totalChatLogs = chatLogsResult.count || 0;

    // Calculate metrics
    const roommateMatches = matchLogs.filter(l => l.mode === 'roommate');
    const dormMatches = matchLogs.filter(l => l.mode === 'dorm');
    const chatEvents = events.filter(e => e.event_type === 'chat');
    
    // Calculate accuracy based on feedback if available
    const roommateFeedback = feedbacks.filter(f => f.ai_action === 'roommate_match');
    const dormFeedback = feedbacks.filter(f => f.ai_action === 'dorm_match');
    const chatFeedback = feedbacks.filter(f => f.ai_action === 'chat' || f.ai_action === 'chatbot');
    
    // Roommate accuracy: feedback-based if available, otherwise result_count > 0
    let roommateAccuracy = 0;
    if (roommateFeedback.length > 0) {
      const positiveRoommate = roommateFeedback.filter(f => f.helpful_score >= 4).length;
      roommateAccuracy = (positiveRoommate / roommateFeedback.length) * 100;
    } else if (roommateMatches.length > 0) {
      roommateAccuracy = (roommateMatches.filter(m => m.result_count > 0).length / roommateMatches.length) * 100;
    }

    // Dorm accuracy: feedback-based if available, otherwise result_count > 0
    let dormAccuracy = 0;
    if (dormFeedback.length > 0) {
      const positiveDorm = dormFeedback.filter(f => f.helpful_score >= 4).length;
      dormAccuracy = (positiveDorm / dormFeedback.length) * 100;
    } else if (dormMatches.length > 0) {
      dormAccuracy = (dormMatches.filter(m => m.result_count > 0).length / dormMatches.length) * 100;
    }

    // Chatbot precision: based on chat feedback or average feedback score
    let chatbotPrecision = 0;
    if (chatFeedback.length > 0) {
      const positiveChatFeedback = chatFeedback.filter(f => f.helpful_score >= 4).length;
      chatbotPrecision = (positiveChatFeedback / chatFeedback.length) * 100;
    } else if (feedbacks.length > 0) {
      const avgScore = feedbacks.reduce((sum, f) => sum + f.helpful_score, 0) / feedbacks.length;
      chatbotPrecision = (avgScore / 5) * 100;
    }

    // Average feedback
    const avgFeedback = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.helpful_score, 0) / feedbacks.length 
      : 0;

    // Total chats = chat_logs count + chat events
    const totalChats = totalChatLogs + chatEvents.length;

    setHealthMetrics({
      roommate_accuracy: roommateAccuracy,
      dorm_accuracy: dormAccuracy,
      chatbot_precision: chatbotPrecision,
      total_matches: matchLogs.length,
      total_chats: totalChats,
      avg_feedback_score: avgFeedback,
    });

    // Match trends - last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => { 
      const date = new Date(); 
      date.setDate(date.getDate() - (6 - i)); 
      return date.toISOString().split('T')[0]; 
    });
    
    const trends = last7Days.map(date => {
      const dayLogs = matchLogs.filter(l => l.created_at?.startsWith(date));
      return { 
        date: date.split('-')[2] + '/' + date.split('-')[1], 
        dorm: dayLogs.filter(l => l.mode === 'dorm').length, 
        roommate: dayLogs.filter(l => l.mode === 'roommate').length 
      };
    });
    setMatchTrends(trends);

    // Feedback distribution
    const distribution = [1, 2, 3, 4, 5].map(score => ({ 
      score: `${score} ⭐`, 
      count: feedbacks.filter(f => f.helpful_score === score).length 
    }));
    setFeedbackDistribution(distribution);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiagnostics();
    setRefreshing(false);
  };

  useEffect(() => { 
    loadDiagnostics(); 
  }, [loadDiagnostics]);

  if (roleLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-foreground/60">Loading diagnostics...</p>
        </div>
      </AdminLayout>
    );
  }

  const hasNoFeedback = feedbackDistribution.every(d => d.count === 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <h1 className="text-xl font-bold gradient-text">AI Diagnostics</h1>

        <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              AI Health Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10"
              >
                <Brain className="w-8 h-8 mx-auto mb-2 text-violet-500" />
                <p className="text-3xl font-bold">{healthMetrics.roommate_accuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Roommate Match Accuracy</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10"
              >
                <Home className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                <p className="text-3xl font-bold">{healthMetrics.dorm_accuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Dorm Match Accuracy</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-6 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10"
              >
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-3xl font-bold">{healthMetrics.chatbot_precision.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Chatbot Precision</p>
              </motion.div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.total_matches}</p>
                <p className="text-xs text-muted-foreground">Total Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.total_chats}</p>
                <p className="text-xs text-muted-foreground">Chat Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  {healthMetrics.avg_feedback_score > 0 ? healthMetrics.avg_feedback_score.toFixed(1) : '—'} 
                  <Star className="w-4 h-4 text-yellow-500" />
                </p>
                <p className="text-xs text-muted-foreground">Avg Feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Match Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={matchTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="dorm" stroke="#8b5cf6" strokeWidth={2} name="Dorm Matches" />
                  <Line type="monotone" dataKey="roommate" stroke="#06b6d4" strokeWidth={2} name="Roommate Matches" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Feedback Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasNoFeedback ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No feedback collected yet</p>
                    <p className="text-sm">Ratings will appear here as users provide feedback</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedbackDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="score" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
