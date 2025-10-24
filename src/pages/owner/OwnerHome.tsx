import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Eye, MessageCircle, TrendingUp } from 'lucide-react';

export default function OwnerHome() {
  const [stats, setStats] = useState({
    myDorms: 0,
    totalViews: 0,
    inquiries: 0,
    verified: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (owner) {
      const { data: dorms } = await supabase
        .from('dorms')
        .select('*')
        .eq('owner_id', owner.id);

      const verified = dorms?.filter(d => d.verification_status === 'Verified').length || 0;

      setStats({
        myDorms: dorms?.length || 0,
        totalViews: 0, // Would come from analytics
        inquiries: 0, // Would come from ai_recommendations_log
        verified,
      });
    }
  };

  const statCards = [
    { title: 'My Listings', value: stats.myDorms, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'from-green-500 to-emerald-500' },
    { title: 'Inquiries', value: stats.inquiries, icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { title: 'Verified', value: stats.verified, icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Owner Dashboard</h1>
        <p className="text-foreground/60 mt-2">Manage your dorm listings</p>
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
        <h2 className="text-xl font-bold mb-4">Welcome to Roomy Owner Portal</h2>
        <p className="text-foreground/60 mb-4">
          Manage your dorm listings, track performance, and connect with students looking for housing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-2">✨ Add New Listing</h3>
            <p className="text-sm text-foreground/60">Create a new dorm listing with photos and details</p>
          </div>
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-2">📊 View Statistics</h3>
            <p className="text-sm text-foreground/60">Track views, inquiries, and match rates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
