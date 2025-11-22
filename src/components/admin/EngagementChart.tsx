import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function EngagementChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngagementData();
  }, []);

  const loadEngagementData = async () => {
    setLoading(true);
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const { data: events } = await supabase
        .from('analytics_events')
        .select('created_at, type')
        .gte('created_at', last30Days.toISOString());

      // Group by date and type
      const dataMap = new Map();
      
      events?.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dataMap.has(date)) {
          dataMap.set(date, { date, views: 0, favorites: 0, inquiries: 0 });
        }
        
        const dayData = dataMap.get(date);
        if (event.type === 'view') dayData.views++;
        if (event.type === 'favorite') dayData.favorites++;
        if (event.type === 'inquiry') dayData.inquiries++;
      });

      const chartData = Array.from(dataMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14) // Last 14 days
        .map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

      setData(chartData);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          User Engagement (Last 14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="views" fill="#8B5CF6" name="Views" />
              <Bar dataKey="favorites" fill="#EC4899" name="Favorites" />
              <Bar dataKey="inquiries" fill="#F59E0B" name="Inquiries" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
