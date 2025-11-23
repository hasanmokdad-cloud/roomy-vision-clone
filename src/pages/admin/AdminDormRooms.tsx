import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, DollarSign, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminDormRooms() {
  const { dormId } = useParams();
  const navigate = useNavigate();
  const [dorm, setDorm] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [contactCounts, setContactCounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dormId) {
      loadData();
    }
  }, [dormId]);

  const loadData = async () => {
    setLoading(true);

    // Load dorm details
    const { data: dormData } = await supabase
      .from('dorms')
      .select('*')
      .eq('id', dormId)
      .single();
    
    setDorm(dormData);

    // Load rooms
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .eq('dorm_id', dormId)
      .order('price', { ascending: true });
    
    setRooms(roomsData || []);

    // Load contact tracking for each room
    if (roomsData) {
      const counts: Record<string, any> = {};
      
      for (const room of roomsData) {
        const { data: contactsData } = await supabase
          .from('room_contact_tracking')
          .select('*, students(full_name, email, profile_photo_url)')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false });
        
        counts[room.id] = {
          count: contactsData?.length || 0,
          students: contactsData || []
        };
      }
      
      setContactCounts(counts);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading rooms...</div>;
  }

  if (!dorm) {
    return <div className="text-center py-12">Dorm not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/dorms')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">{dorm.dorm_name || dorm.name}</h1>
          <p className="text-foreground/60 mt-1">{dorm.area || dorm.location}</p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-12 text-center">
          <Home className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Rooms Added</h3>
          <p className="text-foreground/60">This dorm doesn't have any rooms configured yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => {
            const contacts = contactCounts[room.id] || { count: 0, students: [] };
            
            return (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{room.name}</span>
                    <Badge variant={room.available ? 'default' : 'secondary'}>
                      {room.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {room.images && room.images.length > 0 && (
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">${room.price}/month</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-semibold">{room.capacity} person(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{room.type}</Badge>
                      {room.area_m2 && (
                        <Badge variant="outline">{room.area_m2}m²</Badge>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">Student Interest</h4>
                      <Badge variant="secondary">{contacts.count} contacts</Badge>
                    </div>
                    
                    {contacts.students.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {contacts.students.map((contact: any) => (
                          <div key={contact.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(contact.students as any)?.profile_photo_url} />
                              <AvatarFallback>
                                {(contact.students as any)?.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {(contact.students as any)?.full_name || contact.student_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {(contact.students as any)?.email || contact.student_email}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(contact.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No students have contacted about this room yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}