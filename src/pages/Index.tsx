import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GradientBackdrop } from '@/components/GradientBackdrop';
import { StatsRow } from '@/components/StatsRow';
import { FeatureCards } from '@/components/FeatureCards';
import { TrustSafety } from '@/components/TrustSafety';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import AuthModal from '@/components/shared/AuthModal';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <GradientBackdrop />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full glass text-sm font-semibold text-primary mb-6">
              AI-Powered Platform
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-8 gradient-text"
          >
            Find your perfect dorm
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            No scams. No outdated listings. Just verified, available dorms matched to your lifestyle—smarter, safer, faster.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => setAuthOpen(true)}
              className="text-lg px-8 py-6 rounded-2xl hover:scale-105 transition-transform duration-300"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/listings')}
              className="text-lg px-8 py-6 rounded-2xl hover:scale-105 transition-transform duration-300"
            >
              Browse All Dorms
            </Button>
          </motion.div>
        </div>

        <StatsRow />
      </section>

      <TrustSafety />
      <FeatureCards />
      
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;
