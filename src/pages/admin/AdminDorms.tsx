import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit, Trash2, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminDorms() {
  const [dorms, setDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDorms();

    const channel = supabase
      .channel('admin-dorms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dorms'
        },
        () => {
          loadDorms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDorms = async () => {
    const { data, error } = await supabase
      .from('dorms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDorms(data);
    }
    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('dorms')
      .update({ verification_status: 'Verified' })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify dorm',
        variant: 'destructive',
      });
      return;
    }

    await supabase.from('system_logs').insert({
      user_id: session?.user.id,
      action: 'VERIFY_DORM',
      table_affected: 'dorms',
      record_id: id,
    });

    toast({
      title: 'Success',
      description: 'Dorm verified successfully',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dorm?')) return;

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('dorms')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete dorm',
        variant: 'destructive',
      });
      return;
    }

    await supabase.from('system_logs').insert({
      user_id: session?.user.id,
      action: 'DELETE_DORM',
      table_affected: 'dorms',
      record_id: id,
    });

    toast({
      title: 'Success',
      description: 'Dorm deleted successfully',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading dorms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dorm Listings</h1>
          <p className="text-foreground/60 mt-2">Manage all dorm listings</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Add New Dorm
        </Button>
      </div>

      <div className="glass-hover rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dorms.map((dorm) => (
              <TableRow key={dorm.id}>
                <TableCell className="font-medium">{dorm.dorm_name || dorm.name}</TableCell>
                <TableCell>{dorm.area || dorm.location}</TableCell>
                <TableCell>{dorm.university}</TableCell>
                <TableCell>${dorm.monthly_price || dorm.price}</TableCell>
                <TableCell>
                  <Badge
                    variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}
                  >
                    {dorm.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {dorm.verification_status !== 'Verified' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVerify(dorm.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(dorm.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
