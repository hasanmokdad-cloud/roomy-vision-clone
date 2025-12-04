import { useState, useEffect } from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Home, DollarSign, Users, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import type { RoomType } from '@/types/RoomType';
import { motion } from 'framer-motion';

export default function OwnerRooms() {
  const { userId } = useRoleGuard('owner');
  const [dorms, setDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      loadDorms();
    }
  }, [userId]);

  const loadDorms = async () => {
    try {
      const { data: ownerData } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId!)
        .single();

      if (!ownerData) return;

      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .eq('owner_id', ownerData.id);

      if (error) throw error;
      setDorms(data || []);
    } catch (error) {
      console.error('Error loading dorms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dorms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRoomAvailability = async (dormId: string, roomIndex: number, currentStatus: boolean) => {
    const dorm = dorms.find(d => d.id === dormId);
    if (!dorm?.room_types_json) return;

    const rooms = [...dorm.room_types_json];
    rooms[roomIndex] = { ...rooms[roomIndex], available: !currentStatus };

    const { error } = await supabase
      .from('dorms')
      .update({ room_types_json: rooms })
      .eq('id', dormId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update room availability',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Room marked as ${!currentStatus ? 'available' : 'unavailable'}`,
    });

    loadDorms();
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-gray-800">Room Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage availability and details for all your rooms
            </p>
          </motion.div>

          {dorms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No dorms yet</h3>
                  <p className="text-gray-500 mb-6">
                    Add your first dorm to start managing rooms
                  </p>
                  <Button 
                    onClick={() => navigate('/owner/dorms/new')}
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
                const rooms: RoomType[] = dorm.room_types_json || [];
                
                return (
                  <motion.div
                    key={dorm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] transition-transform">
                      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold text-gray-700 mb-1">
                              {dorm.dorm_name || dorm.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500">{dorm.area}</p>
                          </div>
                          <Badge variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}>
                            {dorm.verification_status || 'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {rooms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No rooms added yet</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room, roomIndex) => {
                              const isAvailable = room.available !== false;
                              
                              return (
                                <div
                                  key={roomIndex}
                                  className={`relative p-4 rounded-xl border-2 transition-all ${
                                    isAvailable
                                      ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5'
                                      : 'border-muted bg-muted/50 opacity-75'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-lg text-gray-700 mb-1">{room.type}</h4>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Users className="w-4 h-4" />
                                        <span>{room.capacity} {room.capacity === 1 ? 'student' : 'students'}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1 font-bold text-lg text-primary">
                                        <DollarSign className="w-4 h-4" />
                                        {room.price}
                                      </div>
                                      <span className="text-xs text-gray-500">/month</span>
                                    </div>
                                  </div>

                                  {room.amenities && room.amenities.length > 0 && (
                                    <div className="mb-3">
                                      <div className="flex flex-wrap gap-1">
                                        {room.amenities.slice(0, 3).map((amenity, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs">
                                            {amenity}
                                          </Badge>
                                        ))}
                                        {room.amenities.length > 3 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{room.amenities.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-3">
                                      <Label
                                        htmlFor={`room-${dorm.id}-${roomIndex}`}
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
                                        id={`room-${dorm.id}-${roomIndex}`}
                                        checked={isAvailable}
                                        onCheckedChange={() => toggleRoomAvailability(dorm.id, roomIndex, isAvailable)}
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/owner/edit-dorm/${dorm.id}`)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
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