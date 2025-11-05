import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRef, Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-image.jpg';
import { ThreeHero } from './ThreeHero';
import { DormFinder } from '@/components/RoomyAI';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/utils/inputValidation';

export const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -100]);
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

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    
    if (trimmed.length < 2) {
      toast({
        title: 'Invalid search',
        description: 'Please enter at least 2 characters',
        variant: 'destructive'
      });
      return;
    }
    
    navigate(`/listings?search=${encodeURIComponent(trimmed)}`);
  };

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
            className="text-5xl md:text-7xl font-black leading-tight"
          >
            Find your perfect dorm{' '}
            <span className="gradient-text">— powered by AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl text-foreground/80 leading-relaxed"
          >
            No scams. No outdated listings. Just verified, available dorms matched to your lifestyle—<span className="font-bold text-primary">smarter, safer, faster.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="space-y-3"
          >
            <Button 
              onClick={() => {
                if (userId) {
                  setIsFinderOpen(true);
                } else {
                  window.location.href = '/ai-match';
                }
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-7 rounded-2xl hover:shadow-[0_0_40px_rgba(94,234,212,0.4)] transition-all duration-300 flex items-center justify-center gap-2 neon-glow text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Find My Dorm with AI
            </Button>
            <div className="glass-hover rounded-2xl p-6 space-y-4 border-2 border-primary/20">
              <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                <Search className="w-4 h-4" />
                <span>Ask Roomy AI:</span>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder='e.g., "Private room near LAU for $400/month"'
                  value={searchInput}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    const limited = sanitized.substring(0, 100);
                    setSearchInput(limited);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="bg-black/20 border-white/10 text-foreground placeholder:text-foreground/40 focus:border-primary/50 transition-all"
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-primary to-secondary text-white font-bold px-8 rounded-2xl hover:shadow-[0_0_40px_rgba(94,234,212,0.4)] transition-all duration-300 whitespace-nowrap neon-glow"
                >
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
          style={{ y: imageY }}
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
            className="rounded-3xl p-2 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
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
            className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-base font-black gradient-text">AI Matching</p>
                <p className="text-sm text-foreground/70 font-medium">95% accuracy</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};
