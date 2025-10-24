import { motion } from 'framer-motion';
import { Shield, RefreshCw, Users } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'Every dorm is verified by our team and AI before going live',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Availability',
    description: 'No outdated posts — AI updates listings in real-time',
  },
  {
    icon: Users,
    title: 'Safe Roommates',
    description: 'AI matches you with compatible, verified students',
  },
];

export const FeatureCards = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass glass-hover rounded-2xl p-8 group cursor-pointer"
            >
              <div className="mb-6 inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
