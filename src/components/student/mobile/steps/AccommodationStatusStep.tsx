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
    current_apartment_id: string;
    current_bedroom_id: string;
    needs_roommate: boolean;
    enable_personality_matching: boolean;
  };
  onChange: (data: Partial<AccommodationStatusStepProps['data']>) => void;
}

interface Building {
  id: string;
  name: string;
  dorm_name: string | null;
  property_type: string | null;
}

interface Room {
  id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  capacity_occupied: number | null;
  roomy_confirmed_occupants: number | null;
}

interface Apartment {
  id: string;
  name: string;
  max_capacity: number;
  type: string | null;
}

interface Bedroom {
  id: string;
  name: string;
  base_capacity: number;
  max_capacity: number;
}

const AccommodationStatusStep = ({ data, onChange }: AccommodationStatusStepProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bedrooms, setBedrooms] = useState<Bedroom[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [loadingBedrooms, setLoadingBedrooms] = useState(false);

  const selectedBuilding = buildings.find(b => b.id === data.current_dorm_id);
  const buildingType = selectedBuilding?.property_type || '';

  // Determine what to show based on building type
  const showRoomDropdown = buildingType === 'dormitory';
  const showApartmentDropdown = buildingType === 'apartment' || buildingType === 'shared_apartment';
  const showHybridDropdown = buildingType === 'hybrid';

  useEffect(() => {
    const fetchBuildings = async () => {
      setLoadingBuildings(true);
      try {
        const { data: buildingsData } = await supabase
          .from('dorms')
          .select('id, name, dorm_name, property_type')
          .eq('verification_status', 'Verified')
          .eq('available', true)
          .order('name');
        
        setBuildings(buildingsData || []);
      } catch (error) {
        console.error('Error fetching buildings:', error);
      } finally {
        setLoadingBuildings(false);
      }
    };

    if (data.accommodation_status === 'have_dorm') {
      fetchBuildings();
    }
  }, [data.accommodation_status]);

  // Fetch rooms for dormitory or hybrid buildings
  useEffect(() => {
    const fetchRooms = async () => {
      if (!data.current_dorm_id || (!showRoomDropdown && !showHybridDropdown)) {
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
  }, [data.current_dorm_id, showRoomDropdown, showHybridDropdown]);

  // Fetch apartments for apartment/shared_apartment or hybrid buildings
  useEffect(() => {
    const fetchApartments = async () => {
      if (!data.current_dorm_id || (!showApartmentDropdown && !showHybridDropdown)) {
        setApartments([]);
        return;
      }
      setLoadingApartments(true);
      try {
        const { data: apartmentsData } = await supabase
          .from('apartments')
          .select('id, name, max_capacity, type')
          .eq('building_id', data.current_dorm_id)
          .order('name');
        setApartments(apartmentsData || []);
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoadingApartments(false);
      }
    };
    fetchApartments();
  }, [data.current_dorm_id, showApartmentDropdown, showHybridDropdown]);

  // Fetch bedrooms when apartment is selected
  useEffect(() => {
    const fetchBedrooms = async () => {
      if (!data.current_apartment_id) {
        setBedrooms([]);
        return;
      }
      setLoadingBedrooms(true);
      try {
        const { data: bedroomsData } = await supabase
          .from('bedrooms')
          .select('id, name, base_capacity, max_capacity')
          .eq('apartment_id', data.current_apartment_id)
          .order('name');
        setBedrooms(bedroomsData || []);
      } catch (error) {
        console.error('Error fetching bedrooms:', error);
      } finally {
        setLoadingBedrooms(false);
      }
    };
    fetchBedrooms();
  }, [data.current_apartment_id]);

  const canSelectRoom = (room: Room): boolean => {
    const capacity = room.capacity || 1;
    const roomyConfirmed = room.roomy_confirmed_occupants || 0;
    return roomyConfirmed < capacity;
  };

  const getRoomDisplay = (room: Room): string => {
    const capacity = room.capacity || 1;
    const roomyConfirmed = room.roomy_confirmed_occupants || 0;
    const typeLabel = room.type ? ` - ${room.type}` : '';
    return `${room.name}${typeLabel} (${roomyConfirmed}/${capacity} via Tenanters)`;
  };

  // Roommate toggle visibility logic
  const getShowRoommateToggle = (): boolean => {
    // For room-based selection (dormitory or hybrid room)
    if (data.current_room_id) {
      const selectedRoom = rooms.find(r => r.id === data.current_room_id);
      if (!selectedRoom) return false;
      const isSingle = selectedRoom.type?.toLowerCase().includes('single') || 
                       selectedRoom.type?.toLowerCase().includes('private') ||
                       selectedRoom.capacity === 1;
      if (isSingle) return false;
      const capacity = selectedRoom.capacity || 1;
      const occupied = (selectedRoom.roomy_confirmed_occupants || 0) + 1; // +1 for current user
      return occupied <= capacity - 1;
    }
    // For apartment-based selection
    if (data.current_apartment_id) {
      const selectedApt = apartments.find(a => a.id === data.current_apartment_id);
      if (!selectedApt) return false;
      // For apartments, check apartment-level capacity
      // We don't have occupied count on apartments table, so show toggle if max_capacity > 1
      return selectedApt.max_capacity > 1;
    }
    return false;
  };

  const showRoommateToggle = getShowRoommateToggle();

  // For hybrid buildings, combine rooms and apartments into one dropdown
  const hybridItems = showHybridDropdown ? [
    ...rooms.map(r => ({ id: r.id, label: getRoomDisplay(r), type: 'room' as const, disabled: !canSelectRoom(r) })),
    ...apartments.map(a => ({ id: a.id, label: `${a.name} (Apartment)`, type: 'apartment' as const, disabled: false })),
  ] : [];

  const [hybridSelectionType, setHybridSelectionType] = useState<'room' | 'apartment' | ''>('');

  const handleBuildingChange = (value: string) => {
    onChange({ 
      current_dorm_id: value, 
      current_room_id: '', 
      current_apartment_id: '',
      current_bedroom_id: '',
      needs_roommate: false,
      enable_personality_matching: false
    });
    setHybridSelectionType('');
  };

  const handleHybridSelect = (value: string) => {
    const item = hybridItems.find(i => i.id === value);
    if (!item) return;
    
    if (item.type === 'room') {
      setHybridSelectionType('room');
      onChange({ current_room_id: value, current_apartment_id: '', current_bedroom_id: '' });
    } else {
      setHybridSelectionType('apartment');
      onChange({ current_apartment_id: value, current_room_id: '', current_bedroom_id: '' });
    }
  };

  const statusOptions = [
    { 
      value: 'need_dorm', 
      label: 'Need Housing', 
      icon: Search, 
      description: 'Looking for accommodation' 
    },
    { 
      value: 'have_dorm', 
      label: 'Have Housing', 
      icon: Home, 
      description: 'Already have accommodation' 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              What is your current accommodation status?
            </h1>
            <p className="text-muted-foreground mt-2">
              Help us tailor your experience
            </p>
          </div>

          {/* Accommodation Status */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {statusOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onChange({ 
                    accommodation_status: option.value,
                    current_dorm_id: '',
                    current_room_id: '',
                    current_apartment_id: '',
                    current_bedroom_id: ''
                  })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all text-center ${
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
                  <div>
                    <span className="font-medium text-foreground block">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Current Housing Selection - Only show if have_dorm */}
          {data.accommodation_status === 'have_dorm' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 mb-8"
            >
              <div className="p-4 rounded-xl bg-muted/50 space-y-4">
                <h3 className="font-semibold text-foreground">Your Current Housing</h3>
                
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-700 dark:text-amber-300">
                    After selecting your room, your claim will be sent to the owner for confirmation.
                  </p>
                </div>
                
                {/* Building dropdown */}
                <div>
                  <Label className="text-sm font-medium">Select your housing building</Label>
                  <Select
                    value={data.current_dorm_id}
                    onValueChange={handleBuildingChange}
                    disabled={loadingBuildings}
                  >
                    <SelectTrigger className="mt-1 h-12">
                      <SelectValue placeholder={loadingBuildings ? "Loading buildings..." : "Select your housing building"} />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.dorm_name || building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dormitory building → Room dropdown */}
                {data.current_dorm_id && showRoomDropdown && (
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
                      Rooms showing (occupied/capacity). Rooms fully reserved via Tenanters are disabled.
                    </p>
                  </div>
                )}

                {/* Apartment/Shared Apartment building → Apartment dropdown */}
                {data.current_dorm_id && showApartmentDropdown && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Select your apartment</Label>
                      <Select
                        value={data.current_apartment_id}
                        onValueChange={(value) => onChange({ current_apartment_id: value, current_bedroom_id: '' })}
                        disabled={loadingApartments || apartments.length === 0}
                      >
                        <SelectTrigger className="mt-1 h-12">
                          <SelectValue placeholder={
                            loadingApartments ? "Loading apartments..." : 
                            apartments.length === 0 ? "No apartments available" : 
                            "Select your apartment"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {apartments.map((apt) => (
                            <SelectItem key={apt.id} value={apt.id}>
                              {apt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bedroom dropdown after apartment selection */}
                    {data.current_apartment_id && (
                      <div>
                        <Label className="text-sm font-medium">Select your bedroom</Label>
                        <Select
                          value={data.current_bedroom_id}
                          onValueChange={(value) => onChange({ current_bedroom_id: value })}
                          disabled={loadingBedrooms || bedrooms.length === 0}
                        >
                          <SelectTrigger className="mt-1 h-12">
                            <SelectValue placeholder={
                              loadingBedrooms ? "Loading bedrooms..." : 
                              bedrooms.length === 0 ? "No bedrooms available" : 
                              "Select your bedroom"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {bedrooms.map((bedroom) => (
                              <SelectItem key={bedroom.id} value={bedroom.id}>
                                {bedroom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {/* Hybrid building → Combined rental dropdown */}
                {data.current_dorm_id && showHybridDropdown && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Select your rental</Label>
                      <Select
                        value={data.current_room_id || data.current_apartment_id}
                        onValueChange={handleHybridSelect}
                        disabled={(loadingRooms && loadingApartments) || hybridItems.length === 0}
                      >
                        <SelectTrigger className="mt-1 h-12">
                          <SelectValue placeholder={
                            (loadingRooms || loadingApartments) ? "Loading rentals..." : 
                            hybridItems.length === 0 ? "No rentals available" : 
                            "Select your rental"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {hybridItems.map((item) => (
                            <SelectItem 
                              key={item.id} 
                              value={item.id}
                              disabled={item.disabled}
                              className={item.disabled ? 'opacity-50' : ''}
                            >
                              <div className="flex items-center gap-2">
                                <span>{item.label}</span>
                                {item.disabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    Fully Reserved
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bedroom dropdown if hybrid selection is apartment */}
                    {hybridSelectionType === 'apartment' && data.current_apartment_id && (
                      <div>
                        <Label className="text-sm font-medium">Select your bedroom</Label>
                        <Select
                          value={data.current_bedroom_id}
                          onValueChange={(value) => onChange({ current_bedroom_id: value })}
                          disabled={loadingBedrooms || bedrooms.length === 0}
                        >
                          <SelectTrigger className="mt-1 h-12">
                            <SelectValue placeholder={
                              loadingBedrooms ? "Loading bedrooms..." : 
                              bedrooms.length === 0 ? "No bedrooms available" : 
                              "Select your bedroom"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {bedrooms.map((bedroom) => (
                              <SelectItem key={bedroom.id} value={bedroom.id}>
                                {bedroom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Roommate Search Toggle */}
          {data.accommodation_status === 'have_dorm' && showRoommateToggle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-4 rounded-xl bg-muted/50"
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
          {data.needs_roommate && data.accommodation_status === 'have_dorm' && showRoommateToggle && (
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
    </div>
  );
};

export default AccommodationStatusStep;
