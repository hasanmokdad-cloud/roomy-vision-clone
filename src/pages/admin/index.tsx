import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AdminDashboard from './AdminDashboard';

export default function AdminIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

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

  const handleImportData = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-dorms-data', {
        body: { action: 'import' }
      });

      if (error) throw error;

      toast({
        title: '✅ Dorms imported successfully!',
        description: `${data?.message || 'Data has been imported to the database.'}`,
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
            
            <Button
              onClick={handleImportData}
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
                <>📦 Import Excel Data</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
