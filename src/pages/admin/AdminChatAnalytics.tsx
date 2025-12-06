import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminChatAnalytics() {
  const { loading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<string>('30days');
  const [loadingData, setLoadingData] = useState(true);
  const [busiestDorms, setBusiestDorms] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) loadAnalytics();
  }, [dateRange, loading]);

  const loadAnalytics = async () => {
    setLoadingData(true);
    try {
      const { data: conversations } = await supabase.from('conversations').select(`id, dorm_id, updated_at, messages(id)`).order('updated_at', { ascending: false }).limit(100);
      const dormIds = [...new Set(conversations?.map(c => c.dorm_id).filter(Boolean))];
      const { data: dorms } = await supabase.from('dorms').select('id, name, dorm_name').in('id', dormIds);

      const dormMap = new Map(dorms?.map(d => [d.id, d.name || d.dorm_name]) || []);
      const stats = new Map<string, any>();
      conversations?.forEach(conv => {
        if (!conv.dorm_id) return;
        const dormName = dormMap.get(conv.dorm_id) || 'Unknown Dorm';
        const existing = stats.get(conv.dorm_id) || { name: dormName, conversations: 0, messages: 0 };
        existing.conversations += 1;
        existing.messages += conv.messages?.length || 0;
        stats.set(conv.dorm_id, existing);
      });
      setBusiestDorms(Array.from(stats.values()).sort((a, b) => b.messages - a.messages).slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) return <AdminLayout><div className="min-h-screen flex items-center justify-center"><p className="text-foreground/60">Loading analytics...</p></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/chats')}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /><h2 className="text-xl font-bold gradient-text">Chat Analytics</h2></div>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="7days">Last 7 Days</SelectItem><SelectItem value="30days">Last 30 Days</SelectItem></SelectContent></Select>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Busiest Dorms</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={busiestDorms}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="conversations" fill="#8b5cf6" name="Conversations" /><Bar dataKey="messages" fill="#ec4899" name="Messages" /></BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}