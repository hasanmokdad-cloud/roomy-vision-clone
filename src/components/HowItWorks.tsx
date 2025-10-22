import { motion, useInView } from 'framer-motion';
import { Search, Eye, Sparkles, CheckCircle } from 'lucide-react';
import { useRef } from 'react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Discover',
    description: 'Tell our AI what you need — budget, location, lifestyle preferences',
  },
  {
    number: '02',
    icon: Eye,
    title: '3D Tour',
    description: 'View verified listings with virtual tours and real photos',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Smart Match',
    description: 'AI recommends dorms AND potential roommates based on compatibility',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Secure Booking',
    description: 'Book with confidence — all listings are verified and scam-free',
  },
];

export const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 space-y-4"
        >
          <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm">
            <span className="text-accent">Simple Process</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold">How Roomy Works</h2>
          <p className="text-xl text-foreground/60">From discovery to move-in — simplified with AI</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-hover rounded-3xl p-8 relative overflow-hidden group"
            >
              {/* Gradient glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-6">
                <div className="text-6xl font-bold text-white/10">{step.number}</div>
                
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-purple">
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
