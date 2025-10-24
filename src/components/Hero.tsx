import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRef, Suspense, useState, useEffect } from 'react';
import heroImage from '@/assets/hero-image.jpg';
import { ThreeHero } from './ThreeHero';
import { DormFinder } from '@/components/RoomyAI';
import { supabase } from '@/integrations/supabase/client';

export const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <motion.section
      ref={ref}
      style={{ y, opacity }}
      className="min-h-screen flex items-center justify-center px-6 pt-32 pb-20 relative overflow-hidden"
    >
      <Suspense fallback={null}>
        <ThreeHero />
      </Suspense>
      
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-block"
          >
            <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
              <span className="text-foreground/80">AI-Powered Platform</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold leading-tight"
          >
            Find your perfect dorm{' '}
            <span className="gradient-text">— powered by AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg text-foreground/70 leading-relaxed"
          >
            No scams. No outdated listings. Just verified, available dorms matched to your lifestyle—smarter, safer, faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="space-y-3"
          >
            <Button 
              onClick={() => setIsFinderOpen(true)}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Find My Dorm
            </Button>
            <div className="glass-hover rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Search className="w-4 h-4" />
                <span>Ask Roomy AI:</span>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder='e.g., "Private room near LAU for $400/month"'
                  className="bg-black/20 border-white/10 text-foreground placeholder:text-foreground/40 focus:border-primary/50 transition-all"
                />
                <Button className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-8 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 whitespace-nowrap">
                  Search
                </Button>
              </div>
            </div>
          </motion.div>

          {userId && (
            <DormFinder 
              isOpen={isFinderOpen} 
              onClose={() => setIsFinderOpen(false)} 
              userId={userId} 
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background"
                />
              ))}
            </div>
            <p className="text-sm text-foreground/60">
              Trusted by <span className="text-primary font-semibold">800+</span> students in Jbeil
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="relative"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="glass-hover rounded-3xl p-2 glow-purple"
          >
            <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 overflow-hidden">
              <img
                src={heroImage}
                alt="Modern student living in Jbeil"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Floating card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute -bottom-6 -left-6 glass-hover p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Matching</p>
                <p className="text-xs text-foreground/60">95% accuracy</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};
