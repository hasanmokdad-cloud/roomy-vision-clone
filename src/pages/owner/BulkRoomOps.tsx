import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerBreadcrumb } from "@/components/owner/OwnerBreadcrumb";
import { ArrowLeft, Download, Upload, Building2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { OwnerTableSkeleton } from "@/components/skeletons/OwnerSkeletons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";

interface DormWithRooms {
  id: string;
  name: string;
  dorm_name: string | null;
  verification_status: string | null;
  rooms: RoomData[];
}

interface RoomData {
  id: string;
  name: string;
  price: number;
  deposit: number | null;
  type: string;
  capacity: number | null;
  capacity_occupied: number | null;
  area_m2: number | null;
  available: boolean;
}

interface ImportResult {
  success: number;
  created: number;
  updated: number;
  errors: string[];
}

export default function BulkRoomOps() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dorms, setDorms] = useState<DormWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [activeDormId, setActiveDormId] = useState<string | null>(null);

  useEffect(() => {
    loadDormsWithRooms();
  }, []);

  const loadDormsWithRooms = async () => {
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

      // Fetch all dorms for this owner
      const { data: ownerDorms, error: dormsError } = await supabase
        .from("dorms")
        .select("id, name, dorm_name, verification_status")
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false });

      if (dormsError) throw dormsError;
      if (!ownerDorms || ownerDorms.length === 0) {
        setDorms([]);
        setLoading(false);
        return;
      }

      // Fetch rooms for each dorm
      const dormsWithRooms: DormWithRooms[] = [];
      for (const dorm of ownerDorms) {
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("id, name, price, deposit, type, capacity, capacity_occupied, area_m2, available")
          .eq("dorm_id", dorm.id)
          .order("name", { ascending: true });

        if (roomsError) throw roomsError;

        dormsWithRooms.push({
          ...dorm,
          rooms: rooms || []
        });
      }

      setDorms(dormsWithRooms);
      if (dormsWithRooms.length > 0) {
        setActiveDormId(dormsWithRooms[0].id);
      }
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

  // Download Excel template for a specific dorm
  const downloadTemplate = (dorm: DormWithRooms) => {
    // Create workbook with template headers
    const wb = XLSX.utils.book_new();
    
    // Template columns (no dorm_id, no room_id - matched by Room name)
    const headers = ["Room", "Monthly Price", "Deposit", "Type", "Capacity", "Capacity Occupied", "Area (m²)"];
    
    // If dorm has existing rooms, pre-populate them
    let data: any[][] = [headers];
    
    if (dorm.rooms.length > 0) {
      const roomRows = dorm.rooms.map(room => [
        room.name,
        room.price || "",
        room.deposit || "",
        room.type || "",
        room.capacity || "",
        room.capacity_occupied || 0,
        room.area_m2 || ""
      ]);
      data = [headers, ...roomRows];
    } else {
      // Add sample row for new dorms
      data.push(["1", "500", "200", "Single", "1", "0", "15"]);
      data.push(["2", "700", "300", "Double", "2", "0", "20"]);
      data.push(["B1", "900", "400", "Triple", "3", "0", "30"]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Room
      { wch: 15 }, // Monthly Price
      { wch: 12 }, // Deposit
      { wch: 15 }, // Type
      { wch: 12 }, // Capacity
      { wch: 18 }, // Capacity Occupied
      { wch: 12 }, // Area
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Rooms");
    
    const dormDisplayName = dorm.dorm_name || dorm.name;
    const safeFileName = dormDisplayName.replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `${safeFileName}_rooms_template.xlsx`);

    toast({
      title: "Template Downloaded",
      description: `Excel template for ${dormDisplayName} has been downloaded`,
    });
  };

  // Import Excel/CSV file for a specific dorm
  const handleFileImport = async (dormId: string, file: File) => {
    const dorm = dorms.find(d => d.id === dormId);
    if (!dorm) return;

    setImporting(prev => ({ ...prev, [dormId]: true }));

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

      // Skip header row
      const rows = jsonData.slice(1).filter((row: any[]) => row.length > 0 && row[0]);

      const result: ImportResult = {
        success: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        const rowNum = i + 2; // Account for header and 0-index

        try {
          const roomName = String(row[0]).trim();
          const monthlyPrice = parseFloat(row[1]) || null;
          const deposit = parseFloat(row[2]) || null;
          const type = String(row[3] || "").trim();
          const capacity = parseInt(row[4]) || null;
          const capacityOccupied = parseInt(row[5]) || 0;
          const areaM2 = parseFloat(row[6]) || null;

          if (!roomName) {
            result.errors.push(`Row ${rowNum}: Room name is required`);
            continue;
          }

          // Check if room exists in this dorm (match by name)
          const existingRoom = dorm.rooms.find(
            r => r.name.toLowerCase() === roomName.toLowerCase()
          );

          if (existingRoom) {
            // Update existing room
            const updateData: any = {};
            if (monthlyPrice !== null) updateData.price = monthlyPrice;
            if (deposit !== null) updateData.deposit = deposit;
            if (type) updateData.type = type;
            if (capacity !== null) updateData.capacity = capacity;
            updateData.capacity_occupied = capacityOccupied;
            if (areaM2 !== null) updateData.area_m2 = areaM2;
            
            // Auto-set availability based on capacity
            if (capacity !== null && capacityOccupied >= capacity) {
              updateData.available = false;
            }

            const { error } = await supabase
              .from("rooms")
              .update(updateData)
              .eq("id", existingRoom.id);

            if (error) throw error;
            result.updated++;
            result.success++;
          } else {
            // Create new room
            const insertData: any = {
              dorm_id: dormId,
              name: roomName,
              price: monthlyPrice || 0,
              type: type || "Single",
              capacity: capacity || 1,
              capacity_occupied: capacityOccupied,
              available: capacity ? capacityOccupied < capacity : true
            };
            if (deposit !== null) insertData.deposit = deposit;
            if (areaM2 !== null) insertData.area_m2 = areaM2;

            const { error } = await supabase
              .from("rooms")
              .insert(insertData);

            if (error) throw error;
            result.created++;
            result.success++;
          }
        } catch (err: any) {
          result.errors.push(`Row ${rowNum}: ${err.message}`);
        }
      }

      // Show result
      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `${result.created} rooms created, ${result.updated} rooms updated${result.errors.length > 0 ? `. ${result.errors.length} errors.` : ""}`,
        });
      } else if (result.errors.length > 0) {
        toast({
          title: "Import Failed",
          description: result.errors.slice(0, 3).join("; "),
          variant: "destructive",
        });
      }

      // Reload data
      await loadDormsWithRooms();

    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => ({ ...prev, [dormId]: false }));
    }
  };

  const triggerFileInput = (dormId: string) => {
    const input = document.getElementById(`file-import-${dormId}`) as HTMLInputElement;
    if (input) input.click();
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
              <p className="text-muted-foreground text-sm mt-1">
                Import and export rooms data via Excel/CSV for each dorm
              </p>
            </div>
          </motion.div>

          {dorms.length === 0 ? (
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No dorms found. Create a dorm first.</p>
                <Button onClick={() => navigate("/owner/listings")} className="mt-4">
                  Go to Listings
                </Button>
              </CardContent>
            </Card>
          ) : dorms.length === 1 ? (
            // Single dorm - no tabs needed
            <DormBulkSection 
              dorm={dorms[0]} 
              onDownload={downloadTemplate}
              onImport={handleFileImport}
              importing={importing[dorms[0].id]}
              triggerFileInput={triggerFileInput}
            />
          ) : (
            // Multiple dorms - use tabs
            <Tabs value={activeDormId || undefined} onValueChange={setActiveDormId} className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-1 mb-6 p-1 bg-muted/50 rounded-xl">
                {dorms.map(dorm => (
                  <TabsTrigger 
                    key={dorm.id} 
                    value={dorm.id}
                    className="flex-1 min-w-[120px] data-[state=active]:bg-background rounded-lg py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate max-w-[100px]">
                        {dorm.dorm_name || dorm.name}
                      </span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {dorm.rooms.length}
                      </Badge>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {dorms.map(dorm => (
                <TabsContent key={dorm.id} value={dorm.id} className="mt-0">
                  <DormBulkSection 
                    dorm={dorm} 
                    onDownload={downloadTemplate}
                    onImport={handleFileImport}
                    importing={importing[dorm.id]}
                    triggerFileInput={triggerFileInput}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}

// Component for each dorm's bulk operations section
interface DormBulkSectionProps {
  dorm: DormWithRooms;
  onDownload: (dorm: DormWithRooms) => void;
  onImport: (dormId: string, file: File) => void;
  importing?: boolean;
  triggerFileInput: (dormId: string) => void;
}

function DormBulkSection({ dorm, onDownload, onImport, importing, triggerFileInput }: DormBulkSectionProps) {
  const dormDisplayName = dorm.dorm_name || dorm.name;

  return (
    <div className="space-y-6">
      {/* Dorm Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{dormDisplayName}</CardTitle>
                  <CardDescription>
                    {dorm.rooms.length} room{dorm.rooms.length !== 1 ? "s" : ""} in database
                  </CardDescription>
                </div>
              </div>
              <Badge variant={dorm.verification_status === "Verified" ? "default" : "secondary"}>
                {dorm.verification_status || "Pending"}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Excel Import/Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Excel/CSV Import & Export
            </CardTitle>
            <CardDescription>
              Download a template, fill in your room data, and upload to create or update rooms in bulk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-foreground">How it works:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>Download the template</strong> - Get an Excel file with the correct columns
                  {dorm.rooms.length > 0 && " (pre-filled with your existing rooms)"}
                </li>
                <li>
                  <strong>Fill in room data</strong> - Add or modify room information in Excel
                </li>
                <li>
                  <strong>Upload the file</strong> - Import your updated data back to Roomy
                </li>
              </ol>

              <Separator className="my-3" />
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Template Columns:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <Badge variant="outline" className="justify-start">Room (1, B1, etc.)</Badge>
                  <Badge variant="outline" className="justify-start">Monthly Price</Badge>
                  <Badge variant="outline" className="justify-start">Deposit</Badge>
                  <Badge variant="outline" className="justify-start">Type</Badge>
                  <Badge variant="outline" className="justify-start">Capacity</Badge>
                  <Badge variant="outline" className="justify-start">Capacity Occupied</Badge>
                  <Badge variant="outline" className="justify-start">Area (m²)</Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                The "Room" column is used to match existing rooms. If a room name already exists, it will be updated. 
                New room names will create new rooms.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => onDownload(dorm)}
                variant="outline"
                className="gap-2 rounded-xl flex-1"
              >
                <Download className="w-4 h-4" />
                Download Template
                {dorm.rooms.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {dorm.rooms.length} rooms
                  </Badge>
                )}
              </Button>

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(dorm.id, file);
                  e.target.value = "";
                }}
                className="hidden"
                id={`file-import-${dorm.id}`}
              />
              
              <Button
                onClick={() => triggerFileInput(dorm.id)}
                disabled={importing}
                className="gap-2 rounded-xl flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {importing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Excel/CSV
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Rooms Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Current Rooms ({dorm.rooms.length})
            </CardTitle>
            <CardDescription>
              Preview of rooms in {dormDisplayName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dorm.rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No rooms yet. Download the template and upload your rooms data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Room</th>
                      <th className="pb-3 font-medium text-muted-foreground">Type</th>
                      <th className="pb-3 font-medium text-muted-foreground">Price</th>
                      <th className="pb-3 font-medium text-muted-foreground">Deposit</th>
                      <th className="pb-3 font-medium text-muted-foreground">Capacity</th>
                      <th className="pb-3 font-medium text-muted-foreground">Occupied</th>
                      <th className="pb-3 font-medium text-muted-foreground">Area</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dorm.rooms.slice(0, 10).map((room, index) => (
                      <motion.tr 
                        key={room.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 font-medium">{room.name}</td>
                        <td className="py-3">{room.type}</td>
                        <td className="py-3">${room.price}</td>
                        <td className="py-3">{room.deposit ? `$${room.deposit}` : "-"}</td>
                        <td className="py-3">{room.capacity || "-"}</td>
                        <td className="py-3">
                          <span className={room.capacity && room.capacity_occupied && room.capacity_occupied >= room.capacity ? "text-destructive font-medium" : ""}>
                            {room.capacity_occupied || 0}
                          </span>
                        </td>
                        <td className="py-3">{room.area_m2 ? `${room.area_m2}m²` : "-"}</td>
                        <td className="py-3">
                          {room.available ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {dorm.rooms.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Showing 10 of {dorm.rooms.length} rooms. Download the template to see all.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
