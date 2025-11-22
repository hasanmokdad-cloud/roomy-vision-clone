import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export function UserGrowthChart() {
  const [data, setData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrowthData();
  }, [timeRange]);

  const loadGrowthData = async () => {
    setLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get students by day
      const { data: students } = await supabase
        .from('students')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Get owners by day
      const { data: owners } = await supabase
        .from('owners')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Group by date
      const dataMap = new Map();
      
      students?.forEach(s => {
        const date = new Date(s.created_at).toISOString().split('T')[0];
        if (!dataMap.has(date)) {
          dataMap.set(date, { date, students: 0, owners: 0 });
        }
        dataMap.get(date).students++;
      });

      owners?.forEach(o => {
        const date = new Date(o.created_at).toISOString().split('T')[0];
        if (!dataMap.has(date)) {
          dataMap.set(date, { date, students: 0, owners: 0 });
        }
        dataMap.get(date).owners++;
      });

      const chartData = Array.from(dataMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

      setData(chartData);
    } catch (error) {
      console.error('Error loading growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            User Growth
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={timeRange === '7d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </Button>
            <Button
              size="sm"
              variant={timeRange === '30d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </Button>
            <Button
              size="sm"
              variant={timeRange === '90d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('90d')}
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Students"
              />
              <Line 
                type="monotone" 
                dataKey="owners" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Owners"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
