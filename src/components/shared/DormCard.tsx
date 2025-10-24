import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Wifi, Home, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DormCardProps {
  dorm: {
    id: string;
    dorm_name: string;
    area?: string;
    university?: string;
    monthly_price?: number;
    services_amenities?: string;
    room_types?: string;
    verification_status?: string;
    image_url?: string;
  };
}

export default function DormCard({ dorm }: DormCardProps) {
  const openWhatsApp = () => {
    // Use default Roomy contact number - actual owner contact is protected
    const phone = '96181858026';
    const message = `Hi! I'm interested in "${dorm.dorm_name}" on Roomy.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const amenities = dorm.services_amenities?.split(',').slice(0, 4).map(a => a.trim()) || [];
  const primaryRoomType = dorm.room_types?.split(',')[0]?.trim() || 'Room Available';
  const isVerified = dorm.verification_status === 'Verified';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="glass-hover rounded-2xl overflow-hidden group h-full flex flex-col"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={dorm.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'}
          alt={dorm.dorm_name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {isVerified && (
          <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}

        <Badge variant="secondary" className="absolute top-4 right-4">
          {primaryRoomType}
        </Badge>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          <h3 className="text-xl font-bold">{dorm.dorm_name}</h3>
          
          {(dorm.area || dorm.university) && (
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <MapPin className="w-4 h-4" />
              <span>
                {dorm.area && dorm.university ? `${dorm.area} • ${dorm.university}` : dorm.area || dorm.university}
              </span>
            </div>
          )}

          {dorm.services_amenities && (
            <p className="text-sm text-foreground/70 line-clamp-2">
              {dorm.services_amenities.split('.')[0]}.
            </p>
          )}
        </div>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <div
                key={amenity}
                className="glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs"
              >
                <Wifi className="w-3 h-3 text-secondary" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-2 pt-2 border-t border-white/10">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold gradient-text">
            {dorm.monthly_price || 'Contact'}
          </span>
          {dorm.monthly_price && (
            <span className="text-sm text-foreground/60">/ month</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={openWhatsApp}
          >
            Contact
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-primary to-secondary"
            onClick={openWhatsApp}
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
