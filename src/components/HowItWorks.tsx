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
    title: 'Reserve Direct',
    description: 'Reserve directly with verified dorm owners — no middlemen or hidden fees',
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
              className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 rounded-3xl p-10 group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-6xl font-bold text-foreground/10">{step.number}</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground gradient-text">{step.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
