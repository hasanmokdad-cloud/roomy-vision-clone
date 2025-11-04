import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (!roles || !roles.some(r => r.role === 'admin')) {
        navigate('/dashboard');
        return;
      }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8f9ff] to-[#e7f3ff]">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#B57BFF] to-[#3DBBFA] bg-clip-text text-transparent">
          Admin Control Panel
        </h1>
        
        <Button
          onClick={handleImportData}
          disabled={importing}
          size="lg"
          className="bg-gradient-to-r from-[#B57BFF] to-[#3DBBFA] hover:opacity-90 text-white font-semibold px-8 py-6 text-lg shadow-lg"
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
      </div>
    </div>
  );
}
