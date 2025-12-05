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
import { OwnerBreadcrumb } from "@/components/owner/OwnerBreadcrumb";
import { ArrowLeft, Download, Upload, DollarSign, ToggleLeft } from "lucide-react";
import { OwnerTableSkeleton } from "@/components/skeletons/OwnerSkeletons";
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
  const [ownerId, setOwnerId] = useState<string | null>(null);

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
      setOwnerId(owner.id);

      const { data: dorms } = await supabase
        .from("dorms")
        .select("id")
        .eq("owner_id", owner.id);

      if (!dorms || dorms.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const dormIds = dorms.map(d => d.id);

      const { data, error } = await supabase
        .from("rooms")
        .select("*, dorms!inner(id, dorm_name, name)")
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
    // Expanded headers matching RoomForm fields
    const headers = [
      "Room ID",
      "Dorm ID", 
      "Dorm Name",
      "Room Name",
      "Type",
      "Price",
      "Deposit",
      "Capacity",
      "Capacity Occupied",
      "Area (m²)",
      "Description",
      "Available"
    ];
    
    const rows = rooms.map(room => [
      room.id,
      room.dorm_id,
      room.dorms?.dorm_name || room.dorms?.name || "",
      room.name || "",
      room.type || "",
      room.price || "",
      room.deposit || "",
      room.capacity || "",
      room.capacity_occupied || 0,
      room.area_m2 || "",
      (room.description || "").replace(/,/g, ";").replace(/\n/g, " "), // Escape commas and newlines
      room.available ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooms-export-${new Date().toISOString().split("T")[0]}.csv`;
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
        const lines = csv.split("\n").slice(1); // Skip header
        const updates: any[] = [];

        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Parse CSV with proper handling
          const values = line.split(",");
          const [id, dormId, dormName, name, type, price, deposit, capacity, capacityOccupied, areaM2, description, available] = values;
          
          if (id && id.trim()) {
            const update: any = { id: id.trim() };
            
            if (price?.trim()) update.price = parseFloat(price.trim());
            if (deposit?.trim()) update.deposit = parseFloat(deposit.trim());
            if (capacity?.trim()) update.capacity = parseInt(capacity.trim());
            if (capacityOccupied?.trim()) update.capacity_occupied = parseInt(capacityOccupied.trim());
            if (areaM2?.trim()) update.area_m2 = parseFloat(areaM2.trim());
            if (name?.trim()) update.name = name.trim();
            if (type?.trim()) update.type = type.trim();
            if (description?.trim()) update.description = description.trim().replace(/;/g, ",");
            if (available?.trim()) update.available = available.trim().toLowerCase() === "yes";
            
            updates.push(update);
          }
        }

        let successCount = 0;
        for (const update of updates) {
          const { id, ...fields } = update;
          const { error } = await supabase
            .from("rooms")
            .update(fields)
            .eq("id", id);
          
          if (!error) successCount++;
        }

        toast({
          title: "Success",
          description: `Updated ${successCount} of ${updates.length} rooms`,
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
    
    // Reset the input
    e.target.value = "";
  };

  if (loading) {
    return (
      <OwnerLayout>
        <OwnerTableSkeleton />
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <OwnerBreadcrumb items={[{ label: 'Bulk Operations' }]} />
          
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
              <h1 className="text-3xl font-semibold text-foreground">Bulk Room Operations</h1>
              <p className="text-muted-foreground text-sm mt-1">Update multiple rooms at once</p>
            </div>
          </motion.div>

          {rooms.length === 0 ? (
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No rooms found. Add rooms to your dorms first.</p>
                <Button onClick={() => navigate("/owner/listings")} className="mt-4">
                  Go to Listings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* CSV Import/Export */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-2xl shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">CSV Import/Export</CardTitle>
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
                    <p className="text-sm text-muted-foreground">
                      Export current rooms to CSV, edit in spreadsheet software (Excel, Google Sheets), then re-import. 
                      Columns: Room ID, Dorm ID, Dorm Name, Room Name, Type, Price, Deposit, Capacity, Capacity Occupied, Area, Description, Available
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
                    <CardTitle className="text-xl font-semibold">Bulk Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
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
                        <Label>Update Price</Label>
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
                            className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
                          >
                            <DollarSign className="w-4 h-4" />
                            Apply
                          </Button>
                        </div>
                      </div>

                      {/* Bulk Availability Update */}
                      <div className="space-y-3">
                        <Label>Update Availability</Label>
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
                    <CardTitle className="text-xl font-semibold">All Rooms</CardTitle>
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
                              <h4 className="font-semibold text-foreground">{room.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {room.dorms?.dorm_name || room.dorms?.name} • {room.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-foreground">${room.price}</div>
                              <div className="text-xs text-muted-foreground">per month</div>
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
            </>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
