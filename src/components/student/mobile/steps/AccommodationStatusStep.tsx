import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, Search, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AccommodationStatusStepProps {
  data: {
    accommodation_status: string;
    current_dorm_id: string;
    current_room_id: string;
    needs_roommate: boolean;
    enable_personality_matching: boolean;
  };
  onChange: (data: Partial<AccommodationStatusStepProps['data']>) => void;
}

interface Dorm {
  id: string;
  name: string;
  dorm_name: string | null;
}

interface Room {
  id: string;
  name: string;
  type: string | null;
  capacity: number | null;
}

const AccommodationStatusStep = ({ data, onChange }: AccommodationStatusStepProps) => {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Fetch verified dorms
  useEffect(() => {
    const fetchDorms = async () => {
      setLoadingDorms(true);
      try {
        const { data: dormsData } = await supabase
          .from('dorms')
          .select('id, name, dorm_name')
          .eq('verification_status', 'Verified')
          .eq('available', true)
          .order('name');
        
        setDorms(dormsData || []);
      } catch (error) {
        console.error('Error fetching dorms:', error);
      } finally {
        setLoadingDorms(false);
      }
    };

    if (data.accommodation_status === 'have_dorm') {
      fetchDorms();
    }
  }, [data.accommodation_status]);

  // Fetch rooms for selected dorm
  useEffect(() => {
    const fetchRooms = async () => {
      if (!data.current_dorm_id) {
        setRooms([]);
        return;
      }

      setLoadingRooms(true);
      try {
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('id, name, type, capacity')
          .eq('dorm_id', data.current_dorm_id)
          .eq('available', true)
          .order('name');
        
        setRooms(roomsData || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [data.current_dorm_id]);

  // Check if room is single (no roommate toggle needed)
  const selectedRoom = rooms.find(r => r.id === data.current_room_id);
  const isSingleRoom = selectedRoom?.type?.toLowerCase().includes('single') || 
                       selectedRoom?.type?.toLowerCase().includes('private') ||
                       selectedRoom?.capacity === 1;

  const statusOptions = [
    { 
      value: 'need_dorm', 
      label: 'I need a dorm', 
      icon: Search, 
      description: 'Looking for housing' 
    },
    { 
      value: 'have_dorm', 
      label: 'I already have a dorm', 
      icon: Home, 
      description: 'Currently housed' 
    }
  ];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Do you need a dorm?
        </h2>
        <p className="text-muted-foreground mb-8">
          Help us tailor your experience
        </p>

        {/* Accommodation Status */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-3">
            {statusOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ 
                  accommodation_status: option.value,
                  current_dorm_id: '',
                  current_room_id: ''
                })}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  data.accommodation_status === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  data.accommodation_status === option.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-6 h-6 ${
                    data.accommodation_status === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">{option.label}</span>
                  <span className="text-sm text-muted-foreground">{option.description}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Current Dorm Selection - Only show if have_dorm */}
        {data.accommodation_status === 'have_dorm' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 mb-6"
          >
            <div className="p-4 rounded-xl bg-muted/50 space-y-4">
              <h3 className="font-semibold text-foreground">Your Current Dorm</h3>
              
              {/* Dorm Dropdown */}
              <div>
                <Label className="text-sm font-medium">Select your dorm</Label>
                <Select
                  value={data.current_dorm_id}
                  onValueChange={(value) => onChange({ current_dorm_id: value, current_room_id: '' })}
                  disabled={loadingDorms}
                >
                  <SelectTrigger className="mt-1 h-12">
                    <SelectValue placeholder={loadingDorms ? "Loading dorms..." : "Select your dorm"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dorms.map((dorm) => (
                      <SelectItem key={dorm.id} value={dorm.id}>
                        {dorm.dorm_name || dorm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Dropdown */}
              {data.current_dorm_id && (
                <div>
                  <Label className="text-sm font-medium">Select your room</Label>
                  <Select
                    value={data.current_room_id}
                    onValueChange={(value) => onChange({ current_room_id: value })}
                    disabled={loadingRooms || rooms.length === 0}
                  >
                    <SelectTrigger className="mt-1 h-12">
                      <SelectValue placeholder={
                        loadingRooms ? "Loading rooms..." : 
                        rooms.length === 0 ? "No rooms available" : 
                        "Select your room"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} {room.type ? `(${room.type})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Roommate Search Toggle - Only show for have_dorm with non-single room OR need_dorm */}
        {(data.accommodation_status === 'need_dorm' || 
          (data.accommodation_status === 'have_dorm' && data.current_room_id && !isSingleRoom)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-xl bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground block">Looking for a roommate?</span>
                  <span className="text-sm text-muted-foreground">Find compatible roommates</span>
                </div>
              </div>
              <Switch
                checked={data.needs_roommate}
                onCheckedChange={(checked) => onChange({ needs_roommate: checked })}
              />
            </div>
          </motion.div>
        )}

        {/* Personality Matching Toggle */}
        {data.needs_roommate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground block">AI Personality Matching</span>
                  <span className="text-sm text-muted-foreground">Match based on compatibility</span>
                </div>
              </div>
              <Switch
                checked={data.enable_personality_matching}
                onCheckedChange={(checked) => onChange({ enable_personality_matching: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-8">
              Uses your lifestyle preferences to find the best roommate matches
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AccommodationStatusStep;
