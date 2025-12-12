import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { Sparkles, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

export default function About() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <UnderwaterScene />
      {!isMobile && <RoomyNavbar />}
      
      <main className="flex-1 container mx-auto px-4 py-16 mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 neon-glow">About Us</Badge>
            <h1 className="text-5xl md:text-7xl font-black gradient-text mb-6">
              Welcome to Roomy
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
              Smart Student Living — Making housing in Lebanon safer, smarter, and stress-free
            </p>
          </motion.div>

          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-hover rounded-3xl p-10 neon-border"
            >
              <h2 className="text-3xl font-black mb-6 gradient-text">Our Mission</h2>
              <p className="text-lg text-foreground/90 leading-relaxed">
                Roomy was created to solve the biggest problem facing students in Lebanon: finding safe, verified, and affordable housing without scams, outdated listings, or endless searching. We use AI to cross-check listings, match students with compatible roommates, and provide 3D virtual tours — making student housing transparent, trustworthy, and personalized.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-hover rounded-3xl p-10 neon-border"
            >
              <h2 className="text-3xl font-black mb-6 gradient-text">Why Roomy?</h2>
              <p className="text-lg text-foreground/90 leading-relaxed">
                Roomy is redefining student living across Lebanon. Our mission is to make finding housing simple, safe, and transparent — powered by AI verification and smart matching. Whether you're studying in Jbeil, Beirut, or beyond, Roomy ensures that every listing you see is real, verified, and tailored to your lifestyle.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-hover rounded-3xl p-10 group hover:neon-glow"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">AI-Powered Matching</h3>
                <p className="text-foreground/80 leading-relaxed">
                  Our intelligent algorithm learns your preferences, budget, and lifestyle to recommend the perfect dorms and compatible roommates
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-hover rounded-3xl p-10 group hover:neon-glow"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">Verified & Safe</h3>
                <p className="text-foreground/80 leading-relaxed">
                  Every listing is cross-checked by AI and our team to detect scams, fake photos, and outdated information — ensuring you only see real, available dorms
                </p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-hover rounded-3xl p-12 text-center neon-border neon-glow"
            >
              <h2 className="text-3xl font-black mb-6 gradient-text">Our Promise</h2>
              <p className="text-xl text-foreground/90 leading-relaxed mb-6 max-w-2xl mx-auto">
                We're committed to making student housing in Lebanon transparent, safe, and accessible. Every listing is verified. Every recommendation is personalized. Every student deserves to find a home they can trust.
              </p>
              <p className="text-2xl font-black gradient-text">
                Smart Living. Safe Housing. Simple Process. 🏠
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
