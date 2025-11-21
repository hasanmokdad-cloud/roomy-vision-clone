import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  area_m2: number | null;
  description: string | null;
  images: string[];
  available: boolean;
}

export default function DormRooms() {
  const { dormId } = useParams<{ dormId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dormName, setDormName] = useState("");

  useEffect(() => {
    loadRooms();
  }, [dormId]);

  const loadRooms = async () => {
    if (!dormId) return;
    
    setLoading(true);
    try {
      // Get dorm name
      const { data: dormData } = await supabase
        .from("dorms")
        .select("name")
        .eq("id", dormId)
        .single();
      
      if (dormData) setDormName(dormData.name);

      // Get rooms
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("dorm_id", dormId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      loadRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/owner/dorms")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            Rooms - {dormName}
          </h1>
        </div>
        <Button
          onClick={() => navigate(`/owner/dorms/${dormId}/rooms/new`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No rooms added yet. Start by adding your first room.
          </p>
          <Button
            onClick={() => navigate(`/owner/dorms/${dormId}/rooms/new`)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Room
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="p-4">
              {room.images && room.images.length > 0 && (
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p>Type: {room.type}</p>
                <p className="text-lg font-bold text-foreground">
                  ${room.price}/month
                </p>
                {room.area_m2 && <p>Area: {room.area_m2}m²</p>}
                <p className={room.available ? "text-green-600" : "text-red-600"}>
                  {room.available ? "Available" : "Unavailable"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/owner/dorms/${dormId}/rooms/${room.id}/edit`)}
                  className="flex-1 gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRoom(room.id)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
