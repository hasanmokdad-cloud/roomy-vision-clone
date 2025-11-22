import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Mail, Eye, Building2, CheckCircle, XCircle, UserX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminOwners() {
  const [owners, setOwners] = useState<any[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

  const updateOwnerStatus = async (ownerId: string, newStatus: string) => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Owner Management</h1>
        <p className="text-foreground/60 mt-2">Manage all property owners and their listings</p>
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
                        onClick={() => window.location.href = `/admin/ownership?owner=${owner.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateOwnerStatus(
                          owner.id,
                          owner.status === 'active' ? 'suspended' : 'active'
                        )}
                      >
                        {owner.status === 'active' ? (
                          <UserX className="w-4 h-4 text-destructive" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
