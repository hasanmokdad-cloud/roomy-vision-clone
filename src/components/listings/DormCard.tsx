import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RoomChoiceCluster from './RoomChoiceCluster';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createDormConversation } from '@/lib/conversationUtils';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  images?: string[];
}

interface DormCardProps {
  dorm: {
    id: string;
    dorm_name: string;
    area?: string;
    university?: string;
    verification_status?: string;
    cover_image?: string;
    image_url?: string;
    room_types_json?: RoomType[];
    owner_id?: string;
  };
  index?: number;
}

export default function DormCard({ dorm, index = 0 }: DormCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleContactOwner = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user is logged in and is a student
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact the owner',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Get owner's user_id
    if (!dorm.owner_id) {
      toast({
        title: 'Error',
        description: 'Owner information not available',
        variant: 'destructive',
      });
      return;
    }

    const { data: ownerData } = await supabase
      .from('owners')
      .select('user_id')
      .eq('id', dorm.owner_id)
      .single();

    if (!ownerData?.user_id) {
      toast({
        title: 'Error',
        description: 'Could not find owner contact information',
        variant: 'destructive',
      });
      return;
    }

    // Create or get conversation
    const conversationId = await createDormConversation(
      user.id,
      ownerData.user_id,
      dorm.dorm_name,
      dorm.area,
      dorm.university
    );

    if (conversationId) {
      navigate('/messages');
    } else {
      toast({
        title: 'Error',
        description: 'Could not create conversation',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rooms = dorm.room_types_json || [];
  const isVerified = dorm.verification_status === 'Verified';
  const coverImage = dorm.cover_image || dorm.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

  const handleMouseEnter = () => {
    if (!isMobile && rooms.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 200);
    }
  };

  const handleClick = () => {
    if (isMobile && rooms.length > 0) {
      setIsExpanded(true);
    } else if (rooms.length === 0) {
      navigate(`/dorm/${dorm.id}`);
    }
  };

  const handleViewDetails = (roomType?: string) => {
    const params = roomType ? `?room=${encodeURIComponent(roomType)}` : '';
    navigate(`/dorm/${dorm.id}${params}`);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative" ref={cardRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isExpanded && !isMobile ? 0.95 : 1,
          filter: isExpanded && !isMobile ? 'blur(2px)' : 'blur(0px)'
        }}
        transition={{ 
          duration: 0.3,
          delay: index * 0.05
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="glass-hover rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col group"
      >
        {/* Cover Image */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={coverImage}
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

          {rooms.length > 0 && (
            <Badge variant="secondary" className="absolute top-4 right-4">
              {rooms.length} Room {rooms.length === 1 ? 'Type' : 'Types'}
            </Badge>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-2">{dorm.dorm_name}</h3>
          
          {(dorm.area || dorm.university) && (
            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
              <MapPin className="w-4 h-4" />
              <span>
                {dorm.area && dorm.university ? `${dorm.area} • ${dorm.university}` : dorm.area || dorm.university}
              </span>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleContactOwner}
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Owner
            </Button>

            {rooms.length > 0 ? (
              <p className="text-xs text-center text-foreground/70">
                Or hover to explore rooms →
              </p>
            ) : (
              <p className="text-xs text-center text-foreground/70">
                Click for more details →
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Room Choice Cluster Overlay */}
      {rooms.length > 0 && (
        <RoomChoiceCluster
          rooms={rooms}
          dormName={dorm.dorm_name}
          dormArea={dorm.area}
          university={dorm.university}
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          onViewDetails={handleViewDetails}
          isMobile={isMobile}
        />
      )}

      {/* Desktop Backdrop Overlay */}
      {isExpanded && !isMobile && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-10"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
}
