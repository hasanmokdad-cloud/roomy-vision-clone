import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerBreadcrumb } from "@/components/owner/OwnerBreadcrumb";
import { ArrowLeft, Download, Upload, Building2, FileSpreadsheet, CheckCircle2, AlertCircle, Image, Video, DollarSign, CheckSquare, Square, ChevronDown, ChevronUp, Droplets, DoorOpen } from "lucide-react";
import { OwnerTableSkeleton } from "@/components/skeletons/OwnerSkeletons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import * as XLSX from "xlsx";
import imageCompression from "browser-image-compression";

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
  images?: string[] | null;
  video_url?: string | null;
  price_1_student?: number | null;
  price_2_students?: number | null;
  deposit_1_student?: number | null;
  deposit_2_students?: number | null;
}

interface ImportResult {
  success: number;
  created: number;
  updated: number;
  errors: string[];
}

// Helper to check room type
const isDoubleRoom = (type: string) => type?.toLowerCase().includes('double');
const isTripleRoom = (type: string) => type?.toLowerCase().includes('triple');
const isTieredRoom = (type: string) => isDoubleRoom(type) || isTripleRoom(type);

// Get display price (starting from)
const getDisplayPrice = (room: RoomData): { minPrice: number; hasTiers: boolean } => {
  const prices = [room.price];
  if (room.price_1_student) prices.push(room.price_1_student);
  if (room.price_2_students) prices.push(room.price_2_students);
  const validPrices = prices.filter(p => p != null && p > 0) as number[];
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : room.price;
  return { minPrice, hasTiers: validPrices.length > 1 };
};

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

      const dormsWithRooms: DormWithRooms[] = [];
      for (const dorm of ownerDorms) {
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("id, name, price, deposit, type, capacity, capacity_occupied, area_m2, available, images, video_url, price_1_student, price_2_students, deposit_1_student, deposit_2_students")
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

  const downloadTemplate = (dorm: DormWithRooms) => {
    const wb = XLSX.utils.book_new();
    const headers = [
      "Room", 
      "Type", 
      "Monthly Price", 
      "Price (2 students)", 
      "Price (1 student)", 
      "Deposit", 
      "Deposit (2 students)", 
      "Deposit (1 student)", 
      "Capacity", 
      "Capacity Occupied", 
      "Area (m²)"
    ];
    
    let data: any[][] = [headers];
    
    if (dorm.rooms.length > 0) {
      const roomRows = dorm.rooms.map(room => [
        room.name,
        room.type || "",
        room.price || "",
        room.price_2_students || "",
        room.price_1_student || "",
        room.deposit || "",
        room.deposit_2_students || "",
        room.deposit_1_student || "",
        room.capacity || "",
        room.capacity_occupied || 0,
        room.area_m2 || ""
      ]);
      data = [headers, ...roomRows];
    } else {
      data.push(["1", "Single", "500", "", "", "200", "", "", "1", "0", "15"]);
      data.push(["2", "Double", "700", "", "400", "300", "", "150", "2", "0", "20"]);
      data.push(["B1", "Triple", "900", "700", "450", "400", "300", "180", "3", "0", "30"]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, 
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
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

  const handleFileImport = async (dormId: string, file: File) => {
    const dorm = dorms.find(d => d.id === dormId);
    if (!dorm) return;

    setImporting(prev => ({ ...prev, [dormId]: true }));

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

      const rows = jsonData.slice(1).filter((row: any[]) => row.length > 0 && row[0]);

      const result: ImportResult = {
        success: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        const rowNum = i + 2;

        try {
          const roomName = String(row[0]).trim();
          const type = String(row[1] || "").trim();
          const monthlyPrice = parseFloat(row[2]) || null;
          const price2Students = parseFloat(row[3]) || null;
          const price1Student = parseFloat(row[4]) || null;
          const deposit = parseFloat(row[5]) || null;
          const deposit2Students = parseFloat(row[6]) || null;
          const deposit1Student = parseFloat(row[7]) || null;
          const capacity = parseInt(row[8]) || null;
          const capacityOccupied = parseInt(row[9]) || 0;
          const areaM2 = parseFloat(row[10]) || null;

          if (!roomName) {
            result.errors.push(`Row ${rowNum}: Room name is required`);
            continue;
          }

          const existingRoom = dorm.rooms.find(
            r => r.name.toLowerCase() === roomName.toLowerCase()
          );

          if (existingRoom) {
            const updateData: any = {};
            if (monthlyPrice !== null) updateData.price = monthlyPrice;
            if (deposit !== null) updateData.deposit = deposit;
            if (type) updateData.type = type;
            if (capacity !== null) updateData.capacity = capacity;
            updateData.capacity_occupied = capacityOccupied;
            if (areaM2 !== null) updateData.area_m2 = areaM2;
            
            updateData.price_1_student = price1Student;
            updateData.price_2_students = price2Students;
            updateData.deposit_1_student = deposit1Student;
            updateData.deposit_2_students = deposit2Students;
            
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
            
            if (price1Student !== null) insertData.price_1_student = price1Student;
            if (price2Students !== null) insertData.price_2_students = price2Students;
            if (deposit1Student !== null) insertData.deposit_1_student = deposit1Student;
            if (deposit2Students !== null) insertData.deposit_2_students = deposit2Students;

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
                Select rooms first, then apply bulk actions
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
            <DormBulkSection 
              dorm={dorms[0]} 
              onDownload={downloadTemplate}
              onImport={handleFileImport}
              importing={importing[dorms[0].id]}
              triggerFileInput={triggerFileInput}
              onRefresh={loadDormsWithRooms}
            />
          ) : (
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
                    onRefresh={loadDormsWithRooms}
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

interface DormBulkSectionProps {
  dorm: DormWithRooms;
  onDownload: (dorm: DormWithRooms) => void;
  onImport: (dormId: string, file: File) => void;
  importing?: boolean;
  triggerFileInput: (dormId: string) => void;
  onRefresh: () => Promise<void>;
}

function DormBulkSection({ dorm, onDownload, onImport, importing, triggerFileInput, onRefresh }: DormBulkSectionProps) {
  const { toast } = useToast();
  const dormDisplayName = dorm.dorm_name || dorm.name;
  
  // Selection state
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  
  // Bulk update state
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkDeposit, setBulkDeposit] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState("");
  
  // Tiered pricing bulk update state
  const [bulkPrice1Student, setBulkPrice1Student] = useState("");
  const [bulkPrice2Students, setBulkPrice2Students] = useState("");
  const [bulkDeposit1Student, setBulkDeposit1Student] = useState("");
  const [bulkDeposit2Students, setBulkDeposit2Students] = useState("");
  
  // Image/Video upload state
  const [imageUploadMode, setImageUploadMode] = useState<"replace" | "add">("add");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Collapsible section states
  const [pricingOpen, setPricingOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Extract unique room types
  const uniqueRoomTypes = useMemo(() => {
    const types = dorm.rooms.map(r => r.type).filter(Boolean);
    return [...new Set(types)].sort();
  }, [dorm.rooms]);

  // Check if selection includes tiered rooms
  const selectedRoomsList = useMemo(() => {
    return dorm.rooms.filter(r => selectedRooms.has(r.id));
  }, [dorm.rooms, selectedRooms]);

  const hasDoubleRoomsSelected = useMemo(() => {
    return selectedRoomsList.some(r => isDoubleRoom(r.type));
  }, [selectedRoomsList]);

  const hasTripleRoomsSelected = useMemo(() => {
    return selectedRoomsList.some(r => isTripleRoom(r.type));
  }, [selectedRoomsList]);

  const hasTieredRoomsSelected = hasDoubleRoomsSelected || hasTripleRoomsSelected;

  // Compute Open/Full room counts
  const reservationCounts = useMemo(() => {
    const full = dorm.rooms.filter(r => (r.capacity_occupied || 0) >= (r.capacity || 1)).length;
    return { full, open: dorm.rooms.length - full };
  }, [dorm.rooms]);

  // Selection helpers
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const selectAllRooms = () => {
    setSelectedRooms(new Set(dorm.rooms.map(r => r.id)));
  };

  const deselectAllRooms = () => {
    setSelectedRooms(new Set());
    setSelectedRoomType("");
    setSelectedReservation("");
  };

  const selectByRoomType = (type: string) => {
    setSelectedRoomType(type);
    if (!type) return;
    const roomsOfType = dorm.rooms.filter(r => r.type === type);
    setSelectedRooms(new Set(roomsOfType.map(r => r.id)));
  };

  const selectByReservation = (status: string) => {
    setSelectedReservation(status);
    if (!status) return;
    const roomsWithStatus = dorm.rooms.filter(r => {
      const isFull = (r.capacity_occupied || 0) >= (r.capacity || 1);
      return status === 'full' ? isFull : !isFull;
    });
    setSelectedRooms(new Set(roomsWithStatus.map(r => r.id)));
  };

  // Mark all full rooms as unavailable
  const markFullRoomsUnavailable = async () => {
    const fullAvailableRooms = dorm.rooms.filter(r => 
      (r.capacity_occupied || 0) >= (r.capacity || 1) && r.available
    );
    
    if (fullAvailableRooms.length === 0) {
      toast({ 
        title: "No rooms to update", 
        description: "All full rooms are already unavailable",
      });
      return;
    }

    setBulkUpdating(true);
    try {
      const roomIds = fullAvailableRooms.map(r => r.id);
      const { error } = await supabase
        .from("rooms")
        .update({ available: false })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${roomIds.length} full room${roomIds.length !== 1 ? 's' : ''} marked as unavailable`,
      });
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBulkUpdating(false);
    }
  };

  const selectedCount = selectedRooms.size;
  const hasSelection = selectedCount > 0;

  // Bulk availability update
  const bulkSetAvailability = async (available: boolean) => {
    if (!hasSelection) {
      toast({ title: "No rooms selected", variant: "destructive" });
      return;
    }

    setBulkUpdating(true);
    try {
      const roomIds = Array.from(selectedRooms);
      const { error } = await supabase
        .from("rooms")
        .update({ available })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${roomIds.length} rooms set to ${available ? "available" : "unavailable"}`,
      });
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk price update
  const bulkUpdatePrice = async () => {
    if (!hasSelection) {
      toast({ title: "No rooms selected", variant: "destructive" });
      return;
    }
    const priceValue = parseFloat(bulkPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    setBulkUpdating(true);
    try {
      const roomIds = Array.from(selectedRooms);
      const { error } = await supabase
        .from("rooms")
        .update({ price: priceValue })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Price updated to $${priceValue} for ${roomIds.length} rooms`,
      });
      setBulkPrice("");
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk deposit update
  const bulkUpdateDeposit = async () => {
    if (!hasSelection) {
      toast({ title: "No rooms selected", variant: "destructive" });
      return;
    }
    const depositValue = parseFloat(bulkDeposit);
    if (isNaN(depositValue) || depositValue < 0) {
      toast({ title: "Invalid deposit", variant: "destructive" });
      return;
    }

    setBulkUpdating(true);
    try {
      const roomIds = Array.from(selectedRooms);
      const { error } = await supabase
        .from("rooms")
        .update({ deposit: depositValue })
        .in("id", roomIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deposit updated to $${depositValue} for ${roomIds.length} rooms`,
      });
      setBulkDeposit("");
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk tiered pricing update
  const bulkUpdateTieredPricing = async () => {
    if (!hasSelection) {
      toast({ title: "No rooms selected", variant: "destructive" });
      return;
    }

    const price1 = bulkPrice1Student ? parseFloat(bulkPrice1Student) : null;
    const price2 = bulkPrice2Students ? parseFloat(bulkPrice2Students) : null;
    const deposit1 = bulkDeposit1Student ? parseFloat(bulkDeposit1Student) : null;
    const deposit2 = bulkDeposit2Students ? parseFloat(bulkDeposit2Students) : null;

    if (price1 === null && price2 === null && deposit1 === null && deposit2 === null) {
      toast({ title: "Enter at least one tiered value", variant: "destructive" });
      return;
    }

    setBulkUpdating(true);
    try {
      if (hasDoubleRoomsSelected && (price1 !== null || deposit1 !== null)) {
        const doubleRoomIds = selectedRoomsList
          .filter(r => isDoubleRoom(r.type))
          .map(r => r.id);
        
        if (doubleRoomIds.length > 0) {
          const updateData: any = {};
          if (price1 !== null) updateData.price_1_student = price1;
          if (deposit1 !== null) updateData.deposit_1_student = deposit1;
          
          const { error } = await supabase
            .from("rooms")
            .update(updateData)
            .in("id", doubleRoomIds);
          if (error) throw error;
        }
      }

      if (hasTripleRoomsSelected) {
        const tripleRoomIds = selectedRoomsList
          .filter(r => isTripleRoom(r.type))
          .map(r => r.id);
        
        if (tripleRoomIds.length > 0) {
          const updateData: any = {};
          if (price1 !== null) updateData.price_1_student = price1;
          if (price2 !== null) updateData.price_2_students = price2;
          if (deposit1 !== null) updateData.deposit_1_student = deposit1;
          if (deposit2 !== null) updateData.deposit_2_students = deposit2;
          
          const { error } = await supabase
            .from("rooms")
            .update(updateData)
            .in("id", tripleRoomIds);
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: "Tiered pricing updated for selected rooms",
      });
      setBulkPrice1Student("");
      setBulkPrice2Students("");
      setBulkDeposit1Student("");
      setBulkDeposit2Students("");
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk image upload
  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !hasSelection) return;

    setUploadingMedia(true);
    try {
      const roomIds = Array.from(selectedRooms);
      
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { data, error } = await supabase.storage
          .from("dorm-uploads")
          .upload(`room-images/${fileName}`, compressed);

        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from("dorm-uploads")
          .getPublicUrl(data.path);
        
        uploadedUrls.push(urlData.publicUrl);
      }

      for (const roomId of roomIds) {
        const currentRoom = dorm.rooms.find(r => r.id === roomId);
        let newImages: string[];

        if (imageUploadMode === "replace" || !currentRoom?.images || currentRoom.images.length === 0) {
          newImages = uploadedUrls;
        } else {
          newImages = [...(currentRoom.images || []), ...uploadedUrls];
        }

        const { error } = await supabase
          .from("rooms")
          .update({ images: newImages })
          .eq("id", roomId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded to ${roomIds.length} rooms`,
      });
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } finally {
      setUploadingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
  const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

  // Bulk video upload
  const handleBulkVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hasSelection) return;

    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type) && !SUPPORTED_VIDEO_EXTENSIONS.includes(fileExtension)) {
      toast({ 
        title: "Unsupported video format", 
        description: `Please upload a video in one of these formats: ${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}`, 
        variant: "destructive" 
      });
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max video size is 50MB", variant: "destructive" });
      return;
    }

    setUploadingMedia(true);
    try {
      const roomIds = Array.from(selectedRooms);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
      const { data, error } = await supabase.storage
        .from("dorm-uploads")
        .upload(`room-videos/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("dorm-uploads")
        .getPublicUrl(data.path);

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ video_url: urlData.publicUrl })
        .in("id", roomIds);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Video uploaded to ${roomIds.length} rooms`,
      });
      await onRefresh();
    } catch (error: any) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } finally {
      setUploadingMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
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
                    {dorm.rooms.length} room{dorm.rooms.length !== 1 ? "s" : ""} • {uniqueRoomTypes.length} type{uniqueRoomTypes.length !== 1 ? "s" : ""}
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

      {dorm.rooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No rooms yet. Download the template and upload your rooms data.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => onDownload(dorm)} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Template
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
                <Button onClick={() => triggerFileInput(dorm.id)} disabled={importing} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {importing ? "Importing..." : "Upload Excel/CSV"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* SECTION 1: Room Selection Table - AT THE TOP */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Select Rooms</CardTitle>
                    <CardDescription>Select rooms to apply bulk actions</CardDescription>
                  </div>
                  <Badge 
                    variant={hasSelection ? "default" : "secondary"} 
                    className="self-start sm:self-center text-sm px-3 py-1"
                  >
                    {selectedCount} of {dorm.rooms.length} selected
                  </Badge>
                </div>
                
                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={selectAllRooms} className="gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllRooms} className="gap-1.5">
                    <Square className="w-4 h-4" />
                    Deselect
                  </Button>
                  
                  {uniqueRoomTypes.length > 1 && (
                    <Select value={selectedRoomType} onValueChange={selectByRoomType}>
                      <SelectTrigger className="w-[160px] h-8 text-sm">
                        <SelectValue placeholder="Select by type" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueRoomTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type} ({dorm.rooms.filter(r => r.type === type).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Select value={selectedReservation} onValueChange={selectByReservation}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue placeholder="Select by reservation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        Open ({reservationCounts.open})
                      </SelectItem>
                      <SelectItem value="full">
                        Full ({reservationCounts.full})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b text-left">
                        <th className="p-3 w-10">
                          <Checkbox
                            checked={selectedCount === dorm.rooms.length && dorm.rooms.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) selectAllRooms();
                              else deselectAllRooms();
                            }}
                          />
                        </th>
                        <th className="p-3 font-medium text-muted-foreground">Room</th>
                        <th className="p-3 font-medium text-muted-foreground">Type</th>
                        <th className="p-3 font-medium text-muted-foreground">Price</th>
                        <th className="p-3 font-medium text-muted-foreground">Deposit</th>
                        <th className="p-3 font-medium text-muted-foreground">Capacity</th>
                        <th className="p-3 font-medium text-muted-foreground">Status</th>
                        <th className="p-3 font-medium text-muted-foreground">Reservation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dorm.rooms.map((room) => {
                        const { minPrice, hasTiers } = getDisplayPrice(room);
                        const roomIsTiered = isTieredRoom(room.type);
                        
                        return (
                          <tr 
                            key={room.id}
                            className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${selectedRooms.has(room.id) ? "bg-primary/5" : ""}`}
                            onClick={() => toggleRoomSelection(room.id)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedRooms.has(room.id)}
                                onCheckedChange={() => toggleRoomSelection(room.id)}
                              />
                            </td>
                            <td className="p-3 font-medium">{room.name}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {room.type}
                                {roomIsTiered && (
                                  <Badge variant="outline" className="text-[10px] px-1">
                                    Tiered
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {hasTiers ? (
                                <span className="text-primary">
                                  From ${minPrice}
                                </span>
                              ) : (
                                `$${room.price}`
                              )}
                            </td>
                            <td className="p-3">{room.deposit ? `$${room.deposit}` : "-"}</td>
                            <td className="p-3">{room.capacity_occupied || 0}/{room.capacity || "-"}</td>
                            <td className="p-3">
                              {room.available ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Unavailable</Badge>
                              )}
                            </td>
                            <td className="p-3">
                              {(room.capacity_occupied || 0) >= (room.capacity || 1) ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Full
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                  <DoorOpen className="w-3 h-3" />
                                  Open
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 2: Pricing & Availability - Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Collapsible open={pricingOpen} onOpenChange={setPricingOpen}>
              <Card className={`rounded-2xl shadow-md transition-opacity ${!hasSelection ? 'opacity-60' : ''}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-xl">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Pricing & Availability</CardTitle>
                          <CardDescription>
                            {hasSelection 
                              ? `Update ${selectedCount} selected room${selectedCount !== 1 ? 's' : ''}` 
                              : 'Select rooms above to enable bulk actions'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSelection && (
                          <Badge variant="default">{selectedCount} selected</Badge>
                        )}
                        {pricingOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Availability */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Bulk Availability</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="gap-2 flex-1"
                          disabled={!hasSelection || bulkUpdating}
                          onClick={() => bulkSetAvailability(true)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Set Available
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 flex-1"
                          disabled={!hasSelection || bulkUpdating}
                          onClick={() => bulkSetAvailability(false)}
                        >
                          Set Unavailable
                        </Button>
                      </div>
                    </div>

                    {/* Smart Actions */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Smart Actions</Label>
                      <Button
                        variant="outline"
                        className="gap-2 w-full justify-start text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
                        disabled={bulkUpdating || reservationCounts.full === 0}
                        onClick={markFullRoomsUnavailable}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Hide Full Rooms from Students
                        {reservationCounts.full > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {reservationCounts.full} full
                          </Badge>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Automatically mark all rooms at full capacity as unavailable
                      </p>
                    </div>

                    <Separator />

                    {/* Price & Deposit Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bulk Price Update</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Enter price..."
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            className="flex-1"
                            disabled={!hasSelection}
                          />
                          <Button 
                            onClick={bulkUpdatePrice}
                            disabled={!hasSelection || !bulkPrice || bulkUpdating}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bulk Deposit Update</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Enter deposit..."
                            value={bulkDeposit}
                            onChange={(e) => setBulkDeposit(e.target.value)}
                            className="flex-1"
                            disabled={!hasSelection}
                          />
                          <Button 
                            onClick={bulkUpdateDeposit}
                            disabled={!hasSelection || !bulkDeposit || bulkUpdating}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Tiered Pricing - Only show when tiered rooms are selected */}
                    {hasTieredRoomsSelected && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Tiered Pricing</Label>
                            <Badge variant="outline" className="text-xs">
                              {hasDoubleRoomsSelected && hasTripleRoomsSelected 
                                ? "Double & Triple" 
                                : hasDoubleRoomsSelected 
                                  ? "Double Rooms" 
                                  : "Triple Rooms"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Price (1 student)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 300"
                                value={bulkPrice1Student}
                                onChange={(e) => setBulkPrice1Student(e.target.value)}
                              />
                            </div>

                            {hasTripleRoomsSelected && (
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Price (2 students)</Label>
                                <Input
                                  type="number"
                                  placeholder="e.g. 500"
                                  value={bulkPrice2Students}
                                  onChange={(e) => setBulkPrice2Students(e.target.value)}
                                />
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Deposit (1 student)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 150"
                                value={bulkDeposit1Student}
                                onChange={(e) => setBulkDeposit1Student(e.target.value)}
                              />
                            </div>

                            {hasTripleRoomsSelected && (
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Deposit (2 students)</Label>
                                <Input
                                  type="number"
                                  placeholder="e.g. 250"
                                  value={bulkDeposit2Students}
                                  onChange={(e) => setBulkDeposit2Students(e.target.value)}
                                />
                              </div>
                            )}
                          </div>

                          <Button 
                            onClick={bulkUpdateTieredPricing}
                            disabled={!hasSelection || bulkUpdating || (!bulkPrice1Student && !bulkPrice2Students && !bulkDeposit1Student && !bulkDeposit2Students)}
                            className="gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Apply Tiered Pricing
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>

          {/* SECTION 3: Media Upload - Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Collapsible open={mediaOpen} onOpenChange={setMediaOpen}>
              <Card className={`rounded-2xl shadow-md transition-opacity ${!hasSelection ? 'opacity-60' : ''}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                          <Image className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Media Upload</CardTitle>
                          <CardDescription>
                            {hasSelection 
                              ? `Upload images/videos to ${selectedCount} room${selectedCount !== 1 ? 's' : ''}` 
                              : 'Select rooms above to upload media'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSelection && (
                          <Badge variant="default">{selectedCount} selected</Badge>
                        )}
                        {mediaOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image Upload */}
                      <div className="border rounded-xl p-4 space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Image className="w-5 h-5 text-primary" />
                          <span className="font-medium">Bulk Images</span>
                        </div>
                        
                        <RadioGroup
                          value={imageUploadMode}
                          onValueChange={(v) => setImageUploadMode(v as "replace" | "add")}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="replace" id="replace" />
                            <Label htmlFor="replace" className="text-sm cursor-pointer">Replace existing</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="add" id="add" />
                            <Label htmlFor="add" className="text-sm cursor-pointer">Add to existing</Label>
                          </div>
                        </RadioGroup>
                        
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBulkImageUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="gap-2 w-full"
                          disabled={!hasSelection || uploadingMedia}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Image className="w-4 h-4" />
                          {uploadingMedia ? "Uploading..." : "Upload Images"}
                        </Button>
                      </div>

                      {/* Video Upload */}
                      <div className="border rounded-xl p-4 space-y-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span className="font-medium">Bulk Video</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Max 50MB • MP4, WebM, MOV
                        </p>
                        
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleBulkVideoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="gap-2 w-full"
                          disabled={!hasSelection || uploadingMedia}
                          onClick={() => videoInputRef.current?.click()}
                        >
                          <Video className="w-4 h-4" />
                          {uploadingMedia ? "Uploading..." : "Upload Video"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>

          {/* SECTION 4: Excel Import/Export - Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
          >
            <Collapsible open={importOpen} onOpenChange={setImportOpen}>
              <Card className="rounded-2xl shadow-md">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                          <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Excel Import/Export</CardTitle>
                          <CardDescription>Download template or import room data</CardDescription>
                        </div>
                      </div>
                      {importOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <h4 className="font-medium text-sm">How it works:</h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                        <li><strong>Download</strong> the template with your existing rooms</li>
                        <li><strong>Edit</strong> the Excel file with your room data</li>
                        <li><strong>Upload</strong> to create or update rooms</li>
                      </ol>
                      
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <Badge variant="outline" className="text-xs">Room</Badge>
                        <Badge variant="outline" className="text-xs">Type</Badge>
                        <Badge variant="outline" className="text-xs">Monthly Price</Badge>
                        <Badge variant="outline" className="text-xs bg-primary/5">Tiered Prices</Badge>
                        <Badge variant="outline" className="text-xs">Deposit</Badge>
                        <Badge variant="outline" className="text-xs">Capacity</Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        Matching room names update existing; new names create new rooms.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => onDownload(dorm)}
                        variant="outline"
                        className="gap-2 flex-1"
                      >
                        <Download className="w-4 h-4" />
                        Download Template
                        <Badge variant="secondary" className="ml-1">
                          {dorm.rooms.length} rooms
                        </Badge>
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
                        className="gap-2 flex-1"
                      >
                        {importing ? (
                          <>
                            <span className="animate-spin">⏳</span>
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
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        </>
      )}
    </div>
  );
}
