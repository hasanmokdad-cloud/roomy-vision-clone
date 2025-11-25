import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit, Trash2, Plus, X, Eye, Search, ArrowLeft, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DormEditModal from '@/components/admin/DormEditModal';
import { AdminDormPreviewModal } from '@/components/admin/AdminDormPreviewModal';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';

export default function AdminDorms() {
  const navigate = useNavigate();
  const [dorms, setDorms] = useState<any[]>([]);
  const [filteredDorms, setFilteredDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDorm, setSelectedDorm] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDorms();

    // Real-time subscription
    const channel = subscribeTo('dorms', (payload) => {
      console.log('Dorm changed:', payload);
      loadDorms();
      toast({
        title: 'Real-time Update',
        description: 'Dorms list updated',
      });
    });

    return () => {
      unsubscribeFrom(channel);
    };
  }, []);

  // Filter dorms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDorms(dorms);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = dorms.filter(dorm => 
      (dorm.dorm_name || dorm.name || '').toLowerCase().includes(query) ||
      (dorm.area || '').toLowerCase().includes(query) ||
      (dorm.university || '').toLowerCase().includes(query) ||
      (dorm.verification_status || '').toLowerCase().includes(query)
    );
    setFilteredDorms(filtered);
  }, [searchQuery, dorms]);

  const loadDorms = async () => {
    const { data, error } = await supabase
      .from('dorms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDorms(data);
      setFilteredDorms(data);
    }
    setLoading(false);
  };

  const handleVerify = async (id: string, status: 'Verified' | 'Rejected') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          dorm_id: id,
          new_status: status
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update verification status');
      }

      toast({
        title: 'Success',
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Properties</h1>
          <p className="text-foreground/60 mt-2">View and manage all dorm listings in real-time</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-hover rounded-xl p-4">
          <p className="text-sm text-foreground/60">Total Dorms</p>
          <p className="text-2xl font-bold">{dorms.length}</p>
        </div>
        <div className="glass-hover rounded-xl p-4">
          <p className="text-sm text-foreground/60">Verified</p>
          <p className="text-2xl font-bold text-green-500">
            {dorms.filter(d => d.verification_status === 'Verified').length}
          </p>
        </div>
        <div className="glass-hover rounded-xl p-4">
          <p className="text-sm text-foreground/60">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">
            {dorms.filter(d => d.verification_status === 'Pending').length}
          </p>
        </div>
        <div className="glass-hover rounded-xl p-4">
          <p className="text-sm text-foreground/60">Rejected</p>
          <p className="text-2xl font-bold text-red-500">
            {dorms.filter(d => d.verification_status === 'Rejected').length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input
          placeholder="Search by name, area, university, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
            {filteredDorms.map((dorm) => (
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/admin/dorms/${dorm.id}/rooms`)}
                      title="View rooms"
                    >
                      <Home className="w-4 h-4 text-purple-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDorm(dorm);
                        setPreviewModalOpen(true);
                      }}
                      title="Preview dorm"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDorm(dorm);
                        setEditModalOpen(true);
                      }}
                      title="Edit dorm"
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                    {dorm.verification_status !== 'Verified' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVerify(dorm.id, 'Verified')}
                        title="Verify dorm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {dorm.verification_status !== 'Rejected' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVerify(dorm.id, 'Rejected')}
                        title="Reject dorm"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(dorm.id)}
                      title="Delete dorm"
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

      {/* Edit Modal */}
      {selectedDorm && (
        <DormEditModal
          dorm={selectedDorm}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedDorm(null);
          }}
          onUpdate={loadDorms}
          isAdmin={true}
        />
      )}

      {/* Preview Modal */}
      {selectedDorm && (
        <AdminDormPreviewModal
          dorm={selectedDorm}
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedDorm(null);
          }}
        />
      )}
    </div>
  );
}
