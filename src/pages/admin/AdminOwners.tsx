import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Eye, Building2, CheckCircle, XCircle, Ban, Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import { OwnerProfileModal } from '@/components/admin/OwnerProfileModal';
import { createOrGetConversation } from '@/lib/conversationUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOwners() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<any[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOwners();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = owners.filter(owner =>
        owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOwners(filtered);
    } else {
      setFilteredOwners(owners);
    }
  }, [searchTerm, owners]);

  const loadOwners = async () => {
    try {
      // Load owners with dorm count
      const { data: ownersData } = await supabase
        .from('owners')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ownersData) {
        setOwners([]);
        setFilteredOwners([]);
        setLoading(false);
        return;
      }

      // Get dorm counts for each owner
      const ownersWithCounts = await Promise.all(
        ownersData.map(async (owner) => {
          const { count } = await supabase
            .from('dorms')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', owner.id);

          return {
            ...owner,
            dorm_count: count || 0,
          };
        })
      );

      setOwners(ownersWithCounts);
      setFilteredOwners(ownersWithCounts);
    } catch (error) {
      console.error('Error loading owners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load owners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOwnerStatus = async (ownerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('owners')
        .update({ status: newStatus })
        .eq('id', ownerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Owner ${newStatus === 'suspended' ? 'suspended' : 'activated'}`,
      });

      loadOwners();
    } catch (error) {
      console.error('Error updating owner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update owner status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOwner = async () => {
    if (!ownerToDelete) return;

    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', ownerToDelete);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete owner',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Owner deleted successfully',
    });

    setDeleteDialogOpen(false);
    setOwnerToDelete(null);
    loadOwners();
  };

  const handleMessageOwner = async (ownerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ownerData } = await supabase
      .from('owners')
      .select('user_id')
      .eq('id', ownerId)
      .single();

    if (!ownerData?.user_id) {
      toast({
        title: 'Error',
        description: 'Could not find owner contact information',
        variant: 'destructive',
      });
      return;
    }

    const conversationId = await createOrGetConversation(user.id, ownerData.user_id);

    if (conversationId) {
      navigate('/messages');
    } else {
      toast({
        title: 'Error',
        description: 'Could not create conversation',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Dorms', 'Status', 'Joined'];
    const rows = filteredOwners.map(o => [
      o.full_name,
      o.email,
      o.phone_number || 'N/A',
      o.dorm_count,
      o.status,
      new Date(o.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'owners-export.csv';
    a.click();

    toast({
      title: 'Success',
      description: 'Owners exported to CSV',
    });
  };

  const stats = {
    total: owners.length,
    active: owners.filter(o => o.status === 'active').length,
    suspended: owners.filter(o => o.status === 'suspended').length,
    totalDorms: owners.reduce((sum, o) => sum + o.dorm_count, 0),
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Owner Management</h1>
              <p className="text-muted-foreground mt-1">Manage all property owners and their listings</p>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Owners', value: stats.total, icon: Building2, color: 'from-blue-500 to-cyan-500' },
          { title: 'Active', value: stats.active, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { title: 'Suspended', value: stats.suspended, icon: XCircle, color: 'from-red-500 to-pink-500' },
          { title: 'Total Dorms', value: stats.totalDorms, icon: Building2, color: 'from-purple-500 to-pink-500' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Owners Table */}
      <div className="glass-hover rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dorms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading owners...
                </TableCell>
              </TableRow>
            ) : filteredOwners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No owners found
                </TableCell>
              </TableRow>
            ) : (
              filteredOwners.map((owner) => (
                <TableRow key={owner.id} className="border-border/40">
                  <TableCell className="font-medium">{owner.full_name}</TableCell>
                  <TableCell>{owner.email}</TableCell>
                  <TableCell>{owner.phone_number || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{owner.dorm_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={owner.status === 'active' ? 'default' : 'destructive'}
                    >
                      {owner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(owner.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOwnerId(owner.id);
                          setProfileModalOpen(true);
                        }}
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMessageOwner(owner.id)}
                        title="Message Owner"
                      >
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/dorms?owner=${owner.id}`)}
                        title="View Properties"
                      >
                        <Building2 className="w-4 h-4 text-purple-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateOwnerStatus(owner.id, owner.status)}
                        title={owner.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        <Ban className={`w-4 h-4 ${owner.status === 'active' ? 'text-orange-500' : 'text-green-500'}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOwnerToDelete(owner.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Owner"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Owner Profile Modal */}
      {selectedOwnerId && (
        <OwnerProfileModal
          ownerId={selectedOwnerId}
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedOwnerId(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the owner account
              and may affect associated properties. Make sure to reassign properties first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOwner} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
}
