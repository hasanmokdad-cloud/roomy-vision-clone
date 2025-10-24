import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, TrendingUp, CheckCircle } from 'lucide-react';

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalDorms: 0,
    verifiedDorms: 0,
    totalStudents: 0,
    avgBudget: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [dormsRes, studentsRes] = await Promise.all([
      supabase.from('dorms').select('*', { count: 'exact' }),
      supabase.from('students').select('budget', { count: 'exact' }),
    ]);

    const verifiedCount = dormsRes.data?.filter(
      d => d.verification_status === 'Verified'
    ).length || 0;

    const avgBudget = studentsRes.data?.reduce((sum, s) => sum + (Number(s.budget) || 0), 0) / 
      (studentsRes.data?.length || 1) || 0;

    setStats({
      totalDorms: dormsRes.count || 0,
      verifiedDorms: verifiedCount,
      totalStudents: studentsRes.count || 0,
      avgBudget: Math.round(avgBudget),
    });
  };

  const statCards = [
    { title: 'Total Dorms', value: stats.totalDorms, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { title: 'Verified Dorms', value: stats.verifiedDorms, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-purple-500 to-pink-500' },
    { title: 'Avg Budget', value: `$${stats.avgBudget}`, icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-foreground/60 mt-2">Welcome to Roomy's admin management portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-hover rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60 mb-1">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="glass hover:bg-white/10 rounded-xl p-4 text-left transition-all">
            <h3 className="font-semibold mb-1">Add New Dorm</h3>
            <p className="text-sm text-foreground/60">Create a new listing</p>
          </button>
          <button className="glass hover:bg-white/10 rounded-xl p-4 text-left transition-all">
            <h3 className="font-semibold mb-1">Verify Listings</h3>
            <p className="text-sm text-foreground/60">Review pending dorms</p>
          </button>
          <button className="glass hover:bg-white/10 rounded-xl p-4 text-left transition-all">
            <h3 className="font-semibold mb-1">View Analytics</h3>
            <p className="text-sm text-foreground/60">Check platform insights</p>
          </button>
        </div>
      </div>
    </div>
  );
}
