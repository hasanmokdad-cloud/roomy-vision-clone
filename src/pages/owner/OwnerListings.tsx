import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, DoorOpen, ArrowLeft } from 'lucide-react';
import { OwnerTableSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { useOwnerDormsQuery } from '@/hooks/useOwnerDormsQuery';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import DormEditModal from '@/components/admin/DormEditModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OwnerListings() {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState<string>();
  const { data: dorms, isLoading: loading, refetch } = useOwnerDormsQuery(ownerId);
  const { toast } = useToast();
  const [editingDorm, setEditingDorm] = useState<any | null>(null);

  useEffect(() => {
    loadOwnerId();
  }, []);

  const loadOwnerId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (owner) {
      setOwnerId(owner.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const { error } = await supabase
      .from('dorms')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Listing deleted successfully',
    });
    
    refetch();
  };

  if (loading) {
    return <OwnerTableSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="space-y-6">
          <OwnerBreadcrumb items={[{ label: 'My Listings' }]} />
          
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">My Listings</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your dorm properties</p>
            </div>
            <Button
              onClick={() => navigate('/owner/dorms/new')}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Dorm
            </Button>
          </div>

          {!dorms || dorms.length === 0 ? (
            <div className="glass-hover rounded-2xl p-12 text-center">
              <h3 className="text-xl font-bold mb-2">No listings yet</h3>
              <p className="text-foreground/60 mb-4">Create your first dorm listing to get started</p>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={() => navigate('/owner/dorms/new')}
              >
                Add New Listing
              </Button>
            </div>
          ) : (
            <div className="glass-hover rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Starting Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dorms.map((dorm) => (
                    <TableRow key={dorm.id}>
                      <TableCell className="font-medium">{dorm.dorm_name || dorm.name}</TableCell>
                      <TableCell>{dorm.area || dorm.location}</TableCell>
                      <TableCell>From ${dorm.monthly_price || dorm.price}</TableCell>
                      <TableCell>
                        <Badge variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}>
                          {dorm.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms`)}
                            title="Manage Rooms"
                          >
                            <DoorOpen className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDorm(dorm)}>
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
          )}

          {/* Dorm Edit Modal */}
          {editingDorm && (
            <DormEditModal
              dorm={editingDorm}
              isOpen={true}
              onClose={() => setEditingDorm(null)}
              onUpdate={() => {
                setEditingDorm(null);
                refetch();
              }}
            />
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
