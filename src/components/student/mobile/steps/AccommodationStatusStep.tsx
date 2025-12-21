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
import { Home, Search, Users, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
  capacity_occupied: number | null;
  roomy_confirmed_occupants: number | null;
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

  // Fetch rooms for selected dorm with occupancy data
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
          .select('id, name, type, capacity, capacity_occupied, roomy_confirmed_occupants')
          .eq('dorm_id', data.current_dorm_id)
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

  // Check if room can be selected (not fully booked via Roomy)
  const canSelectRoom = (room: Room): boolean => {
    const capacity = room.capacity || 1;
    const roomyConfirmed = room.roomy_confirmed_occupants || 0;
    return roomyConfirmed < capacity;
  };

  // Get room display with occupancy (showing roomy-confirmed count)
  const getRoomDisplay = (room: Room): string => {
    const capacity = room.capacity || 1;
    const roomyConfirmed = room.roomy_confirmed_occupants || 0;
    const typeLabel = room.type ? ` - ${room.type}` : '';
    return `${room.name}${typeLabel} (${roomyConfirmed}/${capacity} via Roomy)`;
  };

  // Check if selected room is single
  const selectedRoom = rooms.find(r => r.id === data.current_room_id);
  const isSingleRoom = selectedRoom?.type?.toLowerCase().includes('single') || 
                       selectedRoom?.type?.toLowerCase().includes('private') ||
                       selectedRoom?.capacity === 1;

  // Check if room is full by roomy_confirmed_occupants (for hiding roommate toggle)
  const isRoomFull = selectedRoom ? 
    (selectedRoom.roomy_confirmed_occupants || 0) >= (selectedRoom.capacity || 1) : 
    false;

  const statusOptions = [
    { 
      value: 'need_dorm', 
      label: 'Need Dorm', 
      icon: Search, 
      description: 'Looking for accommodation' 
    },
    { 
      value: 'have_dorm', 
      label: 'Have Dorm', 
      icon: Home, 
      description: 'Already have accommodation' 
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
              
              {/* Info about claim process */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-700 dark:text-amber-300">
                  After selecting your room, your claim will be sent to the owner for confirmation.
                </p>
              </div>
              
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

              {/* Room Dropdown with Occupancy */}
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
                      {rooms.map((room) => {
                        const canSelect = canSelectRoom(room);
                        const capacity = room.capacity || 1;
                        const occupied = room.capacity_occupied || 0;
                        
                        return (
                          <SelectItem 
                            key={room.id} 
                            value={room.id}
                            disabled={!canSelect}
                            className={!canSelect ? 'opacity-50' : ''}
                          >
                            <div className="flex items-center gap-2">
                              <span>{getRoomDisplay(room)}</span>
                              {!canSelect && (
                                <Badge variant="secondary" className="text-xs">
                                  Fully Reserved
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rooms showing (occupied/capacity). Rooms fully reserved via Roomy are disabled.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Roommate Search Toggle - Only show for have_dorm with non-single room and room not full */}
        {(data.accommodation_status === 'have_dorm' && data.current_room_id && !isSingleRoom && !isRoomFull) && (
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

        {/* Personality Matching Toggle - Only show if needs_roommate AND have_dorm with non-single room */}
        {data.needs_roommate && 
          data.accommodation_status === 'have_dorm' && 
          data.current_dorm_id && 
          data.current_room_id && 
          !isSingleRoom && 
          !isRoomFull && (
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
