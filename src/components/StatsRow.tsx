import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export const StatsRow = () => {
  const [count, setCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count: verifiedCount } = await supabase
        .from('dorms')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'Verified');
      
      setCount(verifiedCount || 0);
    };

    fetchCount();

    const channel = supabase
      .channel('dorms-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dorms',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = count / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-8"
    >
      <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl glass">
        <span className="text-5xl font-bold gradient-text">{displayCount}</span>
        <span className="text-xl text-muted-foreground">verified dorms available</span>
      </div>
    </motion.div>
  );
};
