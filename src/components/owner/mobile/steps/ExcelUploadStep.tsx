import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { WizardRoomData } from './RoomNamesStep';

interface ExcelUploadStepProps {
  roomCount: number;
  onImport: (rooms: WizardRoomData[]) => void;
  importedCount: number;
}

export function ExcelUploadStep({ roomCount, onImport, importedCount }: ExcelUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const downloadTemplate = () => {
    const templateData = Array.from({ length: roomCount }, (_, i) => ({
      'Room Name': i + 1,
      'Room Type': 'Single',
      'Monthly Price': '',
      'Deposit': '',
      'Capacity': 1,
      'Occupied': 0,
      'Area (m²)': '',
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];

    XLSX.writeFile(wb, 'room_template.xlsx');
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload it back',
    });
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      setPreview(jsonData.slice(0, 5));

      // Transform to WizardRoomData
      const rooms: WizardRoomData[] = jsonData.map((row: any, index) => ({
        id: `excel-${Date.now()}-${index}`,
        name: String(row['Room Name'] || index + 1),
        type: String(row['Room Type'] || ''),
        price: row['Monthly Price'] ? parseFloat(row['Monthly Price']) : null,
        deposit: row['Deposit'] ? parseFloat(row['Deposit']) : null,
        price_1_student: null,
        price_2_students: null,
        deposit_1_student: null,
        deposit_2_students: null,
        capacity: row['Capacity'] ? parseInt(row['Capacity']) : null,
        capacity_occupied: row['Occupied'] ? parseInt(row['Occupied']) : 0,
        area_m2: row['Area (m²)'] ? parseFloat(row['Area (m²)']) : null,
        images: [],
        video_url: null,
      }));

      onImport(rooms);
      
      toast({
        title: 'Import successful',
        description: `${rooms.length} rooms imported from Excel`,
      });
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [onImport]);

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Upload room data
        </h1>
        <p className="text-muted-foreground">
          Download the template, fill it in, and upload
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Step 1: Download */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <span className="font-semibold">Download Template</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Get a pre-filled template with {roomCount} rows ready for your room data
          </p>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <span className="font-semibold">Upload Filled Template</span>
            {importedCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {importedCount} imported
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your completed Excel file
          </p>
          <label className="block">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl gap-2"
              disabled={uploading}
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                {uploading ? 'Processing...' : 'Upload Excel File'}
              </span>
            </Button>
          </label>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span className="font-semibold">Preview</span>
            </div>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {preview.map((row, index) => (
                  <div
                    key={index}
                    className="text-sm bg-muted/50 rounded-lg p-2 flex flex-wrap gap-2"
                  >
                    <Badge variant="outline">{row['Room Name']}</Badge>
                    <Badge variant="secondary">{row['Room Type']}</Badge>
                    {row['Monthly Price'] && (
                      <span className="text-muted-foreground">
                        ${row['Monthly Price']}/mo
                      </span>
                    )}
                  </div>
                ))}
                {importedCount > 5 && (
                  <p className="text-xs text-muted-foreground">
                    ... and {importedCount - 5} more rooms
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Tip: You can still edit individual room details after importing. 
            Continue to the next steps to add images and make adjustments.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
