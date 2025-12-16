import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileSelector } from '../MobileSelector';
import type { StudentProfile } from '../ProfileHub';

interface CurrentAccommodationCardProps {
  profile: StudentProfile | null;
  userId: string;
  onProfileUpdated: () => void;
}

interface Dorm {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  capacity_occupied: number | null;
}

export function CurrentAccommodationCard({ profile, userId, onProfileUpdated }: CurrentAccommodationCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const [formData, setFormData] = useState({
    needDorm: profile?.accommodation_status === 'need_dorm' || !profile?.accommodation_status,
    currentDormId: profile?.current_dorm_id || '',
    currentRoomId: profile?.current_room_id || '',
  });

  // Load dorms on mount
  useEffect(() => {
    loadDorms();
  }, []);

  // Load rooms when dorm changes
  useEffect(() => {
    if (formData.currentDormId) {
      loadRooms(formData.currentDormId);
    } else {
      setRooms([]);
    }
  }, [formData.currentDormId]);

  const loadDorms = async () => {
    const { data, error } = await supabase
      .from('dorms')
      .select('id, name')
      .eq('verification_status', 'Verified')
      .order('name');

    if (!error && data) {
      setDorms(data);
    }
  };

  const loadRooms = async (dormId: string) => {
    setLoadingRooms(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, type, capacity, capacity_occupied')
      .eq('dorm_id', dormId)
      .order('name');

    if (!error && data) {
      setRooms(data);
    }
    setLoadingRooms(false);
  };

  const handleNeedDormToggle = async (needDorm: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          accommodation_status: needDorm ? 'need_dorm' : 'have_dorm',
        })
        .eq('user_id', userId);

      if (error) throw error;

      setFormData(prev => ({ ...prev, needDorm }));
      toast({ title: 'Saved' });
      onProfileUpdated();
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          current_dorm_id: formData.currentDormId || null,
          current_room_id: formData.currentRoomId || null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Accommodation info updated' });
      onProfileUpdated();
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentDormName = () => {
    if (!profile?.current_dorm_id) return null;
    const dorm = dorms.find(d => d.id === profile.current_dorm_id);
    return dorm?.name;
  };

  const formatRoomOption = (room: Room) => {
    return `${room.name} (${room.type}) — ${room.capacity_occupied || 0}/${room.capacity} occupied`;
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between active:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-orange-500" />
          </div>
          <span className="font-semibold text-foreground">Current Accommodation</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            Need Dorm: {formData.needDorm ? 'Yes' : 'No'}
          </Badge>
          {!formData.needDorm && (
            <Badge variant="secondary" className="text-xs">
              {getCurrentDormName() || 'Dorm: Not set'}
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/30"
          >
            <div className="p-4 space-y-4">
              {/* Need a dorm toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">Do you need a dorm?</p>
                  <p className="text-xs text-muted-foreground">
                    Turn off if you already have accommodation
                  </p>
                </div>
                <Switch
                  checked={formData.needDorm}
                  onCheckedChange={handleNeedDormToggle}
                  disabled={saving}
                />
              </div>

              {/* Current Dorm Selection (only if toggle OFF) */}
              {!formData.needDorm && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Your Current Dorm</label>
                    <MobileSelector
                      label="Dorm"
                      options={dorms.map(d => d.name)}
                      value={dorms.find(d => d.id === formData.currentDormId)?.name || ''}
                      onChange={(val) => {
                        const dorm = dorms.find(d => d.name === val);
                        setFormData(prev => ({
                          ...prev,
                          currentDormId: dorm?.id || '',
                          currentRoomId: '', // Reset room when dorm changes
                        }));
                      }}
                      searchable
                      placeholder="Select dorm"
                    />
                  </div>

                  {formData.currentDormId && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Your Room</label>
                      {loadingRooms ? (
                        <div className="h-10 bg-muted animate-pulse rounded-lg" />
                      ) : (
                        <MobileSelector
                          label="Room"
                          options={rooms.map(formatRoomOption)}
                          value={rooms.find(r => r.id === formData.currentRoomId) 
                            ? formatRoomOption(rooms.find(r => r.id === formData.currentRoomId)!)
                            : ''}
                          onChange={(val) => {
                            const room = rooms.find(r => formatRoomOption(r) === val);
                            setFormData(prev => ({ ...prev, currentRoomId: room?.id || '' }));
                          }}
                          placeholder="Select room"
                        />
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
