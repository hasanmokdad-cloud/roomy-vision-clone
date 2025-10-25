import { motion, useInView } from 'framer-motion';
import { DormCard } from './DormCard';
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Dorm {
  id: string;
  name: string;
  location: string;
  price: number;
  amenities: string[];
  image_url?: string;
}

export const DormListings = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [dorms, setDorms] = useState<any[]>([]);

  useEffect(() => {
    const fetchDorms = async () => {
      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .eq('verification_status', 'Verified')
        .limit(6);

      if (!error && data && data.length > 0) {
        const formattedDorms = data.map(dorm => ({
          image: dorm.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
          name: dorm.dorm_name || dorm.name,
          match: 90,
          location: dorm.area || dorm.location,
          price: Number(dorm.monthly_price || dorm.price),
          amenities: dorm.services_amenities?.split(',').map((a: string) => a.trim()) || dorm.amenities || [],
        }));
        setDorms(formattedDorms);
      }
    };

    fetchDorms();

    // Set up real-time listener
    const channel = supabase
      .channel('dorms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dorms'
        },
        () => {
          fetchDorms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section ref={ref} id="dorms" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 space-y-4"
        >
          <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm">
            <span className="text-accent">AI Recommendations</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold">Your Perfect Matches</h2>
          <p className="text-xl text-foreground/60">Personalized recommendations based on what matters to you</p>
        </motion.div>

        {dorms.length === 0 ? (
          <div className="text-center py-16 glass-hover rounded-2xl">
            <p className="text-xl text-foreground/60">No verified dorms available yet.</p>
            <p className="text-sm text-foreground/40 mt-2">Check back soon for new listings!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dorms.map((dorm, index) => (
              <DormCard key={dorm.name} {...dorm} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
