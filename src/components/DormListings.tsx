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

const fallbackDorms = [
  {
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    name: 'Sunny Side Studios',
    match: 95,
    location: '5 min to LAU',
    price: 400,
    amenities: ['WiFi', 'Furnished', 'AC'],
  },
  {
    image: 'https://images.unsplash.com/photo-1502672260066-6bc35f0d3a1b?w=800&q=80',
    name: 'Campus Corner',
    match: 88,
    location: '3 min to NDU',
    price: 350,
    amenities: ['WiFi', 'Kitchen', 'Shared'],
  },
  {
    image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80',
    name: 'The Student Hub',
    match: 92,
    location: '10 min to USEK',
    price: 500,
    amenities: ['WiFi', 'Furnished', 'AC'],
  },
];

export const DormListings = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [dorms, setDorms] = useState(fallbackDorms);

  useEffect(() => {
    const fetchDorms = async () => {
      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .eq('available', true)
        .limit(6);

      if (!error && data && data.length > 0) {
        const formattedDorms = data.map(dorm => ({
          image: dorm.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
          name: dorm.name,
          match: 90,
          location: dorm.location,
          price: Number(dorm.price),
          amenities: dorm.amenities || [],
        }));
        setDorms(formattedDorms);
      }
    };

    fetchDorms();
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dorms.map((dorm, index) => (
            <DormCard key={dorm.name} {...dorm} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
