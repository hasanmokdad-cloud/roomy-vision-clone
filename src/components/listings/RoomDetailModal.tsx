import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoomType } from './RoomExpansion3D';
import { useNavigate } from 'react-router-dom';

interface RoomDetailModalProps {
  room: RoomType;
  dormId: string;
  dormName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RoomDetailModal({ room, dormId, dormName, isOpen, onClose }: RoomDetailModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl z-[91] overflow-hidden"
          >
            <div className="relative h-full flex flex-col max-h-[90vh]">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    {dormName}
                  </Badge>
                  <h2 className="text-3xl font-black gradient-text mb-2">{room.type}</h2>
                  <div className="flex items-center gap-4 text-foreground/60">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-semibold">${room.price}/month</span>
                    </div>
                  </div>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Room Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {room.amenities.slice(0, 8).map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-foreground/80">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-foreground/70">Monthly Price</span>
                    <span className="text-3xl font-black gradient-text">${room.price}</span>
                  </div>
                  <div className="text-sm text-foreground/60">
                    <p>✓ All utilities included</p>
                    <p>✓ No hidden fees</p>
                    <p>✓ Flexible move-in dates</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/dorm/${dormId}`)}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  >
                    View Full Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
