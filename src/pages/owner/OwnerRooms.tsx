import { useState, useEffect } from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Home, DollarSign, Users, Edit, CheckCircle, XCircle, Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { OwnerTableSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { motion, AnimatePresence } from 'framer-motion';
import { PendingOccupantClaims } from '@/components/owner/PendingOccupantClaims';
import { RoomOccupantPreview } from '@/components/owner/RoomOccupantPreview';

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  capacity: number;
  capacity_occupied: number;
  roomy_confirmed_occupants: number;
  area_m2: number | null;
  description: string | null;
  images: string[];
  available: boolean;
}

interface DormWithRooms {
  id: string;
  name: string;
  dorm_name: string | null;
  area: string | null;
  verification_status: string | null;
  rooms: Room[];
}

export default function OwnerRooms() {
  const { userId } = useRoleGuard('owner');
  const [dorms, setDorms] = useState<DormWithRooms[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDorms, setExpandedDorms] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleClaimProcessed = () => {
    loadDormsWithRooms();
    setRefreshKey(prev => prev + 1); // Force RoomOccupantPreview to refresh
  };

  useEffect(() => {
    if (userId) {
      loadDormsWithRooms();
    }
  }, [userId]);


  const loadDormsWithRooms = async () => {
    try {
      const { data: ownerData } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId!)
        .single();

      if (!ownerData) return;
      
      setOwnerId(ownerData.id);

      // Fetch dorms
      const { data: dormsData, error: dormsError } = await supabase
        .from('dorms')
        .select('id, name, dorm_name, area, verification_status')
        .eq('owner_id', ownerData.id);

      if (dormsError) throw dormsError;

      // Fetch rooms for all dorms
      const dormsWithRooms: DormWithRooms[] = await Promise.all(
        (dormsData || []).map(async (dorm) => {
          const { data: roomsData } = await supabase
            .from('rooms')
            .select('*')
            .eq('dorm_id', dorm.id)
            .order('created_at', { ascending: true });

          return {
            ...dorm,
            rooms: (roomsData || []).map(room => ({
              id: room.id,
              name: room.name,
              type: room.type,
              price: Number(room.price),
              capacity: room.capacity || 1,
              capacity_occupied: room.capacity_occupied || 0,
              roomy_confirmed_occupants: room.roomy_confirmed_occupants || 0,
              area_m2: room.area_m2 ? Number(room.area_m2) : null,
              description: room.description,
              images: room.images || [],
              available: room.available ?? true,
            })),
          };
        })
      );

      setDorms(dormsWithRooms);
      
      // Auto-expand dorms with rooms
      const dormsWithRoomsIds = dormsWithRooms
        .filter(d => d.rooms.length > 0)
        .map(d => d.id);
      setExpandedDorms(new Set(dormsWithRoomsIds));
    } catch (error) {
      console.error('Error loading dorms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dorms and rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRoomAvailability = async (roomId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ available: !currentStatus })
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Room marked as ${!currentStatus ? 'available' : 'unavailable'}`,
      });

      loadDormsWithRooms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update room availability',
        variant: 'destructive',
      });
    }
  };

  const deleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });

      loadDormsWithRooms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  const toggleDormExpand = (dormId: string) => {
    setExpandedDorms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dormId)) {
        newSet.delete(dormId);
      } else {
        newSet.add(dormId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <OwnerTableSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <OwnerBreadcrumb items={[
            { label: 'My Listings', href: '/owner/listings' },
            { label: 'Room Management' }
          ]} />
          
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-foreground">Room Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage availability and details for all your rooms
            </p>
          </motion.div>

          {/* Pending Claims Section */}
          {ownerId && (
            <PendingOccupantClaims 
              ownerId={ownerId} 
              onClaimProcessed={handleClaimProcessed} 
            />
          )}

          {dorms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No dorms yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first dorm to start managing rooms
                  </p>
                  <Button 
                    onClick={() => navigate('/owner/add-dorm')}
                    className="bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                  >
                    Add Your First Dorm
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {dorms.map((dorm, index) => {
                const isExpanded = expandedDorms.has(dorm.id);
                
                return (
                  <motion.div
                    key={dorm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-2xl shadow-md overflow-hidden">
                      <CardHeader 
                        className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b cursor-pointer"
                        onClick={() => toggleDormExpand(dorm.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-semibold text-foreground mb-1">
                              {dorm.dorm_name || dorm.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{dorm.area}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}>
                              {dorm.verification_status || 'Pending'}
                            </Badge>
                            <Badge variant="outline" className="text-muted-foreground">
                              {dorm.rooms.length} {dorm.rooms.length === 1 ? 'room' : 'rooms'}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="p-6">
                              {dorm.rooms.length === 0 ? (
                                <div className="text-center py-8">
                                  <p className="text-muted-foreground mb-4">No rooms added yet</p>
                                  <Button 
                                    onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms/new`)}
                                    className="bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Room
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {dorm.rooms.map((room) => {
                                      const isAvailable = room.available;
                                      // Use roomy_confirmed_occupants for the occupancy bar
                                      const occupancyPercent = room.capacity > 0 
                                        ? (room.roomy_confirmed_occupants / room.capacity) * 100 
                                        : 0;
                                      
                                      return (
                                        <div
                                          key={room.id}
                                          className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                                            isAvailable
                                              ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5'
                                              : 'border-muted bg-muted/50 opacity-75'
                                          }`}
                                        >
                                          {/* Room Image */}
                                          {room.images && room.images.length > 0 && (
                                            <img
                                              src={room.images[0]}
                                              alt={room.name}
                                              className="w-full h-32 object-cover"
                                            />
                                          )}
                                          <div className="p-4">
                                          <div className="flex items-start justify-between mb-3">
                                            <div>
                                              <h4 className="font-bold text-lg text-foreground mb-1">{room.name}</h4>
                                              <p className="text-sm text-muted-foreground">{room.type}</p>
                                            </div>
                                            <div className="text-right">
                                              <div className="flex items-center gap-1 font-bold text-lg text-primary">
                                                <DollarSign className="w-4 h-4" />
                                                {room.price}
                                              </div>
                                              <span className="text-xs text-muted-foreground">/month</span>
                                            </div>
                                          </div>

                                          {/* Capacity - Show Roomy-confirmed occupants */}
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <Users className="w-4 h-4" />
                                            <span>{room.roomy_confirmed_occupants} / {room.capacity} confirmed via Roomy</span>
                                          </div>

                                          {/* Confirmed Occupants Preview */}
                                          <div className="mb-3">
                                            <RoomOccupantPreview key={`${room.id}-${refreshKey}`} roomId={room.id} />
                                          </div>

                                          {/* Occupancy bar */}
                                          <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all ${
                                                occupancyPercent >= 100 ? 'bg-red-500' :
                                                occupancyPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                              }`}
                                              style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                            />
                                          </div>

                                          <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-3">
                                              <Label
                                                htmlFor={`room-${room.id}`}
                                                className="flex items-center gap-2 cursor-pointer"
                                              >
                                                {isAvailable ? (
                                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                                ) : (
                                                  <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <span className="text-sm font-medium">
                                                  {isAvailable ? 'Available' : 'Unavailable'}
                                                </span>
                                              </Label>
                                              <Switch
                                                id={`room-${room.id}`}
                                                checked={isAvailable}
                                                onCheckedChange={() => toggleRoomAvailability(room.id, isAvailable)}
                                              />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms/${room.id}/edit`)}
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteRoom(room.id, room.name)}
                                                className="text-destructive hover:text-destructive"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Add Room Button */}
                                  <div className="mt-4 pt-4 border-t">
                                    <Button 
                                      onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms/new`)}
                                      variant="outline"
                                      className="rounded-xl"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Room
                                    </Button>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
