import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { motion } from "framer-motion";

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  capacity: number | null;
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
      const { data: dormData } = await supabase
        .from("dorms")
        .select("name")
        .eq("id", dormId)
        .single();
      
      if (dormData) setDormName(dormData.name);

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
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/owner")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">
                  Rooms - {dormName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage rooms in this property</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/owner/dorms/${dormId}/rooms/new`)}
              className="gap-2 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </motion.div>

          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 mb-4">
                    No rooms added yet. Start by adding your first room.
                  </p>
                  <Button
                    onClick={() => navigate(`/owner/dorms/${dormId}/rooms/new`)}
                    className="gap-2 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Room
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="rounded-2xl shadow-sm hover:scale-[1.02] transition-transform overflow-hidden">
                    {room.images && room.images.length > 0 && (
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardContent className="p-4">
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">{room.name}</h3>
                      <div className="space-y-1 text-sm text-gray-500 mb-4">
                        <p>Type: {room.type}</p>
                        {room.capacity && <p>Capacity: {room.capacity} student(s)</p>}
                        <p className="text-lg font-bold text-gray-800">
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
                          className="flex-1 gap-2 rounded-xl"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRoom(room.id)}
                          className="gap-2 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}