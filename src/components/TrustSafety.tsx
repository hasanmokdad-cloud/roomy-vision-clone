import { motion } from 'framer-motion';

export const TrustSafety = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-12 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            No More Scams or Outdated Listings
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Our AI cross-checks every listing, detects fraud, and ensures you only see real, available dorms.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
