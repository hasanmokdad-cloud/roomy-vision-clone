import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { OwnerLayout } from "@/components/owner/OwnerLayout";

interface ImportRow {
  dorm_name: string;
  address: string;
  area: string;
  description: string;
  room_name: string;
  room_type: string;
  price: number;
  area_m2?: number;
  images?: string;
}

export default function BulkImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    loadOwnerId();
  }, []);

  const loadOwnerId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("owners")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (data) setOwnerId(data.id);
  };

  const downloadTemplate = () => {
    const template = [
      {
        dorm_name: "Example Dorm",
        address: "123 Main St",
        area: "Downtown",
        description: "Beautiful dorm near campus",
        room_name: "Room 101",
        room_type: "Single",
        price: 500,
        area_m2: 20,
        images: "https://example.com/img1.jpg,https://example.com/img2.jpg",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dorms");
    XLSX.writeFile(wb, "dorm_import_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet);

      setPreviewData(jsonData);
      toast({
        title: "File loaded",
        description: `Found ${jsonData.length} rows to import`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!ownerId) {
      toast({
        title: "Error",
        description: "Owner profile not found",
        variant: "destructive",
      });
      return;
    }

    if (previewData.length === 0) return;

    setLoading(true);
    try {
      const dormMap = new Map<string, ImportRow[]>();
      previewData.forEach((row) => {
        const key = row.dorm_name;
        if (!dormMap.has(key)) {
          dormMap.set(key, []);
        }
        dormMap.get(key)!.push(row);
      });

      let successCount = 0;

      for (const [dormName, rows] of dormMap.entries()) {
        const firstRow = rows[0];

        const { data: dormData, error: dormError } = await supabase
          .from("dorms")
          .insert([
            {
              name: dormName,
              dorm_name: dormName,
              location: firstRow.address,
              address: firstRow.address,
              area: firstRow.area,
              description: firstRow.description,
              owner_id: ownerId,
              price: rows[0].price,
              monthly_price: rows[0].price,
              verification_status: "Pending",
              available: true,
            },
          ])
          .select()
          .single();

        if (dormError) {
          console.error("Dorm insert error:", dormError);
          continue;
        }

        const roomsToInsert = rows.map((row) => ({
          dorm_id: dormData.id,
          name: row.room_name,
          type: row.room_type,
          price: row.price,
          area_m2: row.area_m2 || null,
          description: firstRow.description,
          images: row.images ? row.images.split(",").map((s) => s.trim()) : [],
          available: true,
        }));

        const { error: roomsError } = await supabase
          .from("rooms")
          .insert(roomsToInsert);

        if (roomsError) {
          console.error("Rooms insert error:", roomsError);
        } else {
          successCount++;
        }
      }

      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} dorm(s) with rooms`,
      });
      navigate("/owner/dorms");
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

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/owner/dorms")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Bulk Import Dorms & Rooms</h1>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Download Template</h2>
              <p className="text-muted-foreground mb-4">
                Download the Excel template, fill in your dorm and room information, then upload it back.
              </p>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Upload Filled Template</h2>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="gap-2" onClick={() => document.getElementById("file-upload")?.click()}>
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
              </label>
            </Card>

            {previewData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Step 3: Preview & Confirm</h2>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Dorm Name</th>
                        <th className="text-left p-2">Room Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{row.dorm_name}</td>
                          <td className="p-2">{row.room_name}</td>
                          <td className="p-2">{row.room_type}</td>
                          <td className="p-2">${row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... and {previewData.length - 10} more rows
                    </p>
                  )}
                </div>
                <Button onClick={handleImport} disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import {previewData.length} Rows</>
                  )}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
