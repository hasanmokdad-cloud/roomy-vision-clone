import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminAnalytics() {
  const [priceByUniversity, setPriceByUniversity] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: dorms } = await supabase.from('dorms').select('*');
    
    if (dorms) {
      // Avg price by university
      const uniPrices: any = {};
      dorms.forEach(d => {
        const uni = d.university || 'Unknown';
        if (!uniPrices[uni]) uniPrices[uni] = { total: 0, count: 0 };
        uniPrices[uni].total += Number(d.monthly_price || d.price || 0);
        uniPrices[uni].count += 1;
      });
      
      const priceData = Object.keys(uniPrices).map(uni => ({
        university: uni,
        avgPrice: Math.round(uniPrices[uni].total / uniPrices[uni].count),
      }));
      setPriceByUniversity(priceData);

      // Room types distribution
      const typeCount: any = {};
      dorms.forEach(d => {
        const types = d.room_types?.split(',') || ['Unknown'];
        types.forEach((t: string) => {
          const type = t.trim();
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      });
      
      const roomData = Object.keys(typeCount).map(type => ({
        name: type,
        value: typeCount[type],
      }));
      setRoomTypes(roomData);
    }
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics & Insights</h1>
        <p className="text-foreground/60 mt-2">Platform performance and trends</p>
      </div>

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Average Price by University</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceByUniversity}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="university" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="avgPrice" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Room Types Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={roomTypes}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {roomTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
