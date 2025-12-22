import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerBreadcrumb } from "@/components/owner/OwnerBreadcrumb";
import { ArrowLeft, Download, Upload, Building2, FileSpreadsheet, CheckCircle2, AlertCircle, Image, Video, Check, X, Zap, DollarSign, ToggleLeft, ToggleRight, CheckSquare, Square } from "lucide-react";
import { OwnerTableSkeleton } from "@/components/skeletons/OwnerSkeletons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
          .select("id, name, price, deposit, type, capacity, capacity_occupied, area_m2, available, images, video_url")
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
                Import, export, and bulk update rooms for each dorm
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
              onRefresh={loadDormsWithRooms}
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

// Component for each dorm's bulk operations section
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
  
  // Bulk update state
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkDeposit, setBulkDeposit] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Image/Video upload state
  const [imageUploadMode, setImageUploadMode] = useState<"replace" | "add">("add");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // Bulk image upload
  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !hasSelection) return;

    setUploadingMedia(true);
    try {
      const roomIds = Array.from(selectedRooms);
      
      // Compress and upload all images to dorm-uploads bucket
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

      // Update all selected rooms with the images array
      for (const roomId of roomIds) {
        const currentRoom = dorm.rooms.find(r => r.id === roomId);
        let newImages: string[];

        if (imageUploadMode === "replace" || !currentRoom?.images || currentRoom.images.length === 0) {
          newImages = uploadedUrls;
        } else {
          // Add mode - append to existing array
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

  // Supported video file types
  const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
  const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

  // Bulk video upload
  const handleBulkVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hasSelection) return;

    // Validate video file type
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

    // Check file size (max 50MB for video)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max video size is 50MB", variant: "destructive" });
      return;
    }

    setUploadingMedia(true);
    try {
      const roomIds = Array.from(selectedRooms);

      // Upload video to dorm-uploads bucket (supports video MIME types)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
      const { data, error } = await supabase.storage
        .from("dorm-uploads")
        .upload(`room-videos/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("dorm-uploads")
        .getPublicUrl(data.path);

      // Update all selected rooms with the video URL
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

      {/* Quick Bulk Operations Section */}
      {dorm.rooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="rounded-2xl shadow-md border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Quick Bulk Operations
              </CardTitle>
              <CardDescription>
                Select rooms below, then apply bulk updates here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection Counter */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-sm font-medium">
                  {selectedCount} of {dorm.rooms.length} rooms selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllRooms} className="gap-1">
                    <CheckSquare className="w-4 h-4" />
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllRooms} className="gap-1">
                    <Square className="w-4 h-4" />
                    Deselect All
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Availability Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Availability</Label>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    disabled={!hasSelection || bulkUpdating}
                    onClick={() => bulkSetAvailability(true)}
                  >
                    <ToggleRight className="w-4 h-4 text-green-500" />
                    Set as Available
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    disabled={!hasSelection || bulkUpdating}
                    onClick={() => bulkSetAvailability(false)}
                  >
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    Set as Unavailable
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Price & Deposit Update */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Update Price
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter price..."
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      className="flex-1"
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
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Update Deposit
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter deposit..."
                      value={bulkDeposit}
                      onChange={(e) => setBulkDeposit(e.target.value)}
                      className="flex-1"
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

              <Separator />

              {/* Image Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  Bulk Image Upload
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload the same image(s) to all selected rooms. Useful when rooms of the same type look identical.
                </p>
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
                  {uploadingMedia ? "Uploading..." : `Upload Images to ${selectedCount} Rooms`}
                </Button>
              </div>

              <Separator />

              {/* Video Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  Bulk Video Upload
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload the same video to all selected rooms. Max 50MB.
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
                  {uploadingMedia ? "Uploading..." : `Upload Video to ${selectedCount} Rooms`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Current Rooms Preview with Selection */}
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
              Select rooms to apply bulk operations
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
                      <th className="pb-3 pr-2 w-10">
                        <Checkbox
                          checked={selectedCount === dorm.rooms.length && dorm.rooms.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) selectAllRooms();
                            else deselectAllRooms();
                          }}
                        />
                      </th>
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
                    {dorm.rooms.map((room, index) => (
                      <motion.tr 
                        key={room.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 ${selectedRooms.has(room.id) ? "bg-primary/5" : ""}`}
                        onClick={() => toggleRoomSelection(room.id)}
                      >
                        <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRooms.has(room.id)}
                            onCheckedChange={() => toggleRoomSelection(room.id)}
                          />
                        </td>
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
