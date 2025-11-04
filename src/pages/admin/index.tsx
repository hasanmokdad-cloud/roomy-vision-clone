import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AdminDashboard from './AdminDashboard';

export default function AdminIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is an owner
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!owner) {
        navigate('/dashboard');
        return;
      }

      setIsOwner(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-dorms-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const data = await response.json();

      toast({
        title: '✅ Dorms imported successfully!',
        description: data.message || `${data.count} dorms imported successfully`,
      });

      setTimeout(() => {
        navigate('/listings');
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import dorms data',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) return null;

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9ff] to-[#e7f3ff]">
      <AdminDashboard />
      
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#B57BFF] to-[#3DBBFA] bg-clip-text text-transparent">
              Admin Control Panel
            </h2>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleFileSelect}
              disabled={importing}
              size="lg"
              className="bg-gradient-to-r from-[#B57BFF] to-[#3DBBFA] hover:opacity-90 text-white font-semibold px-8 py-4 text-lg shadow-lg w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Import Excel Data
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Upload .xlsx, .xls, or .csv files
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
