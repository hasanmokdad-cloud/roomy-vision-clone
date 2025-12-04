import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { ArrowLeft, Download, Upload, DollarSign, ToggleLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export default function BulkRoomOps() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkPrice, setBulkPrice] = useState("");

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!owner) return;

      const { data: dorms } = await supabase
        .from("dorms")
        .select("id")
        .eq("owner_id", owner.id);

      if (!dorms) return;

      const dormIds = dorms.map(d => d.id);

      const { data, error } = await supabase
        .from("rooms")
        .select("*, dorms!inner(dorm_name, name)")
        .in("dorm_id", dormIds);

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

  const toggleRoomSelection = (roomId: string) => {
    const newSelection = new Set(selectedRooms);
    if (newSelection.has(roomId)) {
      newSelection.delete(roomId);
    } else {
      newSelection.add(roomId);
    }
    setSelectedRooms(newSelection);
  };

  const selectAll = () => {
    setSelectedRooms(new Set(rooms.map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedRooms(new Set());
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPrice || selectedRooms.size === 0) {
      toast({
        title: "Error",
        description: "Please enter a price and select rooms",
        variant: "destructive",
      });
      return;
    }

    try {
      const price = parseFloat(bulkPrice);
      const roomIds = Array.from(selectedRooms);

      const { error } = await supabase
        .from("rooms")
        .update({ price })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated price for ${roomIds.length} rooms`,
      });

      loadRooms();
      setBulkPrice("");
      setSelectedRooms(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkAvailabilityUpdate = async (available: boolean) => {
    if (selectedRooms.size === 0) {
      toast({
        title: "Error",
        description: "Please select rooms",
        variant: "destructive",
      });
      return;
    }

    try {
      const roomIds = Array.from(selectedRooms);

      const { error } = await supabase
        .from("rooms")
        .update({ available })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated availability for ${roomIds.length} rooms`,
      });

      loadRooms();
      setSelectedRooms(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["Room ID", "Dorm", "Room Name", "Type", "Price", "Area (m²)", "Available"];
    const rows = rooms.map(room => [
      room.id,
      room.dorms?.dorm_name || room.dorms?.name || "",
      room.name,
      room.type,
      room.price,
      room.area_m2 || "",
      room.available ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooms-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Rooms exported to CSV",
    });
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").slice(1);
        const updates: any[] = [];

        for (const line of lines) {
          const [id, , , , price, , available] = line.split(",");
          if (id && price) {
            updates.push({
              id: id.trim(),
              price: parseFloat(price.trim()),
              available: available?.trim().toLowerCase() === "yes"
            });
          }
        }

        for (const update of updates) {
          await supabase
            .from("rooms")
            .update({ price: update.price, available: update.available })
            .eq("id", update.id);
        }

        toast({
          title: "Success",
          description: `Imported updates for ${updates.length} rooms`,
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
    reader.readAsText(file);
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/owner")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">Bulk Room Operations</h1>
              <p className="text-gray-500 text-sm mt-1">Update multiple rooms at once</p>
            </div>
          </motion.div>

          {/* CSV Import/Export */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">CSV Import/Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={exportToCSV} variant="outline" className="gap-2 rounded-xl">
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      className="hidden"
                      id="csv-import"
                    />
                    <Button
                      onClick={() => document.getElementById("csv-import")?.click()}
                      variant="outline"
                      className="gap-2 rounded-xl"
                    >
                      <Upload className="w-4 h-4" />
                      Import from CSV
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Export current rooms to CSV, edit in spreadsheet software, then re-import
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bulk Operations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">Bulk Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Selected: {selectedRooms.size} of {rooms.length} rooms
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAll} className="rounded-xl">
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={deselectAll} className="rounded-xl">
                      Deselect All
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bulk Price Update */}
                  <div className="space-y-3">
                    <Label className="text-gray-700">Update Price</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        placeholder="New price"
                        className="rounded-xl"
                      />
                      <Button 
                        onClick={handleBulkPriceUpdate} 
                        className="gap-2 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                      >
                        <DollarSign className="w-4 h-4" />
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* Bulk Availability Update */}
                  <div className="space-y-3">
                    <Label className="text-gray-700">Update Availability</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBulkAvailabilityUpdate(true)}
                        variant="outline"
                        className="flex-1 gap-2 rounded-xl"
                      >
                        <ToggleLeft className="w-4 h-4" />
                        Mark Available
                      </Button>
                      <Button
                        onClick={() => handleBulkAvailabilityUpdate(false)}
                        variant="outline"
                        className="flex-1 gap-2 rounded-xl"
                      >
                        <ToggleLeft className="w-4 h-4" />
                        Mark Unavailable
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Room List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">All Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedRooms.has(room.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={selectedRooms.has(room.id)}
                          onCheckedChange={() => toggleRoomSelection(room.id)}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-700">{room.name}</h4>
                          <p className="text-sm text-gray-500">
                            {room.dorms?.dorm_name || room.dorms?.name} • {room.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-gray-800">${room.price}</div>
                          <div className="text-xs text-gray-500">per month</div>
                        </div>
                        <Badge variant={room.available ? "default" : "secondary"}>
                          {room.available ? "Available" : "Reserved"}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </OwnerLayout>
  );
}