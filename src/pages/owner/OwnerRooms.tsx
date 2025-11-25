import { useState, useEffect } from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Home, DollarSign, Users, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { RoomType } from '@/types/RoomType';

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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <OwnerSidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-background w-full">
        <OwnerSidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                Room Management
              </h1>
              <p className="text-foreground/70">
                Manage availability and details for all your rooms
              </p>
            </div>
          </div>

          {dorms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No dorms yet</h3>
                <p className="text-foreground/60 mb-6">
                  Add your first dorm to start managing rooms
                </p>
                <Button onClick={() => navigate('/owner/add-dorm')}>
                  Add Your First Dorm
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {dorms.map((dorm) => {
                const rooms: RoomType[] = dorm.room_types_json || [];
                
                return (
                  <Card key={dorm.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-1">
                            {dorm.dorm_name || dorm.name}
                          </CardTitle>
                          <p className="text-sm text-foreground/60">{dorm.area}</p>
                        </div>
                        <Badge variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}>
                          {dorm.verification_status || 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {rooms.length === 0 ? (
                        <div className="text-center py-8 text-foreground/60">
                          <p>No rooms added yet</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {rooms.map((room, index) => {
                            const isAvailable = room.available !== false;
                            
                            return (
                              <div
                                key={index}
                                className={`relative p-4 rounded-xl border-2 transition-all ${
                                  isAvailable
                                    ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5'
                                    : 'border-muted bg-muted/50 opacity-75'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-bold text-lg mb-1">{room.type}</h4>
                                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                                      <Users className="w-4 h-4" />
                                      <span>{room.capacity} {room.capacity === 1 ? 'student' : 'students'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 font-bold text-lg gradient-text">
                                      <DollarSign className="w-4 h-4" />
                                      {room.price}
                                    </div>
                                    <span className="text-xs text-foreground/60">/month</span>
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
                                      htmlFor={`room-${dorm.id}-${index}`}
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
                                      id={`room-${dorm.id}-${index}`}
                                      checked={isAvailable}
                                      onCheckedChange={() => toggleRoomAvailability(dorm.id, index, isAvailable)}
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
                );
              })}
            </div>
          )}
        </div>
      </main>
      </div>
    </SidebarProvider>
  );
}
